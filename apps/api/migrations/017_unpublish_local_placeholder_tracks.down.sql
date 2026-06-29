UPDATE tracks
SET
  is_published = true,
  updated_at = NOW()
WHERE cover_url LIKE '/%'
   OR audio_url LIKE '/%';
