CREATE TYPE track_type AS ENUM (
  'Music', 'SFX', 'Lofi', 'Cinematic'
);

CREATE TYPE license_label AS ENUM (
  'No Attribution',
  'Commercial Use',
  'Attribution Required'
);

CREATE TYPE sfx_category AS ENUM (
  'Impact', 'Ambient', 'Foley',
  'UI', 'Nature', 'Transition'
);

CREATE TABLE tracks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  type          track_type NOT NULL,
  mood          TEXT NOT NULL,
  sfx_category  sfx_category,
  duration      TEXT NOT NULL,
  license_label license_label NOT NULL,
  cover_url     TEXT NOT NULL,
  audio_url     TEXT NOT NULL,
  is_published  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracks_type ON tracks(type);
CREATE INDEX idx_tracks_mood ON tracks(mood);
CREATE INDEX idx_tracks_license ON tracks(license_label);
