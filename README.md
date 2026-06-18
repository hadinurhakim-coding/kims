# KIMS

KIMS (Kim's Music Station) is a free sound library platform for content creators worldwide. It will provide high-quality tracks, including lofi beats, cinematic background music, and sound effects, ready to use without copyright concerns under one clear KIMS Free License.

Status: Step 1 scaffold is in place with a Next.js web app, Go API skeleton, documentation, environment examples, and CI configuration.

## MVP Direction

- Public visitors can browse, stream, and download tracks without login.
- Creators can register for favorites, play/download history, and playlists.
- Admins manage uploads, metadata, publishing, and catalog operations.
- The MVP uses only free-tier services and starts with 50-100 compressed tracks.
- "Thousands of tracks" is a scale milestone after free-tier limits are validated.

## Tech Stack

- Frontend: Next.js, TypeScript, TailwindCSS, Wavesurfer.js, Vercel
- Backend: Go, Chi, Vercel Go Runtime
- Database: PostgreSQL via Supabase
- File storage: Supabase Storage
- Auth: custom JWT in Go
- Email: Resend
- Analytics: Umami
- Monitoring: Sentry
- CI/CD: GitHub and GitHub Actions
- Keep-alive: not required while the backend runs on Vercel Go Runtime

## Repository Structure

```text
kims/
  README.md
  CODEX.md
  ROADMAP.md
  docs/
    architecture.md
    database.md
    api.md
  apps/
    web/
    api/
```

## Documentation

- [Roadmap](ROADMAP.md)
- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API](docs/api.md)
- [Coding Session Context](CODEX.md)

## Free-Tier Notes

- Vercel Hobby/Go Runtime, Supabase Free, Resend Free, Sentry Developer, Umami, and GitHub Actions must be rechecked before launch because limits can change.
- Store compressed delivery audio only.
- Keep MVP storage under about 900 MB.
- Use signed URLs for Supabase Storage assets.
- Vercel Go Runtime does not need a cron-job.org keep-alive ping.

## Development Quality Bar

- TypeScript strict mode for the frontend.
- Go tests for backend auth, API, storage, and database behavior.
- CI must run frontend lint/typecheck/build and backend tests.
- Public pages must be accessible by keyboard and responsive on mobile.
- No secrets belong in the repository or frontend bundle.
