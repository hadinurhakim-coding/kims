package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

type signedURLRequest struct {
	ExpiresIn int `json:"expiresIn"`
}

type signedURLResponse struct {
	SignedURL string `json:"signedURL"`
	SignedUrl string `json:"signedUrl,omitempty"`
	Error     string `json:"error,omitempty"`
	Message   string `json:"message,omitempty"`
}

func (s *Service) CreateSignedAudioURL(filePath string, expirySeconds int) (string, error) {
	return s.createSignedAudioURL(context.Background(), filePath, expirySeconds)
}

func (s *Service) createSignedAudioURL(ctx context.Context, filePath string, expirySeconds int) (string, error) {
	if s == nil || s.supabaseURL == "" || s.serviceRoleKey == "" || s.audioBucket == "" {
		return "", ErrNotConfigured
	}

	objectPath := normalizeObjectPath(filePath)
	if objectPath == "" {
		return "", ErrInvalidObjectPath
	}

	if expirySeconds <= 0 {
		expirySeconds = defaultSignedURLTTLSeconds
	}

	endpoint := fmt.Sprintf(
		"%s/storage/v1/object/sign/%s/%s",
		s.supabaseURL,
		url.PathEscape(s.audioBucket),
		escapeObjectPath(objectPath),
	)

	payload := signedURLRequest{
		ExpiresIn: expirySeconds,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("apikey", s.serviceRoleKey)

	client := s.httpClient
	if client == nil {
		client = http.DefaultClient
	}

	res, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Supabase: %w", err)
	}
	defer res.Body.Close()

	var result signedURLResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if res.StatusCode >= 300 {
		if result.Error != "" {
			return "", fmt.Errorf("supabase storage error: %s", result.Error)
		}
		if result.Message != "" {
			return "", fmt.Errorf("supabase storage error: %s", result.Message)
		}

		return "", fmt.Errorf("supabase storage error: status %d", res.StatusCode)
	}

	signedURL := result.SignedURL
	if signedURL == "" {
		signedURL = result.SignedUrl
	}
	if signedURL == "" {
		return "", fmt.Errorf("supabase storage error: missing signedURL")
	}
	if strings.HasPrefix(signedURL, "http://") || strings.HasPrefix(signedURL, "https://") {
		return signedURL, nil
	}
	if strings.HasPrefix(signedURL, "/") {
		return s.supabaseURL + "/storage/v1" + signedURL, nil
	}

	return s.supabaseURL + "/storage/v1/" + signedURL, nil
}
