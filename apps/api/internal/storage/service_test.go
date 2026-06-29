package storage

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResolveCoverURLUsesPublicBucket(t *testing.T) {
	service := &Service{
		supabaseURL:  "https://example.supabase.co",
		coversBucket: "covers",
	}

	got := service.ResolveCoverURL("music/hadi cover.png")
	want := "https://example.supabase.co/storage/v1/object/public/covers/music/hadi%20cover.png"

	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestResolveCoverURLLeavesResolvedValues(t *testing.T) {
	service := &Service{
		supabaseURL:  "https://example.supabase.co",
		coversBucket: "covers",
	}

	for _, value := range []string{
		"",
		"/placeholder-cover.png",
		"https://cdn.example.com/cover.png",
		"http://cdn.example.com/cover.png",
	} {
		if got := service.ResolveCoverURL(value); got != value {
			t.Fatalf("expected resolved value %q to stay unchanged, got %q", value, got)
		}
	}
}

func TestResolveAudioURLUsesPrivateSignedURL(t *testing.T) {
	var requestPath string
	var requestURI string
	var requestAuth string
	var requestAPIKey string
	var requestPayload struct {
		ExpiresIn int `json:"expiresIn"`
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestPath = r.URL.Path
		requestURI = r.RequestURI
		requestAuth = r.Header.Get("Authorization")
		requestAPIKey = r.Header.Get("apikey")

		if err := json.NewDecoder(r.Body).Decode(&requestPayload); err != nil {
			t.Fatalf("decode request payload: %v", err)
		}

		_ = json.NewEncoder(w).Encode(map[string]string{
			"signedURL": "/object/sign/audio/music/Doa_Tanpa_Nama_Hadi.mp3?token=test-token",
		})
	}))
	defer server.Close()

	service := &Service{
		supabaseURL:    server.URL,
		serviceRoleKey: "service-role-key",
		audioBucket:    "audio",
		httpClient:     server.Client(),
	}

	got, err := service.ResolveAudioURL(context.Background(), "music/Doa Tanpa Nama Hadi.mp3")
	if err != nil {
		t.Fatalf("resolve audio url: %v", err)
	}

	want := server.URL + "/storage/v1/object/sign/audio/music/Doa_Tanpa_Nama_Hadi.mp3?token=test-token"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
	if requestPath != "/storage/v1/object/sign/audio/music/Doa Tanpa Nama Hadi.mp3" {
		t.Fatalf("unexpected request path %q", requestPath)
	}
	if requestURI != "/storage/v1/object/sign/audio/music/Doa%20Tanpa%20Nama%20Hadi.mp3" {
		t.Fatalf("unexpected request uri %q", requestURI)
	}
	if requestAuth != "Bearer service-role-key" {
		t.Fatalf("unexpected authorization header %q", requestAuth)
	}
	if requestAPIKey != "service-role-key" {
		t.Fatalf("unexpected apikey header %q", requestAPIKey)
	}
	if requestPayload.ExpiresIn != defaultSignedURLTTLSeconds {
		t.Fatalf("expected expiresIn %d, got %d", defaultSignedURLTTLSeconds, requestPayload.ExpiresIn)
	}
}

func TestResolveAudioURLFallsBackWhenSigningIsNotConfigured(t *testing.T) {
	service := &Service{
		supabaseURL: "https://example.supabase.co",
	}

	got, err := service.ResolveAudioURL(context.Background(), "music/example.mp3")
	if err != nil {
		t.Fatalf("resolve audio url: %v", err)
	}
	if got != "music/example.mp3" {
		t.Fatalf("expected unresolved path fallback, got %q", got)
	}
}
