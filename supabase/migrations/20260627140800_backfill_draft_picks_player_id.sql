-- Backfill existing NULL player_ids in scrim_draft_picks based on active roster main_roles
UPDATE public.scrim_draft_picks sdp
SET player_id = tm.user_id
FROM public.scrims s
JOIN public.team_members tm
  ON tm.organization_id = s.organization_id
  AND tm.is_active = true
  AND tm.role IN ('captain', 'member')
WHERE sdp.scrim_id = s.id
  AND sdp.side = 'our'
  AND sdp.player_id IS NULL
  AND tm.main_role = sdp.role;
