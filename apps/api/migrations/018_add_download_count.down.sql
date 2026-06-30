DROP INDEX IF EXISTS idx_tracks_download_count;
ALTER TABLE tracks DROP COLUMN download_count;
