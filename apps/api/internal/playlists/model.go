package playlists

import "time"

type Playlist struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PlaylistTrack struct {
	TrackID      string    `json:"id"`
	Title        string    `json:"title"`
	Type         string    `json:"type"`
	Mood         string    `json:"mood"`
	SFXCategory  *string   `json:"sfx_category,omitempty"`
	Duration     string    `json:"duration"`
	LicenseLabel string    `json:"license_label"`
	CoverURL     string    `json:"cover_url"`
	AudioURL     string    `json:"audio_url"`
	Position     int       `json:"position"`
	AddedAt      time.Time `json:"added_at"`
}

type PlaylistDetail struct {
	Playlist
	Tracks []PlaylistTrack `json:"tracks"`
	Total  int             `json:"total"`
}

type CreateRequest struct {
	Name string `json:"name"`
}

type AddTrackRequest struct {
	TrackID string `json:"track_id"`
}

type ListResponse struct {
	Playlists []Playlist `json:"playlists"`
	Total     int        `json:"total"`
}
