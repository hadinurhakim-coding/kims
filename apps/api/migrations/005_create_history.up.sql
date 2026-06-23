CREATE TABLE history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id   UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  play_count INTEGER NOT NULL DEFAULT 1,
  played_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_played_at ON history(played_at DESC);
