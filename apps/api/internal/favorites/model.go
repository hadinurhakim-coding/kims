package favorites

import "time"

type Favorite struct {
	UserID    string    `json:"user_id"`
	TrackID   string    `json:"track_id"`
	CreatedAt time.Time `json:"created_at"`
}

type FavoriteTrack struct {
	TrackID      string    `json:"id"`
	Title        string    `json:"title"`
	Type         string    `json:"type"`
	Mood         string    `json:"mood"`
	SFXCategory  *string   `json:"sfx_category,omitempty"`
	Duration     string    `json:"duration"`
	LicenseLabel string    `json:"license_label"`
	CoverURL     string    `json:"cover_url"`
	AudioURL     string    `json:"audio_url"`
	FavoritedAt  time.Time `json:"favorited_at"`
}

type AddFavoriteRequest struct {
	TrackID string `json:"track_id"`
}

type ListResponse struct {
	Favorites []FavoriteTrack `json:"favorites"`
	Total     int             `json:"total"`
}
