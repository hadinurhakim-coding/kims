package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/argon2"
)

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrEmailAlreadyExists = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

const (
	argonTime    = 1
	argonMemory  = 64 * 1024
	argonThreads = 4
	argonKeyLen  = 32
	saltLen      = 16

	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 30 * 24 * time.Hour
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(
	ctx context.Context,
	req RegisterRequest,
) (*AuthResponse, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	log.Printf(
		"[debug][register][backend] service:start email=%q name=%q has_password=%t",
		req.Email,
		req.Name,
		req.Password != "",
	)

	if req.Name == "" || req.Email == "" || req.Password == "" {
		log.Printf("[debug][register][backend] service:invalid_input email=%q name_empty=%t email_empty=%t password_empty=%t", req.Email, req.Name == "", req.Email == "", req.Password == "")
		return nil, ErrInvalidInput
	}

	if _, err := s.repo.GetUserByEmail(ctx, req.Email); err == nil {
		log.Printf("[debug][register][backend] service:email_exists email=%q", req.Email)
		return nil, ErrEmailAlreadyExists
	} else if !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("[debug][register][backend] service:existing_user_check_error email=%q err=%v", req.Email, err)
		return nil, fmt.Errorf("check existing user: %w", err)
	}
	log.Printf("[debug][register][backend] service:email_available email=%q", req.Email)

	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		log.Printf("[debug][register][backend] service:hash_error email=%q err=%v", req.Email, err)
		return nil, fmt.Errorf("hash password: %w", err)
	}
	log.Printf("[debug][register][backend] service:password_hashed email=%q", req.Email)

	user, err := s.repo.CreateUser(ctx, req.Name, req.Email, hashedPassword)
	if err != nil {
		log.Printf("[debug][register][backend] service:create_user_error email=%q err=%v", req.Email, err)
		return nil, fmt.Errorf("create user: %w", err)
	}
	log.Printf("[debug][register][backend] service:user_created user_id=%s email=%q", user.ID, user.Email)

	auth, err := s.issueTokens(ctx, user)
	if err != nil {
		log.Printf("[debug][register][backend] service:issue_tokens_error user_id=%s email=%q err=%v", user.ID, user.Email, err)
		return nil, err
	}

	log.Printf("[debug][register][backend] service:success user_id=%s email=%q", auth.User.ID, auth.User.Email)
	return auth, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" || req.Password == "" {
		return nil, ErrInvalidInput
	}

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}

		return nil, fmt.Errorf("get user by email: %w", err)
	}

	if !verifyPassword(user.Password, req.Password) {
		return nil, ErrInvalidCredentials
	}

	return s.issueTokens(ctx, user)
}

func (s *Service) Refresh(
	ctx context.Context,
	req RefreshRequest,
) (*AuthResponse, error) {
	if strings.TrimSpace(req.RefreshToken) == "" {
		return nil, ErrInvalidInput
	}

	tokenHash := hashToken(req.RefreshToken)
	userID, expiresAt, revokedAt, err := s.repo.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidToken
		}

		return nil, fmt.Errorf("get refresh token: %w", err)
	}

	if revokedAt != nil || time.Now().After(expiresAt) {
		return nil, ErrInvalidToken
	}

	if err := s.repo.RevokeRefreshToken(ctx, tokenHash); err != nil {
		return nil, fmt.Errorf("revoke refresh token: %w", err)
	}

	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}

	return s.issueTokens(ctx, user)
}

func (s *Service) Logout(ctx context.Context, userID string, _ string) error {
	if strings.TrimSpace(userID) == "" {
		return ErrInvalidInput
	}

	if err := s.repo.RevokeAllUserTokens(ctx, userID); err != nil {
		return fmt.Errorf("revoke user tokens: %w", err)
	}

	return nil
}

func (s *Service) issueTokens(ctx context.Context, user *User) (*AuthResponse, error) {
	accessToken, err := generateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	if err := s.repo.SaveRefreshToken(
		ctx,
		user.ID,
		hashToken(refreshToken),
		time.Now().Add(refreshTokenTTL),
	); err != nil {
		return nil, fmt.Errorf("save refresh token: %w", err)
	}

	user.Password = ""
	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}

func generateAccessToken(userID string, email string) (string, error) {
	secret := os.Getenv("JWT_ACCESS_SECRET")
	if secret == "" {
		return "", errors.New("JWT_ACCESS_SECRET is required")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(accessTokenTTL).Unix(),
	})

	return token.SignedString([]byte(secret))
}

func generateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("read random bytes: %w", err)
	}

	return hex.EncodeToString(bytes), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
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
