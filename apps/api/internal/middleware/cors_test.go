package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS_AllowsConfiguredOrigin(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("WEB_ORIGINS", "https://kims.example.com,http://localhost:3000")

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.Header.Set("Origin", "https://kims.example.com")
	rec := httptest.NewRecorder()

	CORSFromEnv()(corsOKHandler()).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if got := rec.Header().Get(allowOriginHeader); got != "https://kims.example.com" {
		t.Fatalf("expected allow origin header, got %q", got)
	}
	if got := rec.Header().Get(allowCredentialsHeader); got != "true" {
		t.Fatalf("expected credentials header, got %q", got)
	}
}

func TestCORS_RejectsUnconfiguredBrowserOrigin(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("WEB_ORIGINS", "https://kims.example.com")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/tracks", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	rec := httptest.NewRecorder()

	CORSFromEnv()(corsOKHandler()).ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
	if got := rec.Header().Get(allowOriginHeader); got != "" {
		t.Fatalf("expected no allow origin header, got %q", got)
	}
}

func TestCORS_AllowsConfiguredPreflight(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("WEB_ORIGIN", "http://localhost:3000")

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/tracks", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	rec := httptest.NewRecorder()

	CORSFromEnv()(corsOKHandler()).ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.Code)
	}
	if got := rec.Header().Get(allowMethodsHeader); got == "" {
		t.Fatalf("expected allow methods header")
	}
}

func corsOKHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}
