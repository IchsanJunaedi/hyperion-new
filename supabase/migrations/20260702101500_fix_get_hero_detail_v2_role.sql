-- Fix get_hero_detail_v2 to include player role in grouping and output
CREATE OR REPLACE FUNCTION get_hero_detail_v2(p_org_id UUID, p_hero_name TEXT, p_patch_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
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
      SELECT sdp.scrim_id, sdp.game_number, sdp.player_id, sdp.role, sgr.is_win
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
  SELECT 
    json_build_object(
      'played_by_player', COALESCE((SELECT json_agg(pbp) FROM played_by_player pbp), '[]'::json),
      'played_with', COALESCE((SELECT json_agg(pw) FROM played_with pw), '[]'::json),
      'played_against', COALESCE((SELECT json_agg(pa) FROM played_against pa), '[]'::json)
    )
  INTO v_result;

  RETURN v_result;
END;
$$;
