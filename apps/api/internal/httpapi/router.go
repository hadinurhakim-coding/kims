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

type API struct {
	dbConn *pgxpool.Pool
}

func NewRouter(dbConn *pgxpool.Pool) http.Handler {
	api := &API{dbConn: dbConn}
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", handleHealth)
	r.Get("/readyz", api.handleReady)

	return r
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}

func (a *API) handleReady(w http.ResponseWriter, r *http.Request) {
	if err := a.dbConn.Ping(r.Context()); err != nil {
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
