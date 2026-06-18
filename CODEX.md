# CODEX Context For KIMS

Use this file as durable context for coding sessions in this repository.

## Product Intent

KIMS (Kim's Music Station) is a free sound library for content creators. The MVP must help creators quickly find, preview, save, organize, and download copyright-safe music and sound effects.

The first public screen should be the usable catalog, not a marketing-only landing page.

## Non-Negotiables

- Use only free-tier services for the MVP.
- Keep the first catalog to 50-100 compressed tracks.
- Treat "thousands of tracks" as post-MVP.
- Public users can browse, stream, and download without login.
- Creators log in only for favorites, history, and playlists.
- Admins control uploads, metadata, publishing, and deletion.
- Use custom JWT auth in Go, not Supabase Auth.
- Use one KIMS Free License for all MVP tracks.
- Never store secrets in source code or client-visible environment variables.

## Stack Decisions

- Frontend: Next.js, TypeScript, TailwindCSS, Wavesurfer.js.
- Backend: Go with Chi.
- Database: Supabase PostgreSQL.
- Storage: Supabase Storage with private `audio` and `covers` buckets.
- Auth: custom JWT access tokens and hashed refresh tokens.
- Email: Resend.
- Analytics: Umami.
- Monitoring: Sentry.
- Hosting: Vercel for web, Render for API.
- Keep-alive: cron-job.org calls `GET /healthz` every 10 minutes.

## Architecture Rules

- Use a monorepo with `apps/web` and `apps/api`.
- Keep route/page files thin.
- Keep feature logic inside feature-owned modules.
- Keep shared UI generic and free of product-specific API imports.
- Treat all API, database, storage, URL, and user input as untrusted.
- Map transport DTOs to domain models when API shape should not leak into UI.
- Prefer boring, explicit code over clever abstractions.
- Add abstractions only when they remove real duplication or isolate meaningful complexity.

## Frontend Rules

- Use TypeScript strict mode.
- Use server components by default where appropriate.
- Use client components for interactivity and Wavesurfer.js.
- Lazy-load Wavesurfer.js and provide a native audio fallback.
- Model loading, empty, error, disabled, and success states.
- Use URL state for catalog search, filters, sorting, and pagination.
- Target WCAG 2.2 AA.
- Preserve keyboard navigation and visible focus.
- Honor `prefers-reduced-motion`.

## Backend Rules

- Use Go Chi with explicit middleware.
- Add request IDs, structured logs, panic recovery, CORS, rate limiting, and Sentry.
- Use `GET /healthz` for cron and liveness.
- Use `GET /readyz` for dependency readiness.
- Never persist uploaded files on Render's filesystem.
- Generate short-lived signed Supabase Storage URLs.
- Store password hashes and refresh token hashes only.
- Protect admin APIs with role checks.
- Write admin changes to audit logs.

## Database Rules

- Use committed SQL migrations.
- Keep table and column names snake_case.
- Use UUID primary keys unless there is a strong reason not to.
- Use `created_at` and `updated_at` timestamps on mutable tables.
- Add indexes for common filters and foreign keys.
- Enforce creator ownership for favorites, history, and playlists at the API layer.
- Keep Supabase service keys backend-only.

## Testing And Verification

- Backend: unit test auth, token handling, validation, and storage signing.
- Backend: integration test catalog, creator library, and admin publish flow.
- Frontend: test catalog filters, auth forms, player fallback, and creator actions.
- E2E: smoke test browse, play, download, signup, login, favorite, playlist, and admin upload.
- Before completion, run the checks that exist and report any that do not exist yet.

## Documentation Rules

- Keep `ROADMAP.md` updated when scope changes.
- Keep `docs/architecture.md` updated when boundaries or deployment change.
- Keep `docs/database.md` updated when tables or migrations change.
- Keep `docs/api.md` updated when endpoints or response shapes change.
- Document env vars without secret values.
