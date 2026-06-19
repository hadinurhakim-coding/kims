# KIMS MVP Roadmap

KIMS (Kim's Music Station) is a free sound library platform for content creators worldwide. The MVP will provide a searchable catalog of high-quality music and sound effects that creators can stream, favorite, organize into playlists, and download under one clear KIMS Free License.

Planning date: 2026-06-18

## MVP Defaults

- [ ] Launch as a production-quality MVP using only free-tier services.
- [ ] Keep the initial catalog to 50-100 compressed tracks.
- [ ] Treat "thousands of tracks" as a post-MVP scaling milestone.
- [ ] Use one public GitHub monorepo.
- [ ] Allow public visitors to browse, stream, and download without login.
- [ ] Allow creators to register for favorites, history, and playlists.
- [ ] Reserve upload, publishing, and content management for admins.
- [ ] Use one KIMS Free License for every MVP track.

## Step 1: Project Setup

- [x] Initialize a public GitHub repository.
- [x] Add root documentation: `README.md`, `CODEX.md`, `ROADMAP.md`, and `docs/`.
- [x] Create a monorepo layout with `apps/web` and `apps/api`.
- [x] Scaffold `apps/web` with Next.js, TypeScript, TailwindCSS, and Wavesurfer.js.
- [x] Scaffold `apps/api` with Go, Chi, PostgreSQL driver, migrations, and tests.
- [x] Add `.env.example` files for frontend and backend.
- [x] Add `.gitignore` for env files, build outputs, caches, logs, and local storage.
- [x] Add GitHub Actions for frontend lint/typecheck/build and backend tests.

## Step 2: Free-Tier Infrastructure

- [ ] Create a Vercel Hobby project for the frontend.
- [ ] Create a Vercel Go Runtime project for the Go backend.
- [ ] Create one Supabase Free project for PostgreSQL and Storage.
- [ ] Create private Supabase Storage buckets named `audio` and `covers`.
- [x] Defer Resend until KIMS has a custom sending domain.
- [x] Configure Sentry Developer plan for frontend and backend errors.
- [ ] Configure Umami analytics for privacy-friendly product events.
- [ ] Skip cron-job.org while the backend runs on Vercel Go Runtime.
- [ ] Verify all vendor limits again before launch.

## Step 3: Free-Tier Guardrails

- [ ] Store compressed delivery audio only, not WAV/AIFF masters.
- [ ] Target MP3 192-320 kbps.
- [ ] Keep each track under 12 MB where practical.
- [ ] Keep total MVP storage under about 900 MB.
- [ ] Generate short-lived signed URLs for audio and cover access.
- [ ] Do not persist uploaded files on the backend filesystem.
- [ ] Monitor Supabase storage and egress manually during beta usage.
- [ ] Keep backend work lightweight enough for Vercel Function limits.

## Step 4: Backend MVP

- [ ] Add `GET /healthz` for uptime checks.
- [ ] Add `GET /readyz` for database/storage readiness.
- [ ] Add structured logging, request IDs, CORS, panic recovery, and rate limiting.
- [x] Add Sentry error reporting.
- [ ] Implement custom JWT auth with `admin` and `creator` roles.
- [ ] Store refresh tokens as hashed records and deliver them with HttpOnly Secure cookies.
- [ ] Implement email verification and password reset after a custom email domain is available.
- [ ] Implement public catalog APIs.
- [ ] Implement creator APIs for favorites, history, and playlists.
- [ ] Implement admin APIs for uploads, publishing, metadata edits, and archive/delete.
- [ ] Add audit logs for admin actions.

## Step 5: Database MVP

- [ ] Create `users`.
- [ ] Create `refresh_tokens`.
- [ ] Create `email_verification_tokens`.
- [ ] Create `password_reset_tokens`.
- [ ] Create `tracks`.
- [ ] Create `tags`.
- [ ] Create `track_tags`.
- [ ] Create `license_documents`.
- [ ] Create `favorites`.
- [ ] Create `play_history`.
- [ ] Create `playlists`.
- [ ] Create `playlist_items`.
- [ ] Create `audit_logs`.
- [ ] Add indexes for search, filters, ownership, and common foreign keys.

## Step 6: Public Frontend

- [ ] Build the first screen as the catalog, not a marketing-only landing page.
- [ ] Add catalog search and filters for type, genre, mood, duration, newest, and popular.
- [ ] Add track detail pages with waveform, metadata, license summary, and actions.
- [ ] Use Wavesurfer.js in client-only lazy-loaded components.
- [ ] Add a native audio fallback when waveform loading fails.
- [ ] Add public download flow with license acknowledgement.
- [ ] Add responsive layouts for mobile and desktop.
- [ ] Add accessible labels, focus states, keyboard operation, and reduced-motion behavior.

## Step 7: Creator Features

- [ ] Add creator registration.
- [ ] Add login, logout, refresh, and current-user session handling.
- [ ] Add email verification UI.
- [ ] Add forgot-password and reset-password UI.
- [ ] Add favorites list.
- [ ] Add play/download history.
- [ ] Add playlist create, rename, delete, and item management.
- [ ] Prevent creators from accessing admin routes and admin APIs.

## Step 8: Admin Features

- [ ] Add admin dashboard shell.
- [ ] Add track upload form for audio, cover art, metadata, tags, and publish status.
- [ ] Add draft, publish, and unpublish workflow.
- [ ] Add edit flow for title, slug, description, type, genre, mood, BPM, duration, and tags.
- [ ] Add archive/delete flow with confirmation.
- [ ] Add basic metrics: plays, downloads, favorites, and published tracks.
- [ ] Add clear error states for upload, validation, storage, and API failures.

## Step 9: Analytics, Monitoring, And Privacy

- [ ] Track page views with Umami.
- [ ] Track search, play, download, favorite, playlist create, signup, and login events.
- [ ] Avoid logging JWTs, refresh tokens, passwords, signed URLs, or personal messages.
- [x] Add frontend Sentry error boundary.
- [x] Add backend Sentry recovery middleware.
- [ ] Document what analytics are collected.
- [ ] Keep analytics privacy-friendly and avoid unnecessary personal data.

## Step 10: CI/CD And Launch

- [ ] Run frontend lint, typecheck, test, and production build in CI.
- [ ] Run backend tests in CI.
- [ ] Deploy frontend previews through Vercel.
- [ ] Deploy backend from `main` through Vercel Go Runtime.
- [ ] Apply Supabase migrations intentionally, not automatically from unreviewed branches.
- [ ] Confirm all production env vars are set in Vercel.
- [ ] Confirm backend `/healthz` responds after deploy.
- [ ] Smoke test browse, play, download, signup, login, favorite, playlist, and admin upload.
- [ ] Record known free-tier limits in release notes.

## Public API Checklist

- [ ] `GET /healthz`
- [ ] `GET /readyz`
- [ ] `GET /v1/tracks`
- [ ] `GET /v1/tracks/{slug}`
- [ ] `POST /v1/tracks/{id}/asset-url`
- [ ] `POST /v1/tracks/{id}/play`
- [ ] `POST /v1/tracks/{id}/download`

## Auth API Checklist

- [ ] `POST /v1/auth/register`
- [ ] `POST /v1/auth/login`
- [ ] `POST /v1/auth/logout`
- [ ] `POST /v1/auth/refresh`
- [ ] `GET /v1/me`
- [ ] `POST /v1/auth/verify-email`
- [ ] `POST /v1/auth/forgot-password`
- [ ] `POST /v1/auth/reset-password`

## Creator API Checklist

- [ ] `GET /v1/me/favorites`
- [ ] `POST /v1/me/favorites/{track_id}`
- [ ] `DELETE /v1/me/favorites/{track_id}`
- [ ] `GET /v1/me/history`
- [ ] `GET /v1/me/playlists`
- [ ] `POST /v1/me/playlists`
- [ ] `PATCH /v1/me/playlists/{id}`
- [ ] `DELETE /v1/me/playlists/{id}`
- [ ] `POST /v1/me/playlists/{id}/items`
- [ ] `DELETE /v1/me/playlists/{id}/items/{track_id}`

## Admin API Checklist

- [ ] `GET /v1/admin/tracks`
- [ ] `POST /v1/admin/tracks`
- [ ] `PATCH /v1/admin/tracks/{id}`
- [ ] `POST /v1/admin/tracks/{id}/publish`
- [ ] `POST /v1/admin/tracks/{id}/unpublish`
- [ ] `DELETE /v1/admin/tracks/{id}`

## Test Checklist

- [ ] Unit test JWT signing, validation, expiry, and roles.
- [ ] Unit test password hashing and token hashing.
- [ ] Unit test upload validation and metadata validation.
- [ ] Integration test track search and filters.
- [ ] Integration test creator favorites, history, and playlists.
- [ ] Integration test admin upload and publish flow.
- [ ] Frontend test catalog filtering and loading/error/empty states.
- [ ] Frontend test auth forms and validation messages.
- [ ] Frontend test player fallback behavior.
- [ ] E2E smoke test browse, play, download, signup, login, favorite, playlist, and admin upload.
- [ ] Manual accessibility check keyboard navigation, focus, contrast, zoom, and mobile layout.

## Post-MVP Scaling

- [ ] Add background audio processing.
- [ ] Add CDN or paid storage once catalog growth exceeds free-tier limits.
- [ ] Add advanced search with full-text search or external indexing.
- [ ] Add attribution variants or track-specific licenses only if required.
- [ ] Add creator upload submissions only after moderation rules exist.
- [ ] Add paid-tier migration plan before the catalog grows beyond free-tier capacity.
