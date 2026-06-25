CREATE TABLE password_resets (
  id         UUID PRIMARY KEY
             DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL
             REFERENCES users(id)
             ON DELETE CASCADE,
  otp_hash   TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_user_id
  ON password_resets(user_id);
CREATE INDEX idx_password_resets_otp_hash
  ON password_resets(otp_hash);
