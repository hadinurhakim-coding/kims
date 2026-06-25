# KIMS Roadmap

KIMS (Kim's Music Station) is a free music and sound library for creators. This roadmap reflects the current repository state after the frontend, backend API, database migrations, and production integration work.

Last updated: 2026-06-25

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
- [~] Basic forgot-password/reset-password endpoints and UI exist, but Brevo email delivery and OTP flow are still pending.
- [~] Seeded tracks still use local placeholder cover/audio assets, not real Supabase Storage files.
- [~] CI exists for frontend lint/typecheck/build and backend tests.
- [ ] Admin upload/content management is not implemented.
- [ ] Real production launch hardening is not complete.

## Frontend And UI/UX

- [x] Step 1 - UI/UX foundation
  - [x] Next.js app shell, layout, responsive pages, shared UI patterns, and core styling.
  - [x] Sidebar, bottom player, right panel, auth layout, and catalog components.
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
- [x] Step 9 - Auth UI
  - [x] Login and register pages are implemented.
  - [~] Forgot password/reset password UI exists, but the production target is changing to a Brevo-powered 3-step OTP flow.
- [x] Step 10 - Wavesurfer.js audio integration
  - [x] AudioContext initializes Wavesurfer and loads the active track audio source.
  - [~] It currently streams whatever `audio_url` is returned by the API; Supabase signed URL streaming is still Step 12.

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
  - [x] 11.11 Routes are wired under `/api/v1`.
  - [x] 11.12 Frontend mock auth has been replaced with real API auth.
  - [~] Auth is MVP-level: email verification, Brevo OTP password reset delivery, current-user endpoint, admin roles, and HttpOnly refresh cookies are still pending.

## Forgot Password With Brevo

- [~] Forgot Password production flow
  - [!] FP.1 Configure Brevo account and Gmail sender: SMTP credentials and sender verification must be done in Brevo/Gmail.
  - [!] FP.2 Add Brevo config to Vercel environment variables.
  - [~] FP.3 Password reset migration exists as `password_reset_tokens`; target OTP table/shape still needs adjustment to `password_resets` with OTP hash, expiry, and used flag.
  - [ ] FP.4 Build email service in Go using Brevo SMTP and an HTML email template.
  - [~] FP.5 Basic forgot-password logic exists inside auth; dedicated OTP-based forgot password domain is still pending.
  - [~] FP.6 Basic forgot/reset routes are wired; OTP verify/reset route shape still needs finalization.
  - [~] FP.7 Frontend `/forgot-password` exists, but still needs the 3-step flow: email -> OTP -> new password.
  - [x] FP.8 Register debug console logs are removed.

## Database

- [x] Migrations 001-007 exist.
- [x] Tables covered by migrations include users, tracks, favorites, playlists, playlist_tracks, history, refresh_tokens, and schema_migrations.
- [x] Seed migration 007 inserts 40 catalog tracks.
- [~] Migration 008 exists for password reset tokens, but Brevo OTP flow may require a revised `password_resets` table.
- [~] Seed data uses local `/placeholder-cover.png` and `/Mimpi_Dua_Seal.mp3`.
- [!] Supabase production migration state must be checked externally with `go run ./cmd/migrate -direction=up` and the Supabase table editor.

## Storage

- [ ] Step 12 - Supabase Storage
  - [ ] 12.1 Configure Supabase Storage buckets for audio and covers.
  - [ ] 12.2 Upload real audio files.
  - [ ] 12.3 Upload real cover images.
  - [ ] 12.4 Update the tracks table with real Supabase Storage URLs or paths.
  - [~] 12.5 Frontend can consume `cover_url` and `audio_url` from the API, but the actual seeded values are still local placeholder/sample files.
  - [~] 12.6 AudioContext can play remote URLs, but signed Supabase Storage URL generation/refresh is not implemented.

## Admin And Content

- [ ] Step 13 - Admin track management
  - [ ] 13.1 Add an admin role to users and enforce role checks.
  - [ ] 13.2 Add admin-only upload endpoint.
  - [ ] 13.3 Add track create/update/delete API.
  - [ ] 13.4 Add admin UI for track upload and metadata management.
  - [ ] Add audit logs for admin actions.
  - [ ] Add publish/unpublish workflow.

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
  - [!] 15.4 Production environment variables must be verified in the Vercel dashboard.
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
  - [ ] 18.3 Backend CORS configuration.
  - [ ] 18.4 API rate limiting.
  - [ ] 18.5 Security headers for Next.js.
  - [ ] 18.6 Privacy policy page.
  - [ ] 18.7 Terms of service page.
  - [ ] 18.8 Cookie consent decision and implementation if needed.

- [ ] Step 19 - Launch
  - [ ] 19.1 Final smoke test.
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
- [x] `POST /api/v1/auth/reset-password`
- [ ] OTP verify/reset route for Brevo-based forgot password flow
- [ ] Admin API routes
- [ ] Signed asset URL routes
- [ ] Download tracking route

## Testing Status

- [x] Backend JWT middleware tests exist.
- [x] Backend router tests exist.
- [ ] Backend domain tests for auth, tracks, favorites, playlists, and history are not complete.
- [x] GitHub Actions runs `go test ./...` for the API.
- [x] GitHub Actions runs web lint, typecheck, and build.
- [~] Frontend has no real unit/component test suite yet.
- [ ] E2E smoke tests are not implemented.
- [ ] Accessibility audit is not complete.

## Recommended Next Order

1. Verify production environment variables in Vercel for both web and API.
2. Complete Forgot Password with Brevo SMTP and OTP flow.
3. Run a production smoke test for register, login, forgot password, tracks, favorites, playlists, and history.
4. Complete Step 12 by moving audio and covers to Supabase Storage.
5. Complete Step 13 so admins can upload and manage tracks without manual SQL.
6. Harden launch requirements: CORS, rate limiting, security headers, privacy/terms pages, sitemap, and robots.txt.
7. Add real frontend tests and E2E smoke tests.
8. Run Lighthouse/Core Web Vitals audit before public launch.

## Known Risks Before Launch

- Real catalog media is not yet stored in Supabase Storage.
- API migrations are skipped automatically in production unless `RUN_MIGRATIONS=true`; schema changes should be applied intentionally.
- Forgot Password does not yet send real email through Brevo or use the planned 3-step OTP flow.
- Refresh tokens are API-managed but not yet delivered through HttpOnly Secure cookies.
- No admin role or admin UI exists yet.
- No rate limiting exists yet.
- No privacy policy or terms pages exist yet.
- Production analytics and monitoring require external dashboard verification.
