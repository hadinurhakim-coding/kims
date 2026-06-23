package playlists

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	dbConn *pgxpool.Pool
}

func NewRepository(dbConn *pgxpool.Pool) *Repository {
	return &Repository{dbConn: dbConn}
}

func (r *Repository) List(ctx context.Context, userID string) ([]Playlist, error) {
	query := `
		SELECT id, user_id, name, created_at, updated_at
		FROM playlists
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.dbConn.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list playlists: %w", err)
	}
	defer rows.Close()

	playlists := []Playlist{}
	for rows.Next() {
		var playlist Playlist
		if err := rows.Scan(
			&playlist.ID,
			&playlist.UserID,
			&playlist.Name,
			&playlist.CreatedAt,
			&playlist.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan playlist: %w", err)
		}

		playlists = append(playlists, playlist)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate playlists: %w", err)
	}

	return playlists, nil
}

func (r *Repository) Create(ctx context.Context, userID, name string) (*Playlist, error) {
	query := `
		INSERT INTO playlists (user_id, name)
		VALUES ($1, $2)
		RETURNING id, user_id, name, created_at, updated_at
	`

	var playlist Playlist
	if err := r.dbConn.QueryRow(ctx, query, userID, name).Scan(
		&playlist.ID,
		&playlist.UserID,
		&playlist.Name,
		&playlist.CreatedAt,
		&playlist.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("create playlist: %w", err)
	}

	return &playlist, nil
}

func (r *Repository) GetByID(ctx context.Context, playlistID, userID string) (*PlaylistDetail, error) {
	query := `
		SELECT id, user_id, name, created_at, updated_at
		FROM playlists
		WHERE id = $1 AND user_id = $2
	`

	var playlist Playlist
	if err := r.dbConn.QueryRow(ctx, query, playlistID, userID).Scan(
		&playlist.ID,
		&playlist.UserID,
		&playlist.Name,
		&playlist.CreatedAt,
		&playlist.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, fmt.Errorf("get playlist: %w", err)
	}

	tracks, err := r.listTracks(ctx, playlistID)
	if err != nil {
		return nil, err
	}

	return &PlaylistDetail{
		Playlist: playlist,
		Tracks:   tracks,
		Total:    len(tracks),
	}, nil
}

func (r *Repository) Delete(ctx context.Context, playlistID, userID string) error {
	query := `
		DELETE FROM playlists
		WHERE id = $1 AND user_id = $2
	`

	if _, err := r.dbConn.Exec(ctx, query, playlistID, userID); err != nil {
		return fmt.Errorf("delete playlist: %w", err)
	}

	return nil
}

func (r *Repository) AddTrack(ctx context.Context, playlistID, trackID string) error {
	var maxPosition int
	if err := r.dbConn.QueryRow(
		ctx,
		`SELECT COALESCE(MAX(position), 0) FROM playlist_tracks WHERE playlist_id = $1`,
		playlistID,
	).Scan(&maxPosition); err != nil {
		return fmt.Errorf("get playlist track max position: %w", err)
	}

	query := `
		INSERT INTO playlist_tracks (playlist_id, track_id, position)
		VALUES ($1, $2, $3)
		ON CONFLICT (playlist_id, track_id) DO NOTHING
	`

	if _, err := r.dbConn.Exec(ctx, query, playlistID, trackID, maxPosition+1); err != nil {
		return fmt.Errorf("add playlist track: %w", err)
	}

	return nil
}

func (r *Repository) RemoveTrack(ctx context.Context, playlistID, trackID string) error {
	query := `
		DELETE FROM playlist_tracks
		WHERE playlist_id = $1 AND track_id = $2
	`

	if _, err := r.dbConn.Exec(ctx, query, playlistID, trackID); err != nil {
		return fmt.Errorf("remove playlist track: %w", err)
	}

	return nil
}

func (r *Repository) IsOwner(ctx context.Context, playlistID, userID string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM playlists
			WHERE id = $1 AND user_id = $2
		)
	`

	var isOwner bool
	if err := r.dbConn.QueryRow(ctx, query, playlistID, userID).Scan(&isOwner); err != nil {
		return false, fmt.Errorf("check playlist owner: %w", err)
	}

	return isOwner, nil
}

func (r *Repository) exists(ctx context.Context, playlistID string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM playlists
			WHERE id = $1
		)
	`

	var exists bool
	if err := r.dbConn.QueryRow(ctx, query, playlistID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check playlist exists: %w", err)
	}

	return exists, nil
}

func (r *Repository) listTracks(ctx context.Context, playlistID string) ([]PlaylistTrack, error) {
	query := `
		SELECT
			t.id,
			t.title,
			t.type,
			t.mood,
			t.sfx_category,
			t.duration,
			t.license_label,
			t.cover_url,
			t.audio_url,
			pt.position,
			pt.added_at
		FROM playlist_tracks pt
		JOIN tracks t ON t.id = pt.track_id
		WHERE pt.playlist_id = $1
			AND t.is_published = true
		ORDER BY pt.position ASC, pt.added_at ASC
	`

	rows, err := r.dbConn.Query(ctx, query, playlistID)
	if err != nil {
		return nil, fmt.Errorf("list playlist tracks: %w", err)
	}
	defer rows.Close()

	tracks := []PlaylistTrack{}
	for rows.Next() {
		var track PlaylistTrack
		if err := rows.Scan(
			&track.TrackID,
			&track.Title,
			&track.Type,
			&track.Mood,
			&track.SFXCategory,
			&track.Duration,
			&track.LicenseLabel,
			&track.CoverURL,
			&track.AudioURL,
			&track.Position,
			&track.AddedAt,
		); err != nil {
			return nil, fmt.Errorf("scan playlist track: %w", err)
		}

		tracks = append(tracks, track)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate playlist tracks: %w", err)
	}

	return tracks, nil
}
