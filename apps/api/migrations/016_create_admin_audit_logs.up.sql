CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_user_id
ON admin_audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
ON admin_audit_logs(created_at DESC);
