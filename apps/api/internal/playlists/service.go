package playlists

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/storage"
)

var ErrNotFound = errors.New("playlist not found")
var ErrNotOwner = errors.New("not authorized to modify this playlist")
var ErrInvalidInput = errors.New("invalid playlist input")

type Service struct {
	repo    *Repository
	storage *storage.Service
}

func NewService(repo *Repository, storageSvc ...*storage.Service) *Service {
	var mediaStorage *storage.Service
	if len(storageSvc) > 0 {
		mediaStorage = storageSvc[0]
	}

	return &Service{repo: repo, storage: mediaStorage}
}

func (s *Service) List(ctx context.Context, userID string) (*ListResponse, error) {
	items, err := s.repo.List(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &ListResponse{
		Playlists: items,
		Total:     len(items),
	}, nil
}

func (s *Service) Create(ctx context.Context, userID, name string) (*Playlist, error) {
	name = strings.TrimSpace(name)
	if name == "" || utf8.RuneCountInString(name) > 50 {
		return nil, ErrInvalidInput
	}

	return s.repo.Create(ctx, userID, name)
}

func (s *Service) GetByID(ctx context.Context, playlistID, userID string) (*PlaylistDetail, error) {
	detail, err := s.repo.GetByID(ctx, playlistID, userID)
	if err != nil {
		return nil, err
	}
	if detail == nil {
		return nil, ErrNotFound
	}
	for i := range detail.Tracks {
		if err := s.resolvePlaylistTrack(ctx, &detail.Tracks[i]); err != nil {
			return nil, err
		}
	}

	return detail, nil
}

func (s *Service) Delete(ctx context.Context, playlistID, userID string) error {
	if err := s.ensureOwner(ctx, playlistID, userID); err != nil {
		return err
	}

	return s.repo.Delete(ctx, playlistID, userID)
}

func (s *Service) AddTrack(ctx context.Context, playlistID, trackID, userID string) error {
	if trackID == "" {
		return ErrInvalidInput
	}
	if err := s.ensureOwner(ctx, playlistID, userID); err != nil {
		return err
	}

	return s.repo.AddTrack(ctx, playlistID, trackID)
}

func (s *Service) RemoveTrack(ctx context.Context, playlistID, trackID, userID string) error {
	if trackID == "" {
		return ErrInvalidInput
	}
	if err := s.ensureOwner(ctx, playlistID, userID); err != nil {
		return err
	}

	return s.repo.RemoveTrack(ctx, playlistID, trackID)
}

func (s *Service) ensureOwner(ctx context.Context, playlistID, userID string) error {
	if playlistID == "" || userID == "" {
		return ErrInvalidInput
	}

	isOwner, err := s.repo.IsOwner(ctx, playlistID, userID)
	if err != nil {
		return err
	}
	if isOwner {
		return nil
	}

	exists, err := s.repo.exists(ctx, playlistID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}

	return ErrNotOwner
}

func (s *Service) resolvePlaylistTrack(ctx context.Context, track *PlaylistTrack) error {
	if s.storage == nil || track == nil {
		return nil
	}

	track.CoverURL = s.storage.ResolveCoverURL(track.CoverURL)

	audioURL, err := s.storage.ResolveAudioURL(ctx, track.AudioURL)
	if err != nil {
		return fmt.Errorf("resolve playlist audio url: %w", err)
	}
	track.AudioURL = audioURL

	return nil
}
