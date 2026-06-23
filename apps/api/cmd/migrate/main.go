package main

import (
	"flag"
	"log"
	"os"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

const migrationSourceURL = "file://migrations"

func main() {
	direction := flag.String("direction", "up", "up or down")
	steps := flag.Int("steps", 0, "number of steps (0 = all)")
	flag.Parse()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	m, err := migrate.New(migrationSourceURL, migrateDatabaseURL(databaseURL))
	if err != nil {
		log.Fatalf("failed to init migrate: %v", err)
	}
	defer m.Close()

	switch *direction {
	case "up":
		if *steps > 0 {
			err = m.Steps(*steps)
		} else {
			err = m.Up()
		}
	case "down":
		if *steps > 0 {
			err = m.Steps(-(*steps))
		} else {
			err = m.Down()
		}
	default:
		log.Fatalf("unknown direction: %s", *direction)
	}

	if err != nil && err != migrate.ErrNoChange {
		log.Fatalf("migration failed: %v", err)
	}

	log.Printf("migration %s completed", *direction)
}

func migrateDatabaseURL(databaseURL string) string {
	if strings.HasPrefix(databaseURL, "postgres://") {
		return "pgx5://" + strings.TrimPrefix(databaseURL, "postgres://")
	}

	if strings.HasPrefix(databaseURL, "postgresql://") {
		return "pgx5://" + strings.TrimPrefix(databaseURL, "postgresql://")
	}

	return databaseURL
}
