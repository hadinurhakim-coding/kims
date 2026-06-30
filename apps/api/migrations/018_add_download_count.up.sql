ALTER TABLE tracks
ADD COLUMN download_count INTEGER
  NOT NULL DEFAULT 0;

CREATE INDEX idx_tracks_download_count
  ON tracks(download_count DESC);
