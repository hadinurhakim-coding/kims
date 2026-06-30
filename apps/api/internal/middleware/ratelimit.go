package middleware

import (
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type RateLimitConfig struct {
	Limit  int
	Window time.Duration
	Scope  string
}

type rateLimitEntry struct {
	Count     int
	ExpiresAt time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	entries map[string]rateLimitEntry
	now     func() time.Time
}

func NewRateLimiter() *RateLimiter {
	limiter := &RateLimiter{
		entries: map[string]rateLimitEntry{},
		now:     time.Now,
	}
	limiter.StartCleanup(5 * time.Minute)
	return limiter
}

func NewRateLimiterForTests(now func() time.Time) *RateLimiter {
	return &RateLimiter{
		entries: map[string]rateLimitEntry{},
		now:     now,
	}
}

func (l *RateLimiter) Middleware(config RateLimitConfig) func(http.Handler) http.Handler {
	if config.Limit < 1 || config.Window <= 0 {
		return func(next http.Handler) http.Handler {
			return next
		}
	}

	scope := strings.TrimSpace(config.Scope)
	if scope == "" {
		scope = "api"
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			retryAfter, allowed := l.allow(scope, clientIP(r), config)
			if !allowed {
				w.Header().Set("Retry-After", strconv.Itoa(retryAfterSeconds(retryAfter)))
				writeJSON(w, http.StatusTooManyRequests, map[string]string{
					"error": "rate limit exceeded",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (l *RateLimiter) allow(scope string, ip string, config RateLimitConfig) (time.Duration, bool) {
	now := l.now()
	key := scope + ":" + ip

	l.mu.Lock()
	defer l.mu.Unlock()

	entry, ok := l.entries[key]
	if !ok || !now.Before(entry.ExpiresAt) {
		l.entries[key] = rateLimitEntry{
			Count:     1,
			ExpiresAt: now.Add(config.Window),
		}
		l.cleanupExpired(now)
		return 0, true
	}

	if entry.Count >= config.Limit {
		return entry.ExpiresAt.Sub(now), false
	}

	entry.Count++
	l.entries[key] = entry
	return 0, true
}

func (l *RateLimiter) cleanupExpired(now time.Time) {
	for key, entry := range l.entries {
		if !now.Before(entry.ExpiresAt) {
			delete(l.entries, key)
		}
	}
}

func (l *RateLimiter) StartCleanup(interval time.Duration) {
	if interval <= 0 {
		interval = 5 * time.Minute
	}

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			l.mu.Lock()
			l.cleanupExpired(l.now())
			l.mu.Unlock()
		}
	}()
}

func RateLimitConfigFromEnv(prefix string, fallbackLimit int, fallbackWindow time.Duration, scope string) RateLimitConfig {
	return RateLimitConfig{
		Limit:  getenvInt(prefix+"_LIMIT", fallbackLimit),
		Window: getenvDuration(prefix+"_WINDOW", fallbackWindow),
		Scope:  scope,
	}
}

func clientIP(r *http.Request) string {
	for _, headerName := range []string{"X-Forwarded-For", "X-Real-IP"} {
		headerValue := strings.TrimSpace(r.Header.Get(headerName))
		if headerValue == "" {
			continue
		}

		ip := strings.TrimSpace(strings.Split(headerValue, ",")[0])
		if ip != "" {
			return ip
		}
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}

	return r.RemoteAddr
}

func getenvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 {
		return fallback
	}

	return parsed
}

func getenvDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}

func retryAfterSeconds(duration time.Duration) int {
	seconds := int((duration + time.Second - 1) / time.Second)
	if seconds < 1 {
		return 1
	}

	return seconds
}
