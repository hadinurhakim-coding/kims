package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/db"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/httpapi"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/observability"
)

func main() {
	if err := observability.InitSentry(); err != nil {
		log.Printf("sentry initialization failed: %v", err)
	}

	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		addr = ":" + port
	}

	ctx := context.Background()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	if os.Getenv("SKIP_MIGRATIONS") == "true" {
		log.Printf("migrations skipped")
	} else if err := db.RunMigrations(databaseURL); err != nil {
		log.Fatalf("migrations failed: %v", err)
	} else {
		log.Printf("migrations applied successfully")
	}

	dbConn, err := db.Open(ctx, databaseURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer dbConn.Close()

	log.Printf("connected to database")

	server := &http.Server{
		Addr:    addr,
		Handler: observability.SentryMiddleware(httpapi.NewRouter(dbConn)),
	}

	log.Printf("kims api ready env=%s addr=%s", os.Getenv("APP_ENV"), addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}
