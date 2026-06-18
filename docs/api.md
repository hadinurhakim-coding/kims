# KIMS API Plan

The KIMS API is a Go Chi service hosted on Render. All API routes return JSON unless they are health checks. Auth uses custom JWT access tokens and hashed refresh tokens.

## General Rules

- Use `/v1` for versioned product APIs.
- Use JSON request and response bodies.
- Use short-lived access tokens.
- Use HttpOnly Secure cookies for refresh tokens.
- Use role-based access checks for admin routes.
- Return consistent error shapes.
- Generate short-lived Supabase signed URLs for audio and cover assets.
- Never return Supabase service credentials or permanent private asset URLs.

## Response Shape

Success responses should use the direct resource shape when simple:

```json
{
  "id": "uuid",
  "title": "Late Night Lofi"
}
```

List responses should include pagination metadata:

```json
{
  "items": [],
  "page": 1,
  "page_size": 24,
  "total": 0
}
```

Error responses should use:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request is invalid."
  }
}
```

## Health

- [ ] `GET /healthz`
  - Used by cron-job.org and basic liveness checks.
  - Should not require database access.

- [ ] `GET /readyz`
  - Checks database and required dependencies.
  - Used for deployment verification.

## Public Catalog

- [ ] `GET /v1/tracks`
  - Query params: `q`, `type`, `genre`, `mood`, `tag`, `duration_min`, `duration_max`, `sort`, `page`, `page_size`.
  - Returns published, non-archived tracks only.

- [ ] `GET /v1/tracks/{slug}`
  - Returns one published, non-archived track by slug.

- [ ] `POST /v1/tracks/{id}/asset-url`
  - Returns short-lived signed URLs for stream/download access.
  - Allows public access for published tracks.

- [ ] `POST /v1/tracks/{id}/play`
  - Records play event.
  - Works for public visitors and authenticated creators.

- [ ] `POST /v1/tracks/{id}/download`
  - Records download event.
  - Works for public visitors and authenticated creators.

## Auth

- [ ] `POST /v1/auth/register`
  - Creates a creator account.
  - Sends verification email through Resend.

- [ ] `POST /v1/auth/login`
  - Returns access token.
  - Sets refresh token cookie.

- [ ] `POST /v1/auth/logout`
  - Revokes refresh token.
  - Clears refresh token cookie.

- [ ] `POST /v1/auth/refresh`
  - Uses refresh cookie to issue a new access token.

- [ ] `GET /v1/me`
  - Returns current authenticated user.

- [ ] `POST /v1/auth/verify-email`
  - Verifies creator email address.

- [ ] `POST /v1/auth/forgot-password`
  - Sends password reset email.

- [ ] `POST /v1/auth/reset-password`
  - Resets password using a valid reset token.

## Creator Library

All creator routes require authentication.

- [ ] `GET /v1/me/favorites`
  - Lists the current creator's favorite tracks.

- [ ] `POST /v1/me/favorites/{track_id}`
  - Adds a track to favorites.

- [ ] `DELETE /v1/me/favorites/{track_id}`
  - Removes a track from favorites.

- [ ] `GET /v1/me/history`
  - Lists the current creator's play/download history.

- [ ] `GET /v1/me/playlists`
  - Lists playlists owned by the current creator.

- [ ] `POST /v1/me/playlists`
  - Creates a playlist.

- [ ] `PATCH /v1/me/playlists/{id}`
  - Renames or updates a playlist.

- [ ] `DELETE /v1/me/playlists/{id}`
  - Deletes a playlist owned by the current creator.

- [ ] `POST /v1/me/playlists/{id}/items`
  - Adds a track to a playlist.

- [ ] `DELETE /v1/me/playlists/{id}/items/{track_id}`
  - Removes a track from a playlist.

## Admin Catalog

All admin routes require an authenticated `admin` role.

- [ ] `GET /v1/admin/tracks`
  - Lists draft, published, unpublished, and archived tracks.

- [ ] `POST /v1/admin/tracks`
  - Creates a track record and uploads or attaches asset paths.

- [ ] `PATCH /v1/admin/tracks/{id}`
  - Updates metadata, tags, cover art, audio path, or status fields.

- [ ] `POST /v1/admin/tracks/{id}/publish`
  - Publishes a track.

- [ ] `POST /v1/admin/tracks/{id}/unpublish`
  - Removes a track from public catalog results.

- [ ] `DELETE /v1/admin/tracks/{id}`
  - Archives or deletes a track according to implementation policy.

## Status Codes

- [ ] `200 OK` for successful reads and updates.
- [ ] `201 Created` for resource creation.
- [ ] `204 No Content` for successful deletes with no body.
- [ ] `400 Bad Request` for malformed input.
- [ ] `401 Unauthorized` for missing or invalid auth.
- [ ] `403 Forbidden` for wrong role or ownership.
- [ ] `404 Not Found` for missing resources.
- [ ] `409 Conflict` for duplicate unique resources.
- [ ] `422 Unprocessable Entity` for validation failures.
- [ ] `429 Too Many Requests` for rate limits.
- [ ] `500 Internal Server Error` for unexpected failures.

## API Test Checklist

- [ ] Public users can list and view published tracks.
- [ ] Public users cannot view drafts or archived tracks.
- [ ] Public users can request signed URLs for published tracks only.
- [ ] Creators can register, login, refresh, and logout.
- [ ] Creators can manage only their own favorites, history, and playlists.
- [ ] Admins can create, edit, publish, unpublish, and archive tracks.
- [ ] Creator tokens cannot access admin routes.
- [ ] Invalid input returns consistent error responses.
- [ ] Rate-limited requests return `429`.
