package tracks

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	dbConn *pgxpool.Pool
}

func NewRepository(dbConn *pgxpool.Pool) *Repository {
	return &Repository{dbConn: dbConn}
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Track, int, error) {
	conditions := []string{"is_published = true"}
	args := []any{}

	if params.Type != "" {
		conditions = append(conditions, fmt.Sprintf("type = $%d", len(args)+1))
		args = append(args, params.Type)
	}
	if params.Mood != "" {
		conditions = append(conditions, fmt.Sprintf("mood ILIKE $%d", len(args)+1))
		args = append(args, params.Mood)
	}
	if params.SFXCategory != "" {
		conditions = append(conditions, fmt.Sprintf("sfx_category = $%d", len(args)+1))
		args = append(args, params.SFXCategory)
	}
	if params.LicenseLabel != "" {
		conditions = append(conditions, fmt.Sprintf("license_label = $%d", len(args)+1))
		args = append(args, params.LicenseLabel)
	}
	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf("title ILIKE $%d", len(args)+1))
		args = append(args, "%"+params.Search+"%")
	}

	whereClause := strings.Join(conditions, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tracks WHERE %s", whereClause)
	if err := r.dbConn.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count tracks: %w", err)
	}

	selectArgs := append([]any{}, args...)
	limitPlaceholder := len(selectArgs) + 1
	selectArgs = append(selectArgs, params.Limit)
	offsetPlaceholder := len(selectArgs) + 1
	selectArgs = append(selectArgs, params.Offset)

	query := fmt.Sprintf(`
		SELECT
			id,
			title,
			type,
			mood,
			sfx_category,
			duration,
			license_label,
			cover_url,
			audio_url,
			is_published,
			created_at,
			updated_at
		FROM tracks
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, limitPlaceholder, offsetPlaceholder)

	rows, err := r.dbConn.Query(ctx, query, selectArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list tracks: %w", err)
	}
	defer rows.Close()

	tracks := []Track{}
	for rows.Next() {
		track, err := scanTrack(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan track: %w", err)
		}

		tracks = append(tracks, track)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate tracks: %w", err)
	}

	return tracks, total, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Track, error) {
	query := `
		SELECT
			id,
			title,
			type,
			mood,
			sfx_category,
			duration,
			license_label,
			cover_url,
			audio_url,
			is_published,
			created_at,
			updated_at
		FROM tracks
		WHERE id = $1 AND is_published = true
	`

	track, err := scanTrack(r.dbConn.QueryRow(ctx, query, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, fmt.Errorf("get track by id: %w", err)
	}

	return &track, nil
}

type trackScanner interface {
	Scan(dest ...any) error
}

func scanTrack(row trackScanner) (Track, error) {
	var track Track
	if err := row.Scan(
		&track.ID,
		&track.Title,
		&track.Type,
		&track.Mood,
		&track.SFXCategory,
		&track.Duration,
		&track.LicenseLabel,
		&track.CoverURL,
		&track.AudioURL,
		&track.IsPublished,
		&track.CreatedAt,
		&track.UpdatedAt,
	); err != nil {
		return Track{}, err
	}

	return track, nil
}
