package main

import (
	"log"
	"net/http"
	"os"

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

	server := &http.Server{
		Addr:    addr,
		Handler: observability.SentryMiddleware(httpapi.NewRouter()),
	}

	log.Printf("kims api listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}
