package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestRequireAuth_MissingHeader(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rec := httptest.NewRecorder()

	RequireAuth(okHandler(t)).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
}

func TestRequireAuth_InvalidFormat(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Token abc")
	rec := httptest.NewRecorder()

	RequireAuth(okHandler(t)).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	t.Setenv("JWT_ACCESS_SECRET", "test-access-secret-32-characters")

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer not-a-jwt")
	rec := httptest.NewRecorder()

	RequireAuth(okHandler(t)).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
}

func TestRequireAuth_ValidToken(t *testing.T) {
	const (
		secret = "test-access-secret-32-characters"
		userID = "user-123"
		email  = "kim@example.com"
		role   = "admin"
	)
	t.Setenv("JWT_ACCESS_SECRET", secret)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	rec := httptest.NewRecorder()

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUserID, ok := GetUserID(r.Context())
		if !ok || gotUserID != userID {
			t.Fatalf("expected user ID %q, got %q", userID, gotUserID)
		}

		gotEmail, ok := GetUserEmail(r.Context())
		if !ok || gotEmail != email {
			t.Fatalf("expected user email %q, got %q", email, gotEmail)
		}

		gotRole, ok := GetUserRole(r.Context())
		if !ok || gotRole != role {
			t.Fatalf("expected user role %q, got %q", role, gotRole)
		}

		w.WriteHeader(http.StatusOK)
	})

	RequireAuth(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestRequireAuth_DefaultsMissingRoleToUser(t *testing.T) {
	const (
		secret = "test-access-secret-32-characters"
		userID = "user-123"
		email  = "kim@example.com"
	)
	t.Setenv("JWT_ACCESS_SECRET", secret)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	rec := httptest.NewRecorder()

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRole, ok := GetUserRole(r.Context())
		if !ok || gotRole != "user" {
			t.Fatalf("expected default user role, got %q", gotRole)
		}

		w.WriteHeader(http.StatusOK)
	})

	RequireAuth(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestRequireAdmin_AllowsAdmin(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/admin", nil)
	req = req.WithContext(contextWithRole(req, "admin"))
	rec := httptest.NewRecorder()

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	})

	RequireAdmin(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, rec.Code)
	}
}

func TestRequireAdmin_RejectsNonAdmin(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/admin", nil)
	req = req.WithContext(contextWithRole(req, "user"))
	rec := httptest.NewRecorder()

	RequireAdmin(okHandler(t)).ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
}

func contextWithRole(req *http.Request, role string) context.Context {
	return context.WithValue(req.Context(), UserRoleKey, role)
}

func okHandler(t *testing.T) http.Handler {
	t.Helper()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called")
	})
}
