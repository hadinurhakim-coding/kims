# KIMS Roadmap

KIMS (Kim's Music Station) is a free music and sound library for creators. This roadmap reflects the current repository state after the frontend, backend API, database migrations, and production integration work.

Last updated: 2026-06-29

## Status Legend

- [x] Done in the repository
- [~] Partially done or needs follow-up
- [!] Needs external verification in Vercel, Supabase, or GitHub
- [ ] Not started

## Current Snapshot

- [x] Monorepo is set up with `apps/web` and `apps/api`.
- [x] Frontend pages, auth UI, catalog UI, player UI, favorites, playlists, and history are implemented.
- [x] Go API is implemented with PostgreSQL, JWT auth, migrations, and public/protected route groups.
- [x] Frontend no longer relies on mock localStorage auth for login/register.
- [x] API routes are proxied from the Next.js app through `/api/v1`.
- [x] Seed migration exists for 40 initial tracks.
- [x] Forgot-password uses Brevo REST API OTP flow with 3-step frontend reset.
- [x] Explore uses a dynamic "Recommended For You" hero with a hybrid score from listening history, favorites, track metadata, recency, and current playback context.
- [x] Recommended hero explains why a track is suggested and falls back gracefully when there are no personal signals.
- [x] History now groups plays by track, Jakarta day, and session bucket, accumulates play counts, and records reliably after migration version 14.
- [x] Global playback uses a native audio element for reliable track switching while waveform components remain available for visualization.
- [x] Bottom player is compact and Explore content is visually verified so catalog items are not hidden behind it on desktop or mobile.
- [x] App scrolling disables elastic overscroll at page and panel boundaries.
- [x] Production smoke test passed for homepage, tracks, auth, forgot password, playback, favorites, playlists, and history.
- [~] Published catalog media is storage-backed; legacy placeholder seed rows are unpublished, while full bucket inventory verification is still needed.
- [~] CI exists for frontend lint/typecheck/build and backend tests.
- [x] Admin/content management has role guards, upload, track mutation APIs, admin UI, publish toggles, and audit logs.
- [~] Real production launch hardening is mostly complete; domain, SSL, SEO files, and monitoring verification remain.

## Frontend And UI/UX

- [x] Step 1 - UI/UX foundation
  - [x] Next.js app shell, layout, responsive pages, shared UI patterns, and core styling.
  - [x] Sidebar, bottom player, right panel, auth layout, and catalog components.
  - [x] Bottom player was compacted and repositioned; content views include a bottom safe area for it.
  - [x] Explore hero and track rows have compact responsive states for short desktop and mobile viewports.
  - [x] Root and scrollable panels disable elastic overscroll.
- [x] Explore recommendation iteration
  - [x] "Featured Track" is replaced by "Recommended For You".
  - [x] Hybrid ranking considers track type, mood, license, SFX category, favorites, listening frequency, recency, repeated-play penalty, and current track avoidance.
  - [x] The hero shows a short recommendation reason to make the suggestion easier to understand.
  - [x] Falls back to the visible catalog when the user has no personalized signals.
- [x] Step 2 - Music page
  - [x] Music catalog page and filters are implemented.
- [x] Step 3 - SFX page
  - [x] SFX page and category filtering are implemented.
- [x] Step 4 - Lofi page
  - [x] Lofi page is implemented.
- [x] Step 5 - Cinematic page
  - [x] Cinematic page and cinematic hero are implemented.
- [x] Step 6 - Favorites page
  - [x] Favorites UI is implemented and backed by API context.
- [x] Step 7 - Playlists page
  - [x] Playlist list/detail UI is implemented and backed by API context.
- [x] Step 8 - History page
  - [x] History UI is implemented and backed by API context.
  - [x] Repeated plays of the same track are consolidated by track/day/session with an aggregated play count.
  - [x] Today session buckets no longer duplicate into the "Earlier This Week" aggregate.
- [x] Step 9 - Auth UI
  - [x] Login and register pages are implemented.
  - [x] Forgot password uses a 3-step flow: email -> OTP -> new password.
- [x] Step 10 - Audio playback integration
  - [x] AudioContext uses a native HTML audio element to load, play, pause, seek, set volume, and switch active tracks.
  - [x] Browser media autoplay restrictions are handled so `NotAllowedError` and expected playback interruptions do not crash the UI.
  - [x] It can stream signed private Supabase audio URLs returned by the API.
  - [x] Manual browser testing confirmed first-track playback and switching to another track works.

## Backend

- [x] Step 11 - Go API + PostgreSQL + JWT
  - [x] 11.1 Dependencies installed: chi, pgx, jwt, migrate, Sentry, bcrypt, and related Go modules.
  - [x] 11.2 DB wired into router through dependency injection.
  - [x] 11.3 Database migrations exist.
  - [x] 11.4 Migration setup exists through `cmd/migrate`, Makefile targets, and startup migration handling.
  - [x] 11.5 Auth domain exists with register, login, refresh, and logout.
  - [x] 11.6 JWT middleware exists and attaches user context.
  - [x] 11.7 Tracks domain exists.
  - [x] 11.8 Favorites domain exists.
  - [x] 11.9 Playlists domain exists.
  - [x] 11.10 History domain exists.
  - [x] History repository buckets records by user, track, Jakarta day, and session label.
  - [x] History recording uses a transaction and advisory lock so play recording does not depend on an already-present unique index during schema catch-up.
  - [x] 11.11 Routes are wired under `/api/v1`.
  - [x] 11.12 Frontend mock auth has been replaced with real API auth.
  - [~] Auth is MVP-level: email verification, current-user endpoint, admin management UI, and HttpOnly refresh cookies are still pending.

## Forgot Password With Brevo

- [x] Forgot Password production flow
  - [x] FP.1 Configure Brevo account and Gmail sender.
  - [x] FP.2 Add Brevo config to Vercel environment variables.
  - [x] FP.3 Create OTP-based `password_resets` migration with OTP hash, expiry, and used flag.
  - [x] FP.4 Build email service in Go using Brevo REST API and HTML email template.
  - [x] FP.5 Build dedicated forgot password domain with handler, service, and repository.
  - [x] FP.6 Wire forgot password routes.
  - [x] FP.7 Frontend `/forgot-password` 3-step flow: email -> OTP -> new password.
  - [x] FP.8 Register debug console logs are removed.
  - [x] FP.9 Prevent resetting to the current password.

## Database

- [x] Migrations 001-017 exist.
- [x] Tables covered by migrations include users, tracks, favorites, playlists, playlist_tracks, history, refresh_tokens, password_resets, and schema_migrations.
- [x] Seed migration 007 inserts 40 catalog tracks.
- [x] Migration 008 creates `password_resets` for OTP-based forgot password.
- [x] Migrations 013-014 add history play bucket columns and the unique history bucket index.
- [x] Migration 015 adds user roles for admin authorization.
- [x] Migration 016 creates admin audit logs.
- [x] Migration 017 unpublishes tracks that still point at local placeholder media.
- [~] Seed data keeps legacy placeholder rows for rollback/dev history, but public catalog and playlist joins use storage-backed published tracks.
- [x] Supabase production migration state was verified through the successful production history smoke test.

## Storage

- [~] Step 12 - Supabase Storage
  - [x] 12.1 Configure public cover bucket and private audio bucket support through env vars.
  - [x] 12.2 Backend resolves public cover object paths to Supabase public URLs.
  - [x] 12.3 Backend resolves private audio object paths to signed Supabase URLs.
  - [x] 12.4 Frontend consumes resolved `cover_url` and `audio_url` from the API.
  - [~] 12.5 Published catalog and playlist media use Supabase-backed paths; full bucket inventory verification is still pending.
  - [~] 12.6 Signed URL generation is covered by backend tests; refresh-on-expiry during a long listening session is still a follow-up.

## Admin And Content

- [x] Step 13 - Admin track management
  - [x] 13.1 Add an admin role to users and enforce role checks.
  - [x] 13.2 Add admin-only upload endpoint.
  - [x] 13.3 Add track create/update/delete API.
  - [x] 13.4 Add admin UI for track upload and metadata management.
  - [x] Add audit logs for admin actions.
  - [x] Add publish/unpublish workflow.

## Analytics And Monitoring

- [~] Step 14 - Analytics and monitoring
  - [~] 14.1 Umami script loading and helper exist; product event coverage still needs wiring and verification.
  - [x] 14.2 Sentry frontend integration files exist.
  - [x] 14.3 Sentry backend integration exists.
  - [~] 14.4 Global frontend error handling exists; route/component-level error boundaries can still be improved.
  - [ ] 14.5 Performance monitoring dashboards and event review are not complete.
  - [!] Production Sentry and Umami DSNs/website IDs must be verified in deployment environments.

## CI/CD And DevOps

- [~] Step 15 - CI/CD pipeline
  - [x] 15.1 GitHub Actions workflow exists for web lint, web typecheck, web build, and API tests.
  - [x] 15.2 Frontend Vercel deployment config exists through the Next.js app and rewrite proxy.
  - [x] 15.3 Backend Vercel Go Runtime config exists.
  - [x] 15.4 Production environment variables are verified for the smoke-tested flows.
  - [!] 15.5 Branch protection rules are configured in GitHub UI, not tracked in the repo.
  - [~] Frontend `npm test` is still a placeholder and does not run real frontend tests.

## Donation And Monetization

- [ ] Step 16 - Donation integration
  - [ ] 16.1 Saweria widget embed.
  - [ ] 16.2 Trakteer widget embed.
  - [ ] 16.3 Donation banner/CTA on homepage and track download flow.

## SEO And Performance

- [~] Step 17 - SEO and performance
  - [~] 17.1 Basic Next.js metadata exists; richer page metadata and Open Graph tags are pending.
  - [ ] 17.2 Sitemap generation is not implemented.
  - [ ] 17.3 `robots.txt` is not implemented.
  - [~] 17.4 Image optimization fixes exist for placeholder images and above-fold eager loading; a full audit is still pending.
  - [ ] 17.5 Lighthouse performance audit is not complete.
  - [~] 17.6 Some Core Web Vitals fixes were applied, but production verification is pending.

## Launch Preparation

- [ ] Step 18 - Pre-launch checklist
  - [ ] 18.1 Custom domain setup.
  - [!] 18.2 SSL certificate verification.
  - [x] 18.3 Backend CORS configuration.
  - [x] 18.4 API rate limiting.
  - [x] 18.5 Security headers for Next.js.
  - [x] 18.6 Privacy policy page.
  - [x] 18.7 Terms of service page.
  - [x] 18.8 Cookie consent decision and implementation if needed.
    - [x] Optional Umami analytics now loads only after explicit consent.
    - [x] Consent choice is stored locally and includes a direct Privacy Policy link.

- [ ] Step 19 - Launch
  - [x] 19.1 Final smoke test passed for the current production app.
  - [ ] 19.2 DNS propagation verification.
  - [ ] 19.3 Monitoring dashboards live.
  - [ ] 19.4 Social media announcement.
  - [ ] 19.5 ProductHunt or indie hacker submission, optional.

## API Route Status

- [x] `GET /healthz`
- [x] `GET /readyz`
- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `POST /api/v1/auth/refresh`
- [x] `POST /api/v1/auth/logout`
- [x] `GET /api/v1/tracks`
- [x] `GET /api/v1/tracks/{id}`
- [x] `GET /api/v1/favorites`
- [x] `POST /api/v1/favorites`
- [x] `DELETE /api/v1/favorites/{trackID}`
- [x] `GET /api/v1/playlists`
- [x] `POST /api/v1/playlists`
- [x] `GET /api/v1/playlists/{id}`
- [x] `DELETE /api/v1/playlists/{id}`
- [x] `POST /api/v1/playlists/{id}/tracks`
- [x] `DELETE /api/v1/playlists/{id}/tracks/{trackID}`
- [x] `GET /api/v1/history`
- [x] `POST /api/v1/history`
- [x] `DELETE /api/v1/history`
- [x] `DELETE /api/v1/history/{entryID}`
- [ ] `GET /api/v1/me`
- [ ] `POST /api/v1/auth/verify-email`
- [x] `POST /api/v1/auth/forgot-password`
- [x] `POST /api/v1/auth/verify-otp`
- [x] `POST /api/v1/auth/reset-password`
- [x] Admin API routes: `POST /api/v1/tracks` is admin-protected, and `/api/v1/admin/tracks` plus `/api/v1/admin/uploads` cover admin list/create/update/delete/upload flows.
- [ ] Signed asset URL routes
- [ ] Download tracking route

## Testing Status

- [x] Backend JWT middleware tests exist.
- [x] Backend router tests exist.
- [x] Backend history repository integration test covers duplicate consolidation, aggregate play counts, and remove-by-track behavior.
- [x] History record/list flow was manually smoke-tested in the side browser with API logs showing `POST /api/v1/history` returning `201`.
- [x] Production smoke test passed for homepage, Explore tracks, register, logout, login, forgot/reset password, playback switching, bottom-player controls, volume, seek, favorites, playlists, history counts, remove history, and clear history.
- [x] Backend storage unit tests cover public cover URL resolution and private audio signed URL generation.
- [~] Backend domain tests for auth, tracks, favorites, playlists, and broader history flows are not complete.
- [x] GitHub Actions runs `go test ./...` for the API.
- [x] GitHub Actions runs web lint, typecheck, and build.
- [~] Frontend has no real unit/component test suite yet.
- [x] E2E smoke tests exist for register/login, public catalog/playback switching, forgot-password request, favorites, playlists, and history.
- [ ] Accessibility audit is not complete.

## Recommended Next Order

1. Continue launch hardening with sitemap and robots.txt.
2. Verify production Sentry/Umami dashboards and branch protection settings.
3. Run Lighthouse/Core Web Vitals and accessibility audits before public launch.

## Known Risks Before Launch

- Legacy placeholder seed rows remain in migration history but are unpublished by migration 017.
- API migrations are skipped automatically in production unless `RUN_MIGRATIONS=true`; schema changes should be applied intentionally.
- Refresh tokens are API-managed but not yet delivered through HttpOnly Secure cookies.
- Admin audit logs require migration 016 to be applied before admin content changes in production.
- Production API CORS requires `WEB_ORIGINS` to include the final KIMS frontend domain.
- API rate limits are in-memory per backend instance; use shared storage such as Redis/Upstash if global multi-instance limits become necessary.
- Optional analytics depends on local cookie consent, so production event volume may be lower than total traffic.
- Production analytics and monitoring require external dashboard verification.
