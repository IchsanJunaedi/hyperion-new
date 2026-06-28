-- 1. get_hero_statistics_v2
CREATE OR REPLACE FUNCTION get_hero_statistics_v2(p_org_id UUID, p_patch_id UUID DEFAULT NULL)
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
        AND (p_patch_id IS NULL OR s.patch_id = p_patch_id)
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
    COALESCE(op.pick_total, 0)::BIGINT                                            AS pick_total,
    COALESCE(op.pick_wins, 0)::BIGINT                                             AS pick_wins,
    COALESCE(op.pick_losses, 0)::BIGINT                                           AS pick_losses,
    CASE WHEN COALESCE(op.pick_total, 0) = 0 THEN 0::NUMERIC
         ELSE ROUND(op.pick_wins::NUMERIC / op.pick_total * 100, 1)
    END                                                                           AS pick_wr,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0::NUMERIC
         ELSE ROUND(COALESCE(op.pick_total, 0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                           AS pick_pct,
    COALESCE(tb.ban_total, 0)::BIGINT                                             AS team_ban_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0::NUMERIC
         ELSE ROUND(COALESCE(tb.ban_total, 0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                           AS team_ban_pct,
    COALESCE(eb.ban_total, 0)::BIGINT                                             AS enemy_ban_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0::NUMERIC
         ELSE ROUND(COALESCE(eb.ban_total, 0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                           AS enemy_ban_pct,
    (COALESCE(op.pick_total, 0) + COALESCE(tb.ban_total, 0) + COALESCE(eb.ban_total, 0))::BIGINT AS pb_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0::NUMERIC
         ELSE ROUND((COALESCE(op.pick_total, 0) + COALESCE(tb.ban_total, 0) + COALESCE(eb.ban_total, 0))::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                           AS pb_pct
  FROM all_heroes ah
  LEFT JOIN our_picks op  ON op.hero_name  = ah.hero_name
  LEFT JOIN team_bans tb  ON tb.hero_name  = ah.hero_name
  LEFT JOIN enemy_bans eb ON eb.hero_name  = ah.hero_name
  WHERE op.pick_total > 0 OR tb.ban_total > 0 OR eb.ban_total > 0
  ORDER BY pb_total DESC, pick_total DESC;
$$;
 
-- 2. get_hero_detail_v2
CREATE OR REPLACE FUNCTION get_hero_detail_v2(p_org_id UUID, p_hero_name TEXT, p_patch_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_played_by_player JSON;
  v_played_with      JSON;
  v_played_against   JSON;
BEGIN
  WITH
    org_scrims AS (
      SELECT s.id AS scrim_id
      FROM scrims s
      WHERE s.organization_id = p_org_id
        AND s.status = 'completed'
        AND (p_patch_id IS NULL OR s.patch_id = p_patch_id)
    ),
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
  SELECT COALESCE(json_agg(pbp), '[]'::json) INTO v_played_by_player FROM played_by_player pbp;
  SELECT COALESCE(json_agg(pw), '[]'::json) INTO v_played_with FROM played_with pw;
  SELECT COALESCE(json_agg(pa), '[]'::json) INTO v_played_against FROM played_against pa;
 
  RETURN json_build_object(
    'played_by_player', v_played_by_player,
    'played_with', v_played_with,
    'played_against', v_played_against
  );
END;
$$;
