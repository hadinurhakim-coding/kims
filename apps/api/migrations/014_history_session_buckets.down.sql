DROP INDEX IF EXISTS idx_history_user_track_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_history_user_track_session_unique
ON history(user_id, track_id, played_date, session_label);
