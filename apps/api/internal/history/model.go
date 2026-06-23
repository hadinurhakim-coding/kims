package history

import "time"

type Entry struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	TrackID   string    `json:"track_id"`
	PlayCount int       `json:"play_count"`
	PlayedAt  time.Time `json:"played_at"`
}

type HistoryTrack struct {
	EntryID      string    `json:"entry_id"`
	TrackID      string    `json:"id"`
	Title        string    `json:"title"`
	Type         string    `json:"type"`
	Mood         string    `json:"mood"`
	SFXCategory  *string   `json:"sfx_category,omitempty"`
	Duration     string    `json:"duration"`
	LicenseLabel string    `json:"license_label"`
	CoverURL     string    `json:"cover_url"`
	AudioURL     string    `json:"audio_url"`
	PlayCount    int       `json:"play_count"`
	PlayedAt     time.Time `json:"played_at"`
}

type RecordRequest struct {
	TrackID string `json:"track_id"`
}

type ListResponse struct {
	History []HistoryTrack `json:"history"`
	Total   int            `json:"total"`
}
