CREATE TABLE notification_preferences (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  wa_enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, org_id, event_type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_self" ON notification_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
