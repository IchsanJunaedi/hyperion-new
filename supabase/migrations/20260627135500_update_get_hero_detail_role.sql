-- Update get_hero_detail RPC function to group by player and role
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
      SELECT sdp.scrim_id, sdp.game_number, sdp.player_id, sdp.role, sgr.is_win
      FROM scrim_draft_picks sdp
      JOIN scrim_game_results sgr
        ON sgr.scrim_id    = sdp.scrim_id
       AND sgr.game_number = sdp.game_number
      WHERE sdp.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdp.side      = 'our'
        AND sdp.hero_name = p_hero_name
    ),
    -- 1. Played by player (grouped by player & role)
    played_by_player AS (
      SELECT
        COALESCE(pr.display_name, 'Unknown')                                     AS display_name,
        hgi.role                                                                  AS role,
        COUNT(*)::INT                                                             AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT                           AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT                          AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                                       AS win_rate
      FROM hero_game_instances hgi
      JOIN profiles pr ON pr.id = hgi.player_id
      WHERE hgi.player_id IS NOT NULL
      GROUP BY hgi.player_id, pr.display_name, hgi.role
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
