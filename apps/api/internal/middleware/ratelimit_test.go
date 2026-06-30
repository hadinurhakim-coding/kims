package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter_AllowsRequestsWithinLimit(t *testing.T) {
	limiter := NewRateLimiterForTests(func() time.Time {
		return time.Unix(100, 0)
	})
	handler := limiter.Middleware(RateLimitConfig{
		Limit:  2,
		Window: time.Minute,
		Scope:  "test",
	})(corsOKHandler())

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/tracks", nil)
		req.RemoteAddr = "192.0.2.1:1234"
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("request %d expected status %d, got %d", i+1, http.StatusOK, rec.Code)
		}
	}
}

func TestRateLimiter_RejectsRequestsOverLimit(t *testing.T) {
	limiter := NewRateLimiterForTests(func() time.Time {
		return time.Unix(100, 0)
	})
	handler := limiter.Middleware(RateLimitConfig{
		Limit:  1,
		Window: time.Minute,
		Scope:  "test",
	})(corsOKHandler())

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
		req.RemoteAddr = "192.0.2.1:1234"
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if i == 0 && rec.Code != http.StatusOK {
			t.Fatalf("first request expected status %d, got %d", http.StatusOK, rec.Code)
		}
		if i == 1 {
			if rec.Code != http.StatusTooManyRequests {
				t.Fatalf("second request expected status %d, got %d", http.StatusTooManyRequests, rec.Code)
			}
			if got := rec.Header().Get("Retry-After"); got == "" {
				t.Fatalf("expected Retry-After header")
			}
		}
	}
}

func TestRateLimiter_ResetsAfterWindow(t *testing.T) {
	now := time.Unix(100, 0)
	limiter := NewRateLimiterForTests(func() time.Time {
		return now
	})
	handler := limiter.Middleware(RateLimitConfig{
		Limit:  1,
		Window: time.Minute,
		Scope:  "test",
	})(corsOKHandler())

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	req.RemoteAddr = "192.0.2.1:1234"
	handler.ServeHTTP(httptest.NewRecorder(), req)

	now = now.Add(time.Minute + time.Second)

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d after window reset, got %d", http.StatusOK, rec.Code)
	}
}

func TestRateLimiter_UsesForwardedForClientIP(t *testing.T) {
	limiter := NewRateLimiterForTests(func() time.Time {
		return time.Unix(100, 0)
	})
	handler := limiter.Middleware(RateLimitConfig{
		Limit:  1,
		Window: time.Minute,
		Scope:  "test",
	})(corsOKHandler())

	first := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	first.RemoteAddr = "192.0.2.1:1234"
	first.Header.Set("X-Forwarded-For", "198.51.100.10, 192.0.2.1")
	handler.ServeHTTP(httptest.NewRecorder(), first)

	second := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	second.RemoteAddr = "192.0.2.1:1234"
	second.Header.Set("X-Forwarded-For", "198.51.100.11, 192.0.2.1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, second)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected different forwarded client IP to be allowed, got %d", rec.Code)
	}
}
