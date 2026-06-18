# KIMS Architecture

KIMS is planned as a small production-quality monorepo that can grow into a larger platform without adding paid services during the MVP.

## System Overview

```text
Browser
  -> Next.js web app on Vercel
  -> Go Chi API on Vercel Go Runtime
  -> Supabase PostgreSQL
  -> Supabase Storage private buckets

External services:
  Resend for email
  Umami for analytics
  Sentry for monitoring
  no backend keep-alive service required on Vercel
```

## Repository Layout

```text
kims/
  apps/
    web/
    api/
  docs/
    architecture.md
    database.md
    api.md
  CODEX.md
  README.md
  ROADMAP.md
```

## Frontend Architecture

- Next.js app lives in `apps/web`.
- Route files should compose feature components and stay thin.
- Catalog search/filter state should live in the URL.
- Feature modules should own product behavior such as catalog, auth, creator library, playlists, and admin tracks.
- Shared UI primitives should not import feature logic or API clients.
- Wavesurfer.js must be client-only and lazy-loaded.
- Native audio playback must remain available when waveform rendering fails.

Recommended frontend feature groups:

- `catalog`: search, filters, track cards, track detail, player.
- `auth`: login, register, email verification, password reset.
- `creator-library`: favorites, history, playlists.
- `admin`: upload, edit, publish, metrics.
- `shared`: API client, UI primitives, formatting, validation helpers.

## Backend Architecture

- Go Chi API lives in `apps/api`.
- Use middleware for request ID, logging, panic recovery, CORS, rate limiting, auth, and Sentry.
- Keep HTTP handlers thin.
- Put business rules in services.
- Put PostgreSQL access behind repository/query modules.
- Use migrations for schema changes.
- Keep Supabase service-role access backend-only.
- Do not store uploaded files on the backend filesystem.

Recommended backend package groups:

- `cmd/api`: API entrypoint.
- `internal/http`: router, middleware, handlers.
- `internal/auth`: JWT, passwords, refresh tokens, roles.
- `internal/catalog`: track search, signed URLs, play/download events.
- `internal/creator`: favorites, history, playlists.
- `internal/admin`: uploads, publishing, audit logs.
- `internal/storage`: Supabase Storage integration.
- `internal/db`: database connection and generated/manual queries.

## Data Flow

- Public catalog pages call the API for track metadata.
- Playback and downloads request short-lived signed asset URLs from the API.
- The API validates access rules and asks Supabase Storage for signed URLs.
- Creator actions require a valid JWT and are scoped to the current user.
- Admin actions require an admin JWT and write to `audit_logs`.
- Umami records product events without sensitive payloads.
- Sentry records runtime errors without secrets or tokens.

## Deployment

- Vercel deploys `apps/web`.
- Vercel Go Runtime deploys `apps/api`.
- Supabase hosts PostgreSQL and Storage.
- GitHub Actions validates pull requests and `main`.
- Backend `/healthz` is used for direct uptime checks.

## Security And Privacy

- Access tokens should be short-lived.
- Refresh tokens should be hashed in the database and stored in HttpOnly Secure cookies.
- Passwords must be hashed with a modern password hashing algorithm.
- Signed storage URLs should be short-lived.
- Do not expose Supabase service keys to the frontend.
- Do not log JWTs, refresh tokens, passwords, signed URLs, or personal messages.
- Use backend validation for all state-changing requests.

## Free-Tier Constraints

- Keep MVP catalog storage under about 900 MB.
- Use compressed delivery audio only.
- Avoid background workers that require paid infrastructure.
- Keep email volume below Resend Free limits.
- Recheck Vercel, Supabase, Resend, Sentry, Umami, and GitHub Actions limits before launch.
