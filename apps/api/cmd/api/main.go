package main

import (
	"log"
	"net/http"
	"os"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/httpapi"
)

func main() {
	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	server := &http.Server{
		Addr:    addr,
		Handler: httpapi.NewRouter(),
	}

	log.Printf("kims api listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}
