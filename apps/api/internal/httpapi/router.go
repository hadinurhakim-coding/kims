package httpapi

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/audit"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/auth"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/email"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/favorites"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/history"
	appmiddleware "github.com/hadinurhakim-coding/kims/apps/api/internal/middleware"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/playlists"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/resetpassword"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/storage"
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

	r.Use(appmiddleware.CORSFromEnv())
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)

	r.Get("/favicon.ico", handleFavicon)
	r.Get("/healthz", handleHealth)
	r.Get("/readyz", router.handleReady)
	router.registerAPIRoutes(r)

	return r
}

func (rtr *Router) registerAPIRoutes(r chi.Router) {
	rateLimiter := appmiddleware.NewRateLimiter()
	apiLimit := appmiddleware.RateLimitConfigFromEnv("RATE_LIMIT_API", 300, time.Minute, "api")
	authLimit := appmiddleware.RateLimitConfigFromEnv("RATE_LIMIT_AUTH", 20, time.Minute, "auth")
	otpLimit := appmiddleware.RateLimitConfigFromEnv("RATE_LIMIT_OTP", 5, 10*time.Minute, "otp")
	historyLimit := appmiddleware.RateLimitConfigFromEnv("RATE_LIMIT_HISTORY", 120, time.Minute, "history")
	adminLimit := appmiddleware.RateLimitConfigFromEnv("RATE_LIMIT_ADMIN", 60, time.Minute, "admin")
	mediaLimit := appmiddleware.RateLimitConfigFromEnv("RATE_LIMIT_MEDIA", 20, time.Minute, "media")

	storageService := storage.NewServiceFromEnv()
	authHandler := auth.NewHandler(auth.NewService(auth.NewRepository(rtr.dbConn)))
	resetPasswordHandler := resetpassword.NewHandler(
		resetpassword.NewService(
			resetpassword.NewRepository(rtr.dbConn),
			email.NewService(),
		),
	)
	auditRepo := audit.NewRepository(rtr.dbConn)
	historyService := history.NewService(history.NewRepository(rtr.dbConn), storageService)
	tracksHandler := tracks.NewHandler(
		tracks.NewService(tracks.NewRepository(rtr.dbConn), storageService),
		storageService,
		historyService,
		auditRepo,
	)
	favoritesHandler := favorites.NewHandler(favorites.NewService(favorites.NewRepository(rtr.dbConn), storageService))
	playlistsHandler := playlists.NewHandler(playlists.NewService(playlists.NewRepository(rtr.dbConn), storageService))
	historyHandler := history.NewHandler(historyService)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(rateLimiter.Middleware(apiLimit))

		r.With(rateLimiter.Middleware(authLimit)).Post("/auth/register", authHandler.Register)
		r.With(rateLimiter.Middleware(authLimit)).Post("/auth/login", authHandler.Login)
		r.With(rateLimiter.Middleware(authLimit)).Post("/auth/refresh", authHandler.Refresh)
		r.With(rateLimiter.Middleware(otpLimit)).Post("/auth/forgot-password", resetPasswordHandler.RequestOTP)
		r.With(rateLimiter.Middleware(otpLimit)).Post("/auth/verify-otp", resetPasswordHandler.VerifyOTP)
		r.With(rateLimiter.Middleware(otpLimit)).Post("/auth/reset-password", resetPasswordHandler.ResetPassword)

		r.Get("/tracks", tracksHandler.List)
		r.Get("/tracks/{id}", tracksHandler.GetByID)
		r.With(rateLimiter.Middleware(mediaLimit)).Get("/tracks/{id}/play-url", tracksHandler.GetPlayURL)
		r.With(rateLimiter.Middleware(mediaLimit), appmiddleware.OptionalAuth).Get("/tracks/{id}/download", tracksHandler.Download)

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
			r.With(rateLimiter.Middleware(historyLimit)).Post("/history", historyHandler.Record)
			r.Delete("/history", historyHandler.Clear)
			r.Delete("/history/{entryID}", historyHandler.Remove)

			r.Group(func(r chi.Router) {
				r.Use(appmiddleware.RequireAdmin)
				r.Use(rateLimiter.Middleware(adminLimit))

				r.Post("/tracks", tracksHandler.Create)
				r.Route("/admin", func(r chi.Router) {
					r.Get("/tracks", tracksHandler.ListAdmin)
					r.Post("/tracks", tracksHandler.Create)
					r.Put("/tracks/{id}", tracksHandler.Update)
					r.Delete("/tracks/{id}", tracksHandler.Delete)
					r.Post("/uploads", tracksHandler.Upload)
				})
			})
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
