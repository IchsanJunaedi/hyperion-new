-- =============================================================================
-- 20260522100000_hero_statistics.sql
-- Hero statistics infrastructure:
--   1. scrim_draft_bans  — proper ban tracking (replaces ban-as-picks hack)
--   2. Performance indexes on pick + ban tables
--   3. get_hero_statistics(org_id) — aggregate pick/ban stats per hero
--   4. get_hero_detail(org_id, hero_name) — synergy/counter detail
-- =============================================================================

-- ── 1. scrim_draft_bans table ─────────────────────────────────────────────────

CREATE TABLE scrim_draft_bans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id    UUID        NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number INTEGER     NOT NULL,
  side        TEXT        NOT NULL CHECK (side IN ('our', 'enemy')),
  hero_name   TEXT        NOT NULL,
  ban_order   INTEGER     NOT NULL CHECK (ban_order BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, game_number, side, ban_order)
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

-- scrim_draft_bans indexes
CREATE INDEX idx_sdb_scrim      ON scrim_draft_bans(scrim_id);
CREATE INDEX idx_sdb_hero       ON scrim_draft_bans(hero_name);
CREATE INDEX idx_sdb_scrim_hero ON scrim_draft_bans(scrim_id, hero_name);

-- scrim_draft_picks: add hero_name index for GROUP BY in RPC
CREATE INDEX IF NOT EXISTS idx_sdp_hero ON scrim_draft_picks(hero_name);

-- ── 3. RLS on scrim_draft_bans ────────────────────────────────────────────────

