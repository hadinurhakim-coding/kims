package tracks

import (
	"context"
	"io"
	"time"
)

type Track struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Type          string    `json:"type"`
	Mood          string    `json:"mood"`
	SFXCategory   *string   `json:"sfx_category,omitempty"`
	Duration      string    `json:"duration"`
	LicenseLabel  string    `json:"license_label"`
	CoverURL      string    `json:"cover_url"`
	AudioURL      string    `json:"audio_url"`
	DownloadCount int       `json:"download_count"`
	IsPublished   bool      `json:"is_published"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ListParams struct {
	Type          string
	Mood          string
	SFXCategory   string
	LicenseLabel  string
	Search        string
	IncludeDrafts bool
	Limit         int
	Offset        int
}

type ListResponse struct {
	Tracks []Track `json:"tracks"`
	Total  int     `json:"total"`
	Limit  int     `json:"limit"`
	Offset int     `json:"offset"`
}

type CreateRequest struct {
	Title        string  `json:"title"`
	Type         string  `json:"type"`
	Mood         string  `json:"mood"`
	SFXCategory  *string `json:"sfx_category,omitempty"`
	Duration     string  `json:"duration"`
	LicenseLabel string  `json:"license_label"`
	CoverURL     string  `json:"cover_url"`
	AudioURL     string  `json:"audio_url"`
	IsPublished  *bool   `json:"is_published,omitempty"`
}

type UploadRequest struct {
	Kind        string
	Path        string
	ContentType string
	Body        io.Reader
	Upsert      bool
}

type UploadResponse struct {
	Path      string `json:"path"`
	PublicURL string `json:"public_url,omitempty"`
}

type PlayURLResponse struct {
	URL       string `json:"url"`
	ExpiresIn int    `json:"expires_in"`
}

type DownloadResponse struct {
	URL       string `json:"url"`
	ExpiresIn int    `json:"expires_in"`
}

type HistoryRecorder interface {
	Record(ctx context.Context, userID, trackID string) error
}
