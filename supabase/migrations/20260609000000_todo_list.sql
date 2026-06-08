-- manual_todos: full CRUD todos per user per org
CREATE TABLE manual_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE manual_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manual_todos_select" ON manual_todos FOR SELECT
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "manual_todos_insert" ON manual_todos FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "manual_todos_update" ON manual_todos FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "manual_todos_delete" ON manual_todos FOR DELETE
  USING (created_by = auth.uid());

-- todo_dismissals: user's manual × dismissal of a specific smart todo instance
CREATE TABLE todo_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  smart_type text NOT NULL,
  entity_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, smart_type, entity_id)
);

ALTER TABLE todo_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todo_dismissals_select" ON todo_dismissals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "todo_dismissals_insert" ON todo_dismissals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "todo_dismissals_delete" ON todo_dismissals FOR DELETE
  USING (user_id = auth.uid());