ALTER TABLE scrim_draft_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view bans"
  ON scrim_draft_bans FOR SELECT
  USING (
    scrim_id IN (
      SELECT s.id FROM scrims s
      WHERE s.organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ── 4. RPC: get_hero_statistics ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_hero_statistics(p_org_id UUID)
RETURNS TABLE (
  hero_name       TEXT,
  pick_total      BIGINT,
  pick_wins       BIGINT,
  pick_losses     BIGINT,
  pick_wr         NUMERIC,
  pick_pct        NUMERIC,
  team_ban_total  BIGINT,
  team_ban_pct    NUMERIC,
  enemy_ban_total BIGINT,
  enemy_ban_pct   NUMERIC,
  pb_total        BIGINT,
  pb_pct          NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    org_scrims AS (
      SELECT s.id AS scrim_id
      FROM scrims s
      WHERE s.organization_id = p_org_id
        AND s.status = 'completed'
    ),
    total_games AS (
      SELECT COUNT(*) AS cnt
      FROM scrim_game_results sgr
      WHERE sgr.scrim_id IN (SELECT scrim_id FROM org_scrims)
    ),
    our_picks AS (
      SELECT
        sdp.hero_name,
        COUNT(*)                                          AS pick_total,
        COUNT(*) FILTER (WHERE sgr.is_win = true)        AS pick_wins,
        COUNT(*) FILTER (WHERE sgr.is_win = false)       AS pick_losses
      FROM scrim_draft_picks sdp
      JOIN scrim_game_results sgr
        ON sgr.scrim_id    = sdp.scrim_id
       AND sgr.game_number = sdp.game_number
      WHERE sdp.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdp.side = 'our'
      GROUP BY sdp.hero_name
    ),
    team_bans AS (
      SELECT sdb.hero_name, COUNT(*) AS ban_total
      FROM scrim_draft_bans sdb
      WHERE sdb.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdb.side = 'our'
      GROUP BY sdb.hero_name
    ),
    enemy_bans AS (
      SELECT sdb.hero_name, COUNT(*) AS ban_total
      FROM scrim_draft_bans sdb
      WHERE sdb.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdb.side = 'enemy'
      GROUP BY sdb.hero_name
    ),
    all_heroes AS (
      SELECT hero_name FROM our_picks
      UNION SELECT hero_name FROM team_bans
      UNION SELECT hero_name FROM enemy_bans
    )
  SELECT
    ah.hero_name,
    COALESCE(op.pick_total,  0)                                                    AS pick_total,
    COALESCE(op.pick_wins,   0)                                                    AS pick_wins,
    COALESCE(op.pick_losses, 0)                                                    AS pick_losses,
    CASE WHEN COALESCE(op.pick_total, 0) = 0 THEN 0
         ELSE ROUND(COALESCE(op.pick_wins, 0)::NUMERIC / op.pick_total * 100, 1)
    END                                                                            AS pick_wr,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(COALESCE(op.pick_total, 0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                            AS pick_pct,
    COALESCE(tb.ban_total, 0)                                                      AS team_ban_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(COALESCE(tb.ban_total, 0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                            AS team_ban_pct,
    COALESCE(eb.ban_total, 0)                                                      AS enemy_ban_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(COALESCE(eb.ban_total, 0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                            AS enemy_ban_pct,
    COALESCE(op.pick_total, 0) + COALESCE(tb.ban_total, 0) + COALESCE(eb.ban_total, 0)
                                                                                   AS pb_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(
           (COALESCE(op.pick_total, 0) + COALESCE(tb.ban_total, 0) + COALESCE(eb.ban_total, 0))::NUMERIC
           / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                            AS pb_pct
  FROM all_heroes ah
  LEFT JOIN our_picks  op ON op.hero_name = ah.hero_name
  LEFT JOIN team_bans  tb ON tb.hero_name = ah.hero_name
  LEFT JOIN enemy_bans eb ON eb.hero_name = ah.hero_name
  ORDER BY pb_total DESC, pick_total DESC;
$$;

-- ── 5. RPC: get_hero_detail ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_hero_detail(p_org_id UUID, p_hero_name TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    org_scrims AS (
      SELECT s.id AS scrim_id
      FROM scrims s
      WHERE s.organization_id = p_org_id
        AND s.status = 'completed'
    ),
    -- All game instances where this hero was picked on our side
    hero_game_instances AS (
      SELECT sdp.scrim_id, sdp.game_number, sdp.player_id, sgr.is_win
      FROM scrim_draft_picks sdp
      JOIN scrim_game_results sgr
        ON sgr.scrim_id    = sdp.scrim_id
       AND sgr.game_number = sdp.game_number
      WHERE sdp.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdp.side      = 'our'
        AND sdp.hero_name = p_hero_name
    ),
    -- 1. Played by player
    played_by_player AS (
      SELECT
        COALESCE(pr.display_name, 'Unknown')                                     AS display_name,
        COUNT(*)::INT                                                             AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT                           AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT                          AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                                       AS win_rate
      FROM hero_game_instances hgi
      JOIN profiles pr ON pr.id = hgi.player_id
      WHERE hgi.player_id IS NOT NULL
      GROUP BY hgi.player_id, pr.display_name
      ORDER BY total DESC
    ),
    -- 2. Played with (self-join: same game our side, different hero)
    played_with AS (
      SELECT
        companion.hero_name,
        COUNT(*)::INT                                                             AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT                           AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT                          AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                                       AS win_rate
      FROM hero_game_instances hgi
      JOIN scrim_draft_picks companion
        ON companion.scrim_id    = hgi.scrim_id
       AND companion.game_number = hgi.game_number
       AND companion.side        = 'our'
       AND companion.hero_name  <> p_hero_name
      GROUP BY companion.hero_name
      ORDER BY total DESC
      LIMIT 10
    ),
    -- 3. Played against (enemy picks in same game)
    played_against AS (
      SELECT
        enemy_pick.hero_name,
        COUNT(*)::INT                                                             AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT                           AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT                          AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                                       AS win_rate
      FROM hero_game_instances hgi
      JOIN scrim_draft_picks enemy_pick
        ON enemy_pick.scrim_id    = hgi.scrim_id
       AND enemy_pick.game_number = hgi.game_number
       AND enemy_pick.side        = 'enemy'
      GROUP BY enemy_pick.hero_name
      ORDER BY total DESC
      LIMIT 10
    )
  SELECT json_build_object(
    'played_by_player',
      COALESCE((SELECT json_agg(row_to_json(pbp.*)) FROM played_by_player pbp), '[]'::json),
    'played_with',
      COALESCE((SELECT json_agg(row_to_json(pw.*))  FROM played_with pw),        '[]'::json),
    'played_against',
      COALESCE((SELECT json_agg(row_to_json(pa.*))  FROM played_against pa),     '[]'::json)
  );
$$;
