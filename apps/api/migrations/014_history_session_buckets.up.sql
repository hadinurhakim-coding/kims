DROP INDEX IF EXISTS idx_history_user_track_unique;

ALTER TABLE history
ADD COLUMN IF NOT EXISTS played_date DATE,
ADD COLUMN IF NOT EXISTS session_label TEXT;

UPDATE history
SET
  played_date = (played_at AT TIME ZONE 'Asia/Jakarta')::date,
  session_label = CASE
    WHEN EXTRACT(HOUR FROM played_at AT TIME ZONE 'Asia/Jakarta') < 12 THEN 'Morning'
    WHEN EXTRACT(HOUR FROM played_at AT TIME ZONE 'Asia/Jakarta') < 17 THEN 'Afternoon'
    ELSE 'Evening'
  END
WHERE played_date IS NULL
  OR session_label IS NULL;

ALTER TABLE history
ALTER COLUMN played_date SET NOT NULL,
ALTER COLUMN session_label SET NOT NULL;

WITH ranked_history AS (
  SELECT
    id,
    user_id,
    track_id,
    played_date,
    session_label,
    SUM(play_count) OVER (
      PARTITION BY user_id, track_id, played_date, session_label
    )::int AS total_play_count,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, track_id, played_date, session_label
      ORDER BY played_at DESC, id DESC
    ) AS row_number
  FROM history
)
UPDATE history h
SET play_count = rh.total_play_count
FROM ranked_history rh
WHERE h.id = rh.id
  AND rh.row_number = 1;

WITH ranked_history AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, track_id, played_date, session_label
      ORDER BY played_at DESC, id DESC
    ) AS row_number
  FROM history
)
DELETE FROM history h
USING ranked_history rh
WHERE h.id = rh.id
  AND rh.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_history_user_track_session_unique
ON history(user_id, track_id, played_date, session_label);
