package resetpassword

import "time"

type PasswordReset struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	OTPHash   string     `json:"-"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type RequestOTPRequest struct {
	Email string `json:"email"`
}

type VerifyOTPRequest struct {
	Email   string `json:"email"`
	OTPCode string `json:"otp_code"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	OTPCode     string `json:"otp_code"`
	NewPassword string `json:"new_password"`
}

type RequestOTPResponse struct {
	Message string `json:"message"`
}

type VerifyOTPResponse struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}
