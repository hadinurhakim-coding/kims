package middleware

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserIDKey    contextKey = "user_id"
	UserEmailKey contextKey = "user_email"
	UserRoleKey  contextKey = "user_role"
)

func GetUserID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(UserIDKey).(string)
	return id, ok
}

func GetUserEmail(ctx context.Context) (string, bool) {
	email, ok := ctx.Value(UserEmailKey).(string)
	return email, ok
}

func GetUserRole(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(UserRoleKey).(string)
	return role, ok
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "authorization header required",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "invalid authorization format",
			})
			return
		}

		token, err := jwt.Parse(
			parts[1],
			func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, errors.New("unexpected signing method")
				}

				secret := os.Getenv("JWT_ACCESS_SECRET")
				if secret == "" {
					return nil, errors.New("JWT_ACCESS_SECRET is required")
				}

				return []byte(secret), nil
			},
			jwt.WithValidMethods([]string{"HS256"}),
		)
		if err != nil || !token.Valid {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "invalid or expired token",
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "invalid claims",
			})
			return
		}
		if _, ok := claims["exp"]; !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "invalid claims",
			})
			return
		}

		userID, _ := claims["user_id"].(string)
		email, _ := claims["email"].(string)
		role, _ := claims["role"].(string)
		if userID == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "invalid claims",
			})
			return
		}
		if role == "" {
			role = "user"
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, UserEmailKey, email)
		ctx = context.WithValue(ctx, UserRoleKey, role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := GetUserRole(r.Context())
		if !ok || role != "admin" {
			writeJSON(w, http.StatusForbidden, map[string]string{
				"error": "admin access required",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}
