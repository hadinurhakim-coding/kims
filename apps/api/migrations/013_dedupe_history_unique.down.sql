DROP INDEX IF EXISTS idx_history_user_track_session_unique;

ALTER TABLE history
DROP COLUMN IF EXISTS session_label,
DROP COLUMN IF EXISTS played_date;
