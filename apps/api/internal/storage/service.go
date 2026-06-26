package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const defaultSignedURLTTLSeconds = 3600

type Service struct {
	supabaseURL    string
	serviceRoleKey string
	audioBucket    string
	coversBucket   string
	httpClient     *http.Client
}

func NewServiceFromEnv() *Service {
	return &Service{
		supabaseURL:    strings.TrimRight(os.Getenv("SUPABASE_URL"), "/"),
		serviceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		audioBucket:    getenvDefault("SUPABASE_AUDIO_BUCKET", "audio"),
		coversBucket:   getenvDefault("SUPABASE_COVERS_BUCKET", "covers"),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *Service) ResolveCoverURL(value string) string {
	if s == nil || isResolvedURL(value) || s.supabaseURL == "" || s.coversBucket == "" {
		return value
	}

	return fmt.Sprintf(
		"%s/storage/v1/object/public/%s/%s",
		s.supabaseURL,
		url.PathEscape(s.coversBucket),
		escapeObjectPath(value),
	)
}

func (s *Service) ResolveAudioURL(ctx context.Context, value string) (string, error) {
	if s == nil || isResolvedURL(value) {
		return value, nil
	}
	if s.supabaseURL == "" || s.serviceRoleKey == "" || s.audioBucket == "" {
		return value, nil
	}

	payload := struct {
		ExpiresIn int `json:"expiresIn"`
	}{
		ExpiresIn: defaultSignedURLTTLSeconds,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal signed url request: %w", err)
	}

	endpoint := fmt.Sprintf(
		"%s/storage/v1/object/sign/%s/%s",
		s.supabaseURL,
		url.PathEscape(s.audioBucket),
		escapeObjectPath(value),
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create signed url request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.serviceRoleKey)

	res, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("call supabase storage: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		var errBody map[string]any
		_ = json.NewDecoder(res.Body).Decode(&errBody)
		return "", fmt.Errorf("supabase storage status=%d body=%v", res.StatusCode, errBody)
	}

	var signedRes struct {
		SignedURL string `json:"signedURL"`
		SignedUrl string `json:"signedUrl"`
	}
	if err := json.NewDecoder(res.Body).Decode(&signedRes); err != nil {
		return "", fmt.Errorf("decode signed url response: %w", err)
	}

	signedURL := signedRes.SignedURL
	if signedURL == "" {
		signedURL = signedRes.SignedUrl
	}
	if signedURL == "" {
		return "", fmt.Errorf("signed url response missing signedURL")
	}
	if strings.HasPrefix(signedURL, "http://") || strings.HasPrefix(signedURL, "https://") {
		return signedURL, nil
	}
	if strings.HasPrefix(signedURL, "/") {
		return s.supabaseURL + "/storage/v1" + signedURL, nil
	}

	return s.supabaseURL + "/storage/v1/" + signedURL, nil
}

func getenvDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func isResolvedURL(value string) bool {
	return value == "" ||
		strings.HasPrefix(value, "/") ||
		strings.HasPrefix(value, "http://") ||
		strings.HasPrefix(value, "https://")
}

func escapeObjectPath(path string) string {
	parts := strings.Split(strings.TrimLeft(path, "/"), "/")
	for i, part := range parts {
		parts[i] = url.PathEscape(part)
	}

	return strings.Join(parts, "/")
}
