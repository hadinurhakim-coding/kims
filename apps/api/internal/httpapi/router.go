package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/auth"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/email"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/favorites"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/history"
	appmiddleware "github.com/hadinurhakim-coding/kims/apps/api/internal/middleware"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/playlists"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/resetpassword"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/tracks"
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

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)

	r.Get("/favicon.ico", handleFavicon)
	r.Get("/healthz", handleHealth)
	r.Get("/readyz", router.handleReady)
	router.registerAPIRoutes(r)

	return r
}

func (rtr *Router) registerAPIRoutes(r chi.Router) {
	authHandler := auth.NewHandler(auth.NewService(auth.NewRepository(rtr.dbConn)))
	resetPasswordHandler := resetpassword.NewHandler(
		resetpassword.NewService(
			resetpassword.NewRepository(rtr.dbConn),
			email.NewService(),
		),
	)
	tracksHandler := tracks.NewHandler(tracks.NewService(tracks.NewRepository(rtr.dbConn)))
	favoritesHandler := favorites.NewHandler(favorites.NewService(favorites.NewRepository(rtr.dbConn)))
	playlistsHandler := playlists.NewHandler(playlists.NewService(playlists.NewRepository(rtr.dbConn)))
	historyHandler := history.NewHandler(history.NewService(history.NewRepository(rtr.dbConn)))

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/refresh", authHandler.Refresh)
		r.Post("/auth/forgot-password", resetPasswordHandler.RequestOTP)
		r.Post("/auth/verify-otp", resetPasswordHandler.VerifyOTP)
		r.Post("/auth/reset-password", resetPasswordHandler.ResetPassword)

		r.Get("/tracks", tracksHandler.List)
		r.Get("/tracks/{id}", tracksHandler.GetByID)

		r.Group(func(r chi.Router) {
			r.Use(appmiddleware.RequireAuth)

			r.Post("/auth/logout", authHandler.Logout)

			r.Get("/favorites", favoritesHandler.List)
			r.Post("/favorites", favoritesHandler.Add)
			r.Delete("/favorites/{trackID}", favoritesHandler.Remove)

			r.Get("/playlists", playlistsHandler.List)
			r.Post("/playlists", playlistsHandler.Create)
			r.Get("/playlists/{id}", playlistsHandler.GetByID)
			r.Delete("/playlists/{id}", playlistsHandler.Delete)
			r.Post("/playlists/{id}/tracks", playlistsHandler.AddTrack)
			r.Delete("/playlists/{id}/tracks/{trackID}", playlistsHandler.RemoveTrack)

			r.Get("/history", historyHandler.List)
			r.Post("/history", historyHandler.Record)
			r.Delete("/history", historyHandler.Clear)
			r.Delete("/history/{entryID}", historyHandler.Remove)
		})
	})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}

func handleFavicon(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
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
