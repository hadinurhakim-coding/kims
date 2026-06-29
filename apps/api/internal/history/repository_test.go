package history

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func openTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	if err := config.LoadDotEnv(filepath.Join("..", "..", ".env")); err != nil {
		t.Fatalf("load test .env: %v", err)
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL is not set; skipping PostgreSQL integration test")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("connect test database: %v", err)
	}
	t.Cleanup(pool.Close)

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("ping test database: %v", err)
	}

	return pool
}

func TestRepositoryRecordsOneHistoryRowPerTrack(t *testing.T) {
	ctx := context.Background()
	pool := openTestPool(t)
	repo := NewRepository(pool)

	email := "history-dedupe-test@example.com"
	title := "History Dedupe Test Track"

	_, _ = pool.Exec(ctx, "DELETE FROM users WHERE email = $1", email)
	_, _ = pool.Exec(ctx, "DELETE FROM tracks WHERE title = $1", title)
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, "DELETE FROM users WHERE email = $1", email)
		_, _ = pool.Exec(ctx, "DELETE FROM tracks WHERE title = $1", title)
	})

	var userID string
	if err := pool.QueryRow(
		ctx,
		`
			INSERT INTO users (name, email, password)
			VALUES ('History Test User', $1, 'test-password')
			RETURNING id
		`,
		email,
	).Scan(&userID); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	var trackID string
	if err := pool.QueryRow(
		ctx,
		`
			INSERT INTO tracks (
				title, type, mood, duration, license_label, cover_url, audio_url
			)
			VALUES ($1, 'Music', 'Focused', '01:23', 'No Attribution', '/cover.jpg', '/audio.mp3')
			RETURNING id
		`,
		title,
	).Scan(&trackID); err != nil {
		t.Fatalf("insert track: %v", err)
	}

	for i := 0; i < 3; i++ {
		if err := repo.Record(ctx, userID, trackID); err != nil {
			t.Fatalf("record history attempt %d: %v", i+1, err)
		}
	}

	items, total, err := repo.List(ctx, userID, 10, 0)
	if err != nil {
		t.Fatalf("list history: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1 distinct track, got %d", total)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 history item, got %d", len(items))
	}
	if items[0].PlayCount != 3 {
		t.Fatalf("expected play count 3, got %d", items[0].PlayCount)
	}

	entryID := items[0].EntryID

	var rowCount int
	var playCount int
	if err := pool.QueryRow(
		ctx,
		`
			SELECT COUNT(*), COALESCE(SUM(play_count), 0)::int
			FROM history
			WHERE user_id = $1 AND track_id = $2
		`,
		userID,
		trackID,
	).Scan(&rowCount, &playCount); err != nil {
		t.Fatalf("count deduped history rows: %v", err)
	}
	if rowCount != 1 {
		t.Fatalf("expected one row, got %d rows", rowCount)
	}
	if playCount != 3 {
		t.Fatalf("expected play count 3, got %d", playCount)
	}

	if err := repo.Remove(ctx, entryID, userID); err != nil {
		t.Fatalf("remove history entry: %v", err)
	}
	if err := pool.QueryRow(
		ctx,
		`
			SELECT COUNT(*)
			FROM history
			WHERE user_id = $1 AND track_id = $2
		`,
		userID,
		trackID,
	).Scan(&rowCount); err != nil {
		t.Fatalf("count history rows after remove: %v", err)
	}
	if rowCount != 0 {
		t.Fatalf("expected remove to delete all duplicate track rows, got %d", rowCount)
	}
}
