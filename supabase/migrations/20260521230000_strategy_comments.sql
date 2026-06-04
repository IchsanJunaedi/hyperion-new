-- Strategy note comments: threaded discussion on strategy notes
CREATE TABLE IF NOT EXISTS strategy_comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    uuid        NOT NULL REFERENCES strategy_notes(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  content    text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE strategy_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read comments"
  ON strategy_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert own comments"
  ON strategy_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments"
  ON strategy_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_strategy_comments_note_id ON strategy_comments(note_id);
