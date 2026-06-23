package history

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

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

	query := r.URL.Query()
	res, err := h.svc.List(
		r.Context(),
		userID,
		parseInt(query.Get("limit")),
		parseInt(query.Get("offset")),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list history")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) Record(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req RecordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.svc.Record(r.Context(), userID, req.TrackID); err != nil {
		writeServiceError(w, err, "failed to record play")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, map[string]string{
		"message": "play recorded",
	})
}

func (h *Handler) Clear(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.svc.Clear(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to clear history")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "history cleared",
	})
}

func (h *Handler) Remove(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.svc.Remove(r.Context(), chi.URLParam(r, "entryID"), userID); err != nil {
		writeServiceError(w, err, "failed to remove history entry")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "entry removed",
	})
}

func parseInt(value string) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}

	return parsed
}

func writeServiceError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		writeError(w, http.StatusBadRequest, "invalid request")
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "history entry not found")
	default:
		writeError(w, http.StatusInternalServerError, fallback)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	middleware.WriteJSON(w, status, map[string]string{"error": msg})
}
