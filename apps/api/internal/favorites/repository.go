package favorites

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	dbConn *pgxpool.Pool
}

func NewRepository(dbConn *pgxpool.Pool) *Repository {
	return &Repository{dbConn: dbConn}
}

func (r *Repository) List(ctx context.Context, userID string) ([]FavoriteTrack, error) {
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
			f.created_at
		FROM favorites f
		JOIN tracks t ON t.id = f.track_id
		WHERE f.user_id = $1
			AND t.is_published = true
		ORDER BY f.created_at DESC
	`

	rows, err := r.dbConn.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list favorites: %w", err)
	}
	defer rows.Close()

	favorites := []FavoriteTrack{}
	for rows.Next() {
		var item FavoriteTrack
		if err := rows.Scan(
			&item.TrackID,
			&item.Title,
			&item.Type,
			&item.Mood,
			&item.SFXCategory,
			&item.Duration,
			&item.LicenseLabel,
			&item.CoverURL,
			&item.AudioURL,
			&item.FavoritedAt,
		); err != nil {
			return nil, fmt.Errorf("scan favorite track: %w", err)
		}

		favorites = append(favorites, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate favorites: %w", err)
	}

	return favorites, nil
}

func (r *Repository) Add(ctx context.Context, userID, trackID string) error {
	query := `
		INSERT INTO favorites (user_id, track_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, track_id) DO NOTHING
	`

	if _, err := r.dbConn.Exec(ctx, query, userID, trackID); err != nil {
		return fmt.Errorf("add favorite: %w", err)
	}

	return nil
}

func (r *Repository) Remove(ctx context.Context, userID, trackID string) error {
	query := `
		DELETE FROM favorites
		WHERE user_id = $1 AND track_id = $2
	`

	if _, err := r.dbConn.Exec(ctx, query, userID, trackID); err != nil {
		return fmt.Errorf("remove favorite: %w", err)
	}

	return nil
}

func (r *Repository) Exists(ctx context.Context, userID, trackID string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM favorites
			WHERE user_id = $1 AND track_id = $2
		)
	`

	var exists bool
	if err := r.dbConn.QueryRow(ctx, query, userID, trackID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check favorite exists: %w", err)
	}

	return exists, nil
}
