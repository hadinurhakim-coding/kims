package favorites

import (
	"context"
	"errors"
	"fmt"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/storage"
)

var ErrAlreadyFavorited = errors.New("track already favorited")
var ErrNotFavorited = errors.New("track not in favorites")

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
	for i := range items {
		if err := s.resolveFavoriteTrack(ctx, &items[i]); err != nil {
			return nil, err
		}
	}

	return &ListResponse{
		Favorites: items,
		Total:     len(items),
	}, nil
}

func (s *Service) Add(ctx context.Context, userID, trackID string) error {
	return s.repo.Add(ctx, userID, trackID)
}

func (s *Service) Remove(ctx context.Context, userID, trackID string) error {
	return s.repo.Remove(ctx, userID, trackID)
}

func (s *Service) resolveFavoriteTrack(ctx context.Context, track *FavoriteTrack) error {
	if s.storage == nil || track == nil {
		return nil
	}

	track.CoverURL = s.storage.ResolveCoverURL(track.CoverURL)

	audioURL, err := s.storage.ResolveAudioURL(ctx, track.AudioURL)
	if err != nil {
		return fmt.Errorf("resolve favorite audio url: %w", err)
	}
	track.AudioURL = audioURL

	return nil
}
