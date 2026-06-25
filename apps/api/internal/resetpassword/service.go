package resetpassword

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"net/mail"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/argon2"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/email"
)

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrInvalidInput   = errors.New("invalid input")
	ErrInvalidOTP     = errors.New("invalid or expired OTP code")
	ErrOTPAlreadyUsed = errors.New("OTP code already used")
	ErrPasswordReused = errors.New("new password must be different from current password")
)

const (
	otpChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	argonTime    = 1
	argonMemory  = 64 * 1024
	argonThreads = 4
	argonKeyLen  = 32
	saltLen      = 16
)

type Service struct {
	repo     *Repository
	emailSvc *email.Service
}

func NewService(repo *Repository, emailSvc *email.Service) *Service {
	return &Service{
		repo:     repo,
		emailSvc: emailSvc,
	}
}

func (s *Service) RequestOTP(ctx context.Context, req RequestOTPRequest) error {
	emailAddress, err := normalizeEmail(req.Email)
	if err != nil {
		return ErrInvalidInput
	}

	userID, name, err := s.repo.GetUserByEmail(ctx, emailAddress)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}

		return fmt.Errorf("get user by email: %w", err)
	}

	otpCode, err := generateOTP()
	if err != nil {
		return fmt.Errorf("generate otp: %w", err)
	}

	if err := s.repo.CreateOTP(
		ctx,
		userID,
		hashOTP(otpCode),
		time.Now().Add(30*time.Minute),
	); err != nil {
		return fmt.Errorf("create otp: %w", err)
	}

	if s.emailSvc == nil {
		return errors.New("email service is not configured")
	}

	if err := s.emailSvc.SendOTP(emailAddress, name, otpCode); err != nil {
		return fmt.Errorf("send otp: %w", err)
	}

	return nil
}

func (s *Service) VerifyOTP(ctx context.Context, req VerifyOTPRequest) (bool, error) {
	userID, err := s.userIDForEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return false, ErrInvalidOTP
		}

		return false, err
	}

	reset, err := s.validResetForOTP(ctx, req.OTPCode)
	if err != nil {
		return false, err
	}

	if subtle.ConstantTimeCompare([]byte(reset.UserID), []byte(userID)) != 1 {
		return false, ErrInvalidOTP
	}

	return true, nil
}

func (s *Service) ResetPassword(ctx context.Context, req ResetPasswordRequest) error {
	if strings.TrimSpace(req.NewPassword) == "" || len(req.NewPassword) < 8 {
		return ErrInvalidInput
	}

	userID, err := s.userIDForEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return ErrInvalidOTP
		}

		return err
	}

	reset, err := s.validResetForOTP(ctx, req.OTPCode)
	if err != nil {
		return err
	}

	if subtle.ConstantTimeCompare([]byte(reset.UserID), []byte(userID)) != 1 {
		return ErrInvalidOTP
	}

	currentPasswordHash, err := s.repo.GetPasswordHash(ctx, userID)
	if err != nil {
		return fmt.Errorf("get password hash: %w", err)
	}

	if verifyPassword(currentPasswordHash, req.NewPassword) {
		return ErrPasswordReused
	}

	hashedPassword, err := hashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	if err := s.repo.UpdatePassword(ctx, userID, hashedPassword); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	if err := s.repo.MarkOTPUsed(ctx, reset.ID); err != nil {
		return fmt.Errorf("mark otp used: %w", err)
	}

	return nil
}

func (s *Service) userIDForEmail(ctx context.Context, email string) (string, error) {
	emailAddress, err := normalizeEmail(email)
	if err != nil {
		return "", ErrInvalidInput
	}

	userID, _, err := s.repo.GetUserByEmail(ctx, emailAddress)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrUserNotFound
		}

		return "", fmt.Errorf("get user by email: %w", err)
	}

	return userID, nil
}

func (s *Service) validResetForOTP(ctx context.Context, otpCode string) (*PasswordReset, error) {
	normalizedOTP := strings.ToUpper(strings.TrimSpace(otpCode))
	if normalizedOTP == "" {
		return nil, ErrInvalidOTP
	}

	reset, err := s.repo.GetValidOTP(ctx, hashOTP(normalizedOTP))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidOTP
		}

		return nil, fmt.Errorf("get valid otp: %w", err)
	}

	if reset.UsedAt != nil {
		return nil, ErrOTPAlreadyUsed
	}

	return reset, nil
}

func generateOTP() (string, error) {
	otp := make([]byte, 8)
	for i := range otp {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(otpChars))))
		if err != nil {
			return "", fmt.Errorf("read random otp index: %w", err)
		}

		otp[i] = otpChars[n.Int64()]
	}

	return string(otp), nil
}

func hashOTP(otpCode string) string {
	sum := sha256.Sum256([]byte(strings.ToUpper(strings.TrimSpace(otpCode))))
	return hex.EncodeToString(sum[:])
}

func normalizeEmail(email string) (string, error) {
	normalized := strings.TrimSpace(strings.ToLower(email))
	if normalized == "" {
		return "", ErrInvalidInput
	}

	if _, err := mail.ParseAddress(normalized); err != nil {
		return "", ErrInvalidInput
	}

	return normalized, nil
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("read salt bytes: %w", err)
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argonTime,
		argonMemory,
		argonThreads,
		argonKeyLen,
	)

	return base64.RawStdEncoding.EncodeToString(salt) +
		":" +
		base64.RawStdEncoding.EncodeToString(hash), nil
}

func verifyPassword(stored string, plain string) bool {
	parts := strings.Split(stored, ":")
	if len(parts) != 2 {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[0])
	if err != nil {
		return false
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}

	actualHash := argon2.IDKey(
		[]byte(plain),
		salt,
		argonTime,
		argonMemory,
		argonThreads,
		uint32(len(expectedHash)),
	)

	return subtle.ConstantTimeCompare(actualHash, expectedHash) == 1
}
