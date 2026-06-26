UPDATE tracks
SET
  cover_url = 'lofi/track-cover-1.png',
  updated_at = NOW()
WHERE audio_url = 'lofi/the-living-room-titl.mp3';
