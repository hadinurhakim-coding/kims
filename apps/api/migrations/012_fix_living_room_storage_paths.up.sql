UPDATE tracks
SET
  cover_url = 'lofi/the-living-room-titl.png',
  audio_url = 'lofi/the-living-room-titl.mp3',
  updated_at = NOW()
WHERE title = 'The Living Room';
