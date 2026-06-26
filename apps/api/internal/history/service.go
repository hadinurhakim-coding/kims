package history

import (
	"context"
	"errors"
	"fmt"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/storage"
)

var ErrNotFound = errors.New("history entry not found")
var ErrInvalidInput = errors.New("invalid history input")

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

func (s *Service) List(ctx context.Context, userID string, limit, offset int) (*ListResponse, error) {
	if limit < 1 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}

	items, total, err := s.repo.List(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	for i := range items {
		if err := s.resolveHistoryTrack(ctx, &items[i]); err != nil {
			return nil, err
		}
	}

	return &ListResponse{
		History: items,
		Total:   total,
	}, nil
}

func (s *Service) Record(ctx context.Context, userID, trackID string) error {
	if trackID == "" {
		return ErrInvalidInput
	}

	return s.repo.Record(ctx, userID, trackID)
}

func (s *Service) Remove(ctx context.Context, entryID, userID string) error {
	if entryID == "" {
		return ErrInvalidInput
	}

	return s.repo.Remove(ctx, entryID, userID)
}

func (s *Service) Clear(ctx context.Context, userID string) error {
	return s.repo.Clear(ctx, userID)
}

func (s *Service) resolveHistoryTrack(ctx context.Context, track *HistoryTrack) error {
	if s.storage == nil || track == nil {
		return nil
	}

	track.CoverURL = s.storage.ResolveCoverURL(track.CoverURL)

	audioURL, err := s.storage.ResolveAudioURL(ctx, track.AudioURL)
	if err != nil {
		return fmt.Errorf("resolve history audio url: %w", err)
	}
	track.AudioURL = audioURL

	return nil
}
