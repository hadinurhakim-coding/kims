# KIMS Database Plan

KIMS uses PostgreSQL through Supabase. Supabase Auth is intentionally not used; authentication is custom JWT from the Go backend.

## Conventions

- Use SQL migrations committed to the repository.
- Use UUID primary keys.
- Use snake_case names.
- Add `created_at` and `updated_at` to mutable tables.
- Use `deleted_at` or archive status for recoverable destructive actions.
- Add indexes for foreign keys and common search/filter fields.
- Store Supabase service credentials only in backend deployment secrets.

## Core Tables

### `users`

- [ ] `id` UUID primary key.
- [ ] `email` unique, normalized lowercase.
- [ ] `password_hash`.
- [ ] `display_name`.
- [ ] `role`: `admin` or `creator`.
- [ ] `email_verified_at`.
- [ ] `created_at`.
- [ ] `updated_at`.

### `refresh_tokens`

- [ ] `id` UUID primary key.
- [ ] `user_id` references `users`.
- [ ] `token_hash`.
- [ ] `expires_at`.
- [ ] `revoked_at`.
- [ ] `created_at`.

### `email_verification_tokens`

- [ ] `id` UUID primary key.
- [ ] `user_id` references `users`.
- [ ] `token_hash`.
- [ ] `expires_at`.
- [ ] `used_at`.
- [ ] `created_at`.

### `password_reset_tokens`

- [ ] `id` UUID primary key.
- [ ] `user_id` references `users`.
- [ ] `token_hash`.
- [ ] `expires_at`.
- [ ] `used_at`.
- [ ] `created_at`.

## Catalog Tables

### `tracks`

- [ ] `id` UUID primary key.
- [ ] `title`.
- [ ] `slug` unique.
- [ ] `description`.
- [ ] `type`: `music`, `sfx`, or `loop`.
- [ ] `genre`.
- [ ] `mood`.
- [ ] `bpm`.
- [ ] `duration_seconds`.
- [ ] `audio_object_path`.
- [ ] `cover_object_path`.
- [ ] `file_size_bytes`.
- [ ] `mime_type`.
- [ ] `license_id` references `license_documents`.
- [ ] `published_at`.
- [ ] `archived_at`.
- [ ] `created_by` references `users`.
- [ ] `created_at`.
- [ ] `updated_at`.

### `tags`

- [ ] `id` UUID primary key.
- [ ] `name` unique.
- [ ] `slug` unique.
- [ ] `created_at`.

### `track_tags`

- [ ] `track_id` references `tracks`.
- [ ] `tag_id` references `tags`.
- [ ] Composite primary key on `track_id`, `tag_id`.

### `license_documents`

- [ ] `id` UUID primary key.
- [ ] `name`.
- [ ] `slug` unique.
- [ ] `version`.
- [ ] `body`.
- [ ] `is_active`.
- [ ] `created_at`.
- [ ] `updated_at`.

## Creator Tables

### `favorites`

- [ ] `user_id` references `users`.
- [ ] `track_id` references `tracks`.
- [ ] `created_at`.
- [ ] Composite primary key on `user_id`, `track_id`.

### `play_history`

- [ ] `id` UUID primary key.
- [ ] `user_id` references `users`, nullable for public plays if retained.
- [ ] `track_id` references `tracks`.
- [ ] `event_type`: `play` or `download`.
- [ ] `created_at`.

### `playlists`

- [ ] `id` UUID primary key.
- [ ] `user_id` references `users`.
- [ ] `name`.
- [ ] `created_at`.
- [ ] `updated_at`.

### `playlist_items`

- [ ] `playlist_id` references `playlists`.
- [ ] `track_id` references `tracks`.
- [ ] `position`.
- [ ] `created_at`.
- [ ] Composite primary key on `playlist_id`, `track_id`.

## Admin Tables

### `audit_logs`

- [ ] `id` UUID primary key.
- [ ] `actor_user_id` references `users`.
- [ ] `action`.
- [ ] `entity_type`.
- [ ] `entity_id`.
- [ ] `metadata` JSONB.
- [ ] `created_at`.

## Index Checklist

- [ ] `users.email`.
- [ ] `refresh_tokens.user_id`.
- [ ] `tracks.slug`.
- [ ] `tracks.published_at`.
- [ ] `tracks.type`.
- [ ] `tracks.genre`.
- [ ] `tracks.mood`.
- [ ] `tracks.created_at`.
- [ ] `tags.slug`.
- [ ] `favorites.user_id`.
- [ ] `play_history.user_id`.
- [ ] `play_history.track_id`.
- [ ] `playlists.user_id`.
- [ ] `playlist_items.playlist_id`.
- [ ] `audit_logs.actor_user_id`.
- [ ] `audit_logs.entity_type, entity_id`.

## Seed Data Checklist

- [ ] Create one admin user.
- [ ] Create the active KIMS Free License document.
- [ ] Create initial tags, genres, and moods.
- [ ] Add 50-100 compressed tracks for launch.
- [ ] Keep seed metadata realistic enough for catalog testing.
