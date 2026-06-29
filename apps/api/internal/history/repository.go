package history

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	dbConn *pgxpool.Pool
}

func NewRepository(dbConn *pgxpool.Pool) *Repository {
	return &Repository{dbConn: dbConn}
}

func currentHistoryBucket() (time.Time, string) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		location = time.Local
	}

	now := time.Now().In(location)
	session := "Evening"
	if now.Hour() < 12 {
		session = "Morning"
	} else if now.Hour() < 17 {
		session = "Afternoon"
	}

	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, location), session
}

func (r *Repository) List(ctx context.Context, userID string, limit, offset int) ([]HistoryTrack, int, error) {
	countQuery := `
		SELECT COUNT(*)
		FROM (
			SELECT 1
			FROM history h
			JOIN tracks t ON t.id = h.track_id
			WHERE h.user_id = $1
				AND t.is_published = true
			GROUP BY h.track_id, h.played_date, h.session_label
		) grouped_history
	`

	var total int
	if err := r.dbConn.QueryRow(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count history: %w", err)
	}

	query := `
		WITH ranked_history AS (
			SELECT
				h.id,
				h.track_id,
				h.played_date,
				h.session_label,
				h.played_at,
				SUM(h.play_count) OVER (
					PARTITION BY h.track_id, h.played_date, h.session_label
				)::int AS total_play_count,
				ROW_NUMBER() OVER (
					PARTITION BY h.track_id, h.played_date, h.session_label
					ORDER BY h.played_at DESC, h.id DESC
				) AS row_number
			FROM history h
			WHERE h.user_id = $1
		)
		SELECT
			rh.id,
			t.id,
			t.title,
			t.type,
			t.mood,
			t.sfx_category,
			t.duration,
			t.license_label,
			t.cover_url,
			t.audio_url,
			rh.total_play_count,
			rh.played_at
		FROM ranked_history rh
		JOIN tracks t ON t.id = rh.track_id
		WHERE rh.row_number = 1
			AND t.is_published = true
		ORDER BY rh.played_at DESC
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
	playedDate, sessionLabel := currentHistoryBucket()

	tx, err := r.dbConn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin history record transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	lockKey := fmt.Sprintf(
		"%s|%s|%s|%s",
		userID,
		trackID,
		playedDate.Format("2006-01-02"),
		sessionLabel,
	)
	if _, err := tx.Exec(
		ctx,
		`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
		lockKey,
	); err != nil {
		return fmt.Errorf("lock history bucket: %w", err)
	}

	rows, err := tx.Query(
		ctx,
		`
			SELECT id, play_count
			FROM history
			WHERE user_id = $1
				AND track_id = $2
				AND played_date = $3
				AND session_label = $4
			ORDER BY played_at DESC, id DESC
			FOR UPDATE
		`,
		userID,
		trackID,
		playedDate,
		sessionLabel,
	)
	if err != nil {
		return fmt.Errorf("find history bucket: %w", err)
	}
	defer rows.Close()

	var latestEntryID string
	totalPlayCount := 0
	duplicateEntryIDs := []string{}
	for rows.Next() {
		var entryID string
		var playCount int
		if err := rows.Scan(&entryID, &playCount); err != nil {
			return fmt.Errorf("scan history bucket: %w", err)
		}

		if latestEntryID == "" {
			latestEntryID = entryID
		} else {
			duplicateEntryIDs = append(duplicateEntryIDs, entryID)
		}
		totalPlayCount += playCount
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate history bucket: %w", err)
	}

	if latestEntryID == "" {
		if _, err := tx.Exec(
			ctx,
			`
				INSERT INTO history (
					user_id,
					track_id,
					play_count,
					played_at,
					played_date,
					session_label
				)
				VALUES ($1, $2, 1, NOW(), $3, $4)
			`,
			userID,
			trackID,
			playedDate,
			sessionLabel,
		); err != nil {
			return fmt.Errorf("insert history entry: %w", err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit history record transaction: %w", err)
		}

		return nil
	}

	if _, err := tx.Exec(
		ctx,
		`
			UPDATE history
			SET play_count = $2,
				played_at = NOW()
			WHERE id = $1
		`,
		latestEntryID,
		totalPlayCount+1,
	); err != nil {
		return fmt.Errorf("update history entry: %w", err)
	}

	if len(duplicateEntryIDs) > 0 {
		for _, duplicateEntryID := range duplicateEntryIDs {
			if _, err := tx.Exec(
				ctx,
				`
					DELETE FROM history
					WHERE id = $1
				`,
				duplicateEntryID,
			); err != nil {
				return fmt.Errorf("dedupe history bucket: %w", err)
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit history record transaction: %w", err)
	}

	return nil
}

func (r *Repository) Remove(ctx context.Context, entryID, userID string) error {
	query := `
		DELETE FROM history
		WHERE id = $1
			AND user_id = $2
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
