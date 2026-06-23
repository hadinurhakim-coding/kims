package db

import (
	"fmt"
	"log"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

const migrationSourceURL = "file://migrations"

func RunMigrations(databaseURL string) error {
	m, err := migrate.New(migrationSourceURL, migrateDatabaseURL(databaseURL))
	if err != nil {
		return fmt.Errorf("failed to init migrations: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return fmt.Errorf("failed to get version: %w", err)
	}

	log.Printf("migrations: version=%d dirty=%v", version, dirty)
	return nil
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
