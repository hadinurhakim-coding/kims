package resetpassword

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/middleware"
)

const resetMessage = "If this email is registered, you will receive a reset code shortly."

type Handler struct {
	svc *Service
}

type messageResponse struct {
	Message string `json:"message"`
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	var req RequestOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "invalid request body"})
		return
	}

	if strings.TrimSpace(req.Email) == "" {
		middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "email is required"})
		return
	}

	if err := h.svc.RequestOTP(r.Context(), req); err != nil {
		if errors.Is(err, ErrInvalidInput) {
			middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "valid email is required"})
			return
		}

		middleware.WriteJSON(w, http.StatusInternalServerError, messageResponse{Message: "unable to send reset code"})
		return
	}

	middleware.WriteJSON(w, http.StatusOK, RequestOTPResponse{Message: resetMessage})
}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteJSON(w, http.StatusBadRequest, VerifyOTPResponse{
			Valid:   false,
			Message: "invalid request body",
		})
		return
	}

	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.OTPCode) == "" {
		middleware.WriteJSON(w, http.StatusBadRequest, VerifyOTPResponse{
			Valid:   false,
			Message: "email and otp_code are required",
		})
		return
	}

	valid, err := h.svc.VerifyOTP(r.Context(), req)
	if err != nil {
		status := http.StatusInternalServerError
		message := "unable to verify code"
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrInvalidOTP) {
			status = http.StatusBadRequest
			message = "Invalid or expired code"
		}

		middleware.WriteJSON(w, status, VerifyOTPResponse{
			Valid:   false,
			Message: message,
		})
		return
	}

	middleware.WriteJSON(w, http.StatusOK, VerifyOTPResponse{
		Valid:   valid,
		Message: "OTP verified",
	})
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "invalid request body"})
		return
	}

	if strings.TrimSpace(req.Email) == "" ||
		strings.TrimSpace(req.OTPCode) == "" ||
		strings.TrimSpace(req.NewPassword) == "" {
		middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "email, otp_code, and new_password are required"})
		return
	}

	if len(req.NewPassword) < 8 {
		middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "new_password must be at least 8 characters"})
		return
	}

	if err := h.svc.ResetPassword(r.Context(), req); err != nil {
		switch {
		case errors.Is(err, ErrInvalidOTP):
			middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "Invalid or expired code"})
		case errors.Is(err, ErrInvalidInput):
			middleware.WriteJSON(w, http.StatusBadRequest, messageResponse{Message: "invalid request"})
		default:
			middleware.WriteJSON(w, http.StatusInternalServerError, messageResponse{Message: "password reset failed"})
		}
		return
	}

	middleware.WriteJSON(w, http.StatusOK, messageResponse{Message: "Password reset successfully"})
}
