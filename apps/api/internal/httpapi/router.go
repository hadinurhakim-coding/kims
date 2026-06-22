package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

type healthResponse struct {
	Status string `json:"status"`
}

type Router struct {
	dbConn *pgxpool.Pool
}

func NewRouter(dbConn *pgxpool.Pool) http.Handler {
	router := &Router{dbConn: dbConn}
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", handleHealth)
	r.Get("/readyz", router.handleReady)

	return r
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}

func (rtr *Router) handleReady(w http.ResponseWriter, r *http.Request) {
	if err := rtr.dbConn.Ping(r.Context()); err != nil {
		writeJSON(
			w,
			http.StatusServiceUnavailable,
			healthResponse{Status: "db unavailable"},
		)
		return
	}

	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
