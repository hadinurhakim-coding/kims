package tracks

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
	query := r.URL.Query()
	params := ListParams{
		Type:         query.Get("type"),
		Mood:         query.Get("mood"),
		SFXCategory:  query.Get("sfx_category"),
		LicenseLabel: query.Get("license_label"),
		Search:       query.Get("search"),
		Limit:        parseInt(query.Get("limit")),
		Offset:       parseInt(query.Get("offset")),
	}

	res, err := h.svc.List(r.Context(), params)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list tracks")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	track, err := h.svc.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "track not found")
			return
		}

		writeError(w, http.StatusInternalServerError, "failed to get track")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, track)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	track, err := h.svc.Create(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			writeError(w, http.StatusBadRequest, "invalid track input")
			return
		}

		writeError(w, http.StatusInternalServerError, "failed to create track")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, track)
}

func parseInt(value string) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}

	return parsed
}

func writeError(w http.ResponseWriter, status int, msg string) {
	middleware.WriteJSON(w, status, map[string]string{"error": msg})
}
