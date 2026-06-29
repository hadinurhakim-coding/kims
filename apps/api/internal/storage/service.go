package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const defaultSignedURLTTLSeconds = 3600

var ErrNotConfigured = errors.New("storage is not configured")
var ErrInvalidObjectPath = errors.New("invalid storage object path")

type UploadTarget string

const (
	UploadTargetAudio UploadTarget = "audio"
	UploadTargetCover UploadTarget = "cover"
)

type UploadRequest struct {
	Target      UploadTarget
	Path        string
	ContentType string
	Body        io.Reader
	Upsert      bool
}

type UploadResult struct {
	Path      string
	PublicURL string
}

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
		log.Printf("supabase storage signed url request failed: %v", err)
		return value, nil
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		var errBody map[string]any
		_ = json.NewDecoder(res.Body).Decode(&errBody)
		log.Printf("supabase storage signed url failed status=%d body=%v", res.StatusCode, errBody)
		return value, nil
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
		log.Printf("supabase storage signed url response missing signedURL")
		return value, nil
	}
	if strings.HasPrefix(signedURL, "http://") || strings.HasPrefix(signedURL, "https://") {
		return signedURL, nil
	}
	if strings.HasPrefix(signedURL, "/") {
		return s.supabaseURL + "/storage/v1" + signedURL, nil
	}

	return s.supabaseURL + "/storage/v1/" + signedURL, nil
}

func (s *Service) UploadObject(ctx context.Context, req UploadRequest) (*UploadResult, error) {
	if s == nil || s.supabaseURL == "" || s.serviceRoleKey == "" {
		return nil, ErrNotConfigured
	}
	if req.Body == nil {
		return nil, ErrInvalidObjectPath
	}

	bucket, err := s.bucketForTarget(req.Target)
	if err != nil {
		return nil, err
	}

	objectPath := normalizeObjectPath(req.Path)
	if objectPath == "" {
		return nil, ErrInvalidObjectPath
	}

	endpoint := fmt.Sprintf(
		"%s/storage/v1/object/%s/%s",
		s.supabaseURL,
		url.PathEscape(bucket),
		escapeObjectPath(objectPath),
	)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, req.Body)
	if err != nil {
		return nil, fmt.Errorf("create upload request: %w", err)
	}

	contentType := strings.TrimSpace(req.ContentType)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	httpReq.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	httpReq.Header.Set("apikey", s.serviceRoleKey)
	httpReq.Header.Set("Content-Type", contentType)
	if req.Upsert {
		httpReq.Header.Set("x-upsert", "true")
	}

	client := s.httpClient
	if client == nil {
		client = http.DefaultClient
	}

	res, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("upload storage object: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		var errBody map[string]any
		_ = json.NewDecoder(res.Body).Decode(&errBody)
		return nil, fmt.Errorf("upload storage object status=%d body=%v", res.StatusCode, errBody)
	}

	result := &UploadResult{Path: objectPath}
	if req.Target == UploadTargetCover {
		result.PublicURL = s.ResolveCoverURL(objectPath)
	}

	return result, nil
}

func (s *Service) bucketForTarget(target UploadTarget) (string, error) {
	switch target {
	case UploadTargetAudio:
		if s.audioBucket == "" {
			return "", ErrNotConfigured
		}
		return s.audioBucket, nil
	case UploadTargetCover:
		if s.coversBucket == "" {
			return "", ErrNotConfigured
		}
		return s.coversBucket, nil
	default:
		return "", ErrInvalidObjectPath
	}
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

func normalizeObjectPath(path string) string {
	path = strings.Trim(strings.ReplaceAll(path, "\\", "/"), "/")
	if path == "" ||
		strings.Contains(path, "../") ||
		strings.Contains(path, "/..") ||
		path == ".." ||
		strings.Contains(path, "//") {
		return ""
	}

	return path
}
