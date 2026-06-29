package tracks

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/audit"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/middleware"
	"github.com/hadinurhakim-coding/kims/apps/api/internal/storage"
)

type Handler struct {
	svc   *Service
	audit *audit.Repository
}

func NewHandler(svc *Service, auditRepo ...*audit.Repository) *Handler {
	var repo *audit.Repository
	if len(auditRepo) > 0 {
		repo = auditRepo[0]
	}

	return &Handler{svc: svc, audit: repo}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, false)
}

func (h *Handler) ListAdmin(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, true)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request, includeDrafts bool) {
	query := r.URL.Query()
	params := ListParams{
		Type:          query.Get("type"),
		Mood:          query.Get("mood"),
		SFXCategory:   query.Get("sfx_category"),
		LicenseLabel:  query.Get("license_label"),
		Search:        query.Get("search"),
		IncludeDrafts: includeDrafts,
		Limit:         parseInt(query.Get("limit")),
		Offset:        parseInt(query.Get("offset")),
	}

	var (
		res *ListResponse
		err error
	)
	if includeDrafts {
		res, err = h.svc.ListAdmin(r.Context(), params)
	} else {
		res, err = h.svc.List(r.Context(), params)
	}
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
	if err := h.recordAdminAction(r, "track.create", "track", track.ID, map[string]any{
		"title":        track.Title,
		"type":         track.Type,
		"is_published": track.IsPublished,
	}); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to record audit log")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, track)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	track, err := h.svc.Update(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		writeTrackMutationError(w, err, "failed to update track")
		return
	}
	if err := h.recordAdminAction(r, "track.update", "track", track.ID, map[string]any{
		"title":        track.Title,
		"type":         track.Type,
		"is_published": track.IsPublished,
	}); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to record audit log")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, track)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), trackID); err != nil {
		writeTrackMutationError(w, err, "failed to delete track")
		return
	}
	if err := h.recordAdminAction(r, "track.delete", "track", trackID, nil); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to record audit log")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "track deleted",
	})
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	result, err := h.svc.UploadMedia(r.Context(), UploadRequest{
		Kind:        r.FormValue("kind"),
		Path:        r.FormValue("path"),
		ContentType: contentType,
		Body:        file,
		Upsert:      parseBoolDefault(r.FormValue("upsert"), true),
	})
	if err != nil {
		writeTrackMutationError(w, err, "failed to upload file")
		return
	}
	if err := h.recordAdminAction(r, "media.upload", "storage_object", result.Path, map[string]any{
		"kind":         r.FormValue("kind"),
		"path":         result.Path,
		"content_type": contentType,
		"upsert":       parseBoolDefault(r.FormValue("upsert"), true),
	}); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to record audit log")
		return
	}

	middleware.WriteJSON(w, http.StatusCreated, result)
}

func parseInt(value string) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}

	return parsed
}

func parseBoolDefault(value string, fallback bool) bool {
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func writeTrackMutationError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, ErrInvalidInput), errors.Is(err, storage.ErrInvalidObjectPath):
		writeError(w, http.StatusBadRequest, "invalid track input")
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "track not found")
	case errors.Is(err, storage.ErrNotConfigured):
		writeError(w, http.StatusInternalServerError, "storage is not configured")
	default:
		writeError(w, http.StatusInternalServerError, fallback)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	middleware.WriteJSON(w, status, map[string]string{"error": msg})
}

func (h *Handler) recordAdminAction(
	r *http.Request,
	action string,
	resourceType string,
	resourceID string,
	metadata map[string]any,
) error {
	if h.audit == nil {
		return nil
	}

	userID, _ := middleware.GetUserID(r.Context())
	return h.audit.Record(r.Context(), audit.RecordRequest{
		ActorUserID:  userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Metadata:     metadata,
	})
}
