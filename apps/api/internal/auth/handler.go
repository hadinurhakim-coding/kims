package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/middleware"
)

type Handler struct {
	svc *Service
}

type errorResponse struct {
	Error string `json:"error"`
}

type messageResponse struct {
	Message string `json:"message"`
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	log.Printf("[debug][register][backend] handler:start method=%s path=%s", r.Method, r.URL.Path)

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[debug][register][backend] handler:decode_error err=%v", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	log.Printf(
		"[debug][register][backend] handler:decoded email=%q name=%q has_password=%t",
		req.Email,
		req.Name,
		req.Password != "",
	)

	res, err := h.svc.Register(r.Context(), req)
	if err != nil {
		log.Printf("[debug][register][backend] handler:service_error email=%q err=%v", req.Email, err)
		switch {
		case errors.Is(err, ErrInvalidInput):
			writeError(w, http.StatusBadRequest, "name, email, and password are required")
		case errors.Is(err, ErrEmailAlreadyExists):
			writeError(w, http.StatusConflict, "email already registered")
		default:
			writeError(w, http.StatusInternalServerError, "registration failed")
		}
		return
	}

	log.Printf(
		"[debug][register][backend] handler:success user_id=%s email=%q",
		res.User.ID,
		res.User.Email,
	)
	writeJSON(w, http.StatusCreated, res)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.svc.Login(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			writeError(w, http.StatusBadRequest, "email and password are required")
		case errors.Is(err, ErrInvalidCredentials):
			writeError(w, http.StatusUnauthorized, "invalid credentials")
		default:
			writeError(w, http.StatusInternalServerError, "login failed")
		}
		return
	}

	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.svc.Refresh(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			writeError(w, http.StatusBadRequest, "refresh token is required")
		case errors.Is(err, ErrInvalidToken):
			writeError(w, http.StatusUnauthorized, "invalid refresh token")
		default:
			writeError(w, http.StatusInternalServerError, "refresh failed")
		}
		return
	}

	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, ok := userIDFromContext(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.svc.Logout(r.Context(), userID, ""); err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			writeError(w, http.StatusUnauthorized, "unauthorized")
		default:
			writeError(w, http.StatusInternalServerError, "logout failed")
		}
		return
	}

	writeJSON(w, http.StatusOK, messageResponse{Message: "logged out"})
}

func userIDFromContext(r *http.Request) (string, bool) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		return "", false
	}

	return userID, true
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
