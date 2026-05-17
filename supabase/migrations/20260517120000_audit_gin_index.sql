-- GIN index for fast full-text search on metadata JSONB column
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin
  ON audit_logs USING GIN (metadata);
