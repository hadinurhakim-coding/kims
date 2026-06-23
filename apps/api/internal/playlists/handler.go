package playlists

import (
	"encoding/json"
	"errors"
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
		writeError(w, http.StatusInternalServerError, "failed to list playlists")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	playlist, err := h.svc.Create(r.Context(), userID, req.Name)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			writeError(w, http.StatusBadRequest, "playlist name is required and must be 50 characters or less")
			return
		}

		writeError(w, http.StatusInternalServerError, "failed to create playlist")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, playlist)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	detail, err := h.svc.GetByID(r.Context(), chi.URLParam(r, "id"), userID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "playlist not found")
			return
		}

		writeError(w, http.StatusInternalServerError, "failed to get playlist")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, detail)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.svc.Delete(r.Context(), chi.URLParam(r, "id"), userID); err != nil {
		writeServiceError(w, err, "failed to delete playlist")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "playlist deleted",
	})
}

func (h *Handler) AddTrack(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req AddTrackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.svc.AddTrack(r.Context(), chi.URLParam(r, "id"), req.TrackID, userID); err != nil {
		writeServiceError(w, err, "failed to add track")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, map[string]string{
		"message": "track added",
	})
}

func (h *Handler) RemoveTrack(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.svc.RemoveTrack(
		r.Context(),
		chi.URLParam(r, "id"),
		chi.URLParam(r, "trackID"),
		userID,
	); err != nil {
		writeServiceError(w, err, "failed to remove track")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "track removed",
	})
}

func writeServiceError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		writeError(w, http.StatusBadRequest, "invalid request")
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "playlist not found")
	case errors.Is(err, ErrNotOwner):
		writeError(w, http.StatusForbidden, "not authorized to modify this playlist")
	default:
		writeError(w, http.StatusInternalServerError, fallback)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	middleware.WriteJSON(w, status, map[string]string{"error": msg})
}
