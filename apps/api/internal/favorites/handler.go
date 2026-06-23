package favorites

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	res, err := h.svc.List(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list favorites")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) Add(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req AddFavoriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.TrackID == "" {
		writeError(w, http.StatusBadRequest, "track_id is required")
		return
	}

	if err := h.svc.Add(r.Context(), userID, req.TrackID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to add favorite")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, map[string]string{
		"message": "added to favorites",
	})
}

func (h *Handler) Remove(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	trackID := chi.URLParam(r, "trackID")
	if trackID == "" {
		writeError(w, http.StatusBadRequest, "trackID is required")
		return
	}

	if err := h.svc.Remove(r.Context(), userID, trackID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to remove favorite")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "removed from favorites",
	})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	middleware.WriteJSON(w, status, map[string]string{"error": msg})
}
