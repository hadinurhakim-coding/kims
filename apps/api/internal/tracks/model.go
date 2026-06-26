package tracks

import "time"

type Track struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Type         string    `json:"type"`
	Mood         string    `json:"mood"`
	SFXCategory  *string   `json:"sfx_category,omitempty"`
	Duration     string    `json:"duration"`
	LicenseLabel string    `json:"license_label"`
	CoverURL     string    `json:"cover_url"`
	AudioURL     string    `json:"audio_url"`
	IsPublished  bool      `json:"is_published"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ListParams struct {
	Type         string
	Mood         string
	SFXCategory  string
	LicenseLabel string
	Search       string
	Limit        int
	Offset       int
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
