package history

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

func (r *Repository) List(ctx context.Context, userID string, limit, offset int) ([]HistoryTrack, int, error) {
	countQuery := `
		SELECT COUNT(*)
		FROM history h
		JOIN tracks t ON t.id = h.track_id
		WHERE h.user_id = $1
			AND t.is_published = true
	`

	var total int
	if err := r.dbConn.QueryRow(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count history: %w", err)
	}

	query := `
		SELECT
			h.id,
			t.id,
			t.title,
			t.type,
			t.mood,
			t.sfx_category,
			t.duration,
			t.license_label,
			t.cover_url,
			t.audio_url,
			h.play_count,
			h.played_at
		FROM history h
		JOIN tracks t ON t.id = h.track_id
		WHERE h.user_id = $1
			AND t.is_published = true
		ORDER BY h.played_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.dbConn.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list history: %w", err)
	}
	defer rows.Close()

	items := []HistoryTrack{}
	for rows.Next() {
		var item HistoryTrack
		if err := rows.Scan(
			&item.EntryID,
			&item.TrackID,
			&item.Title,
			&item.Type,
			&item.Mood,
			&item.SFXCategory,
			&item.Duration,
			&item.LicenseLabel,
			&item.CoverURL,
			&item.AudioURL,
			&item.PlayCount,
			&item.PlayedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan history track: %w", err)
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate history: %w", err)
	}

	return items, total, nil
}

func (r *Repository) Record(ctx context.Context, userID, trackID string) error {
	var entryID string
	err := r.dbConn.QueryRow(
		ctx,
		`
			SELECT id
			FROM history
			WHERE user_id = $1
				AND track_id = $2
				AND played_at > NOW() - INTERVAL '30 minutes'
			LIMIT 1
		`,
		userID,
		trackID,
	).Scan(&entryID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("find recent history entry: %w", err)
	}

	if entryID != "" {
		if _, err := r.dbConn.Exec(
			ctx,
			`
				UPDATE history
				SET play_count = play_count + 1,
					played_at = NOW()
				WHERE id = $1
			`,
			entryID,
		); err != nil {
			return fmt.Errorf("update history entry: %w", err)
		}

		return nil
	}

	if _, err := r.dbConn.Exec(
		ctx,
		`
			INSERT INTO history (user_id, track_id)
			VALUES ($1, $2)
		`,
		userID,
		trackID,
	); err != nil {
		return fmt.Errorf("insert history entry: %w", err)
	}

	return nil
}

func (r *Repository) Remove(ctx context.Context, entryID, userID string) error {
	query := `
		DELETE FROM history
		WHERE id = $1 AND user_id = $2
	`

	if _, err := r.dbConn.Exec(ctx, query, entryID, userID); err != nil {
		return fmt.Errorf("remove history entry: %w", err)
	}

	return nil
}

func (r *Repository) Clear(ctx context.Context, userID string) error {
	query := `
		DELETE FROM history
		WHERE user_id = $1
	`

	if _, err := r.dbConn.Exec(ctx, query, userID); err != nil {
		return fmt.Errorf("clear history: %w", err)
	}

	return nil
}
