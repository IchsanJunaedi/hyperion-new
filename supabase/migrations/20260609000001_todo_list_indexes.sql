-- Indexes for todo_list tables
CREATE INDEX IF NOT EXISTS idx_manual_todos_org ON manual_todos(org_id);
CREATE INDEX IF NOT EXISTS idx_manual_todos_created_by ON manual_todos(created_by);
CREATE INDEX IF NOT EXISTS idx_manual_todos_assigned_to ON manual_todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_todo_dismissals_user ON todo_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_dismissals_lookup ON todo_dismissals(user_id, smart_type, entity_id);
