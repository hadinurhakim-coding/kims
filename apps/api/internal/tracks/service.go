package tracks

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/hadinurhakim-coding/kims/apps/api/internal/storage"
)

var ErrNotFound = errors.New("track not found")
var ErrInvalidInput = errors.New("invalid track input")

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

func (s *Service) List(ctx context.Context, params ListParams) (*ListResponse, error) {
	if params.Limit < 1 {
		params.Limit = 50
	}
	if params.Limit > 100 {
		params.Limit = 100
	}
	if params.Offset < 0 {
		params.Offset = 0
	}

	items, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, err
	}
	if err := s.resolveTracks(ctx, items); err != nil {
		return nil, err
	}

	return &ListResponse{
		Tracks: items,
		Total:  total,
		Limit:  params.Limit,
		Offset: params.Offset,
	}, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Track, error) {
	if id == "" {
		return nil, ErrNotFound
	}

	track, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if track == nil {
		return nil, ErrNotFound
	}
	if err := s.resolveTrack(ctx, track); err != nil {
		return nil, err
	}

	return track, nil
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*Track, error) {
	req.Title = strings.TrimSpace(req.Title)
	req.Type = strings.TrimSpace(req.Type)
	req.Mood = strings.TrimSpace(req.Mood)
	req.Duration = strings.TrimSpace(req.Duration)
	req.LicenseLabel = strings.TrimSpace(req.LicenseLabel)
	req.CoverURL = strings.TrimSpace(req.CoverURL)
	req.AudioURL = strings.TrimSpace(req.AudioURL)

	if req.SFXCategory != nil {
		trimmed := strings.TrimSpace(*req.SFXCategory)
		req.SFXCategory = &trimmed
		if trimmed == "" {
			req.SFXCategory = nil
		}
	}

	if req.Title == "" ||
		req.Type == "" ||
		req.Mood == "" ||
		req.Duration == "" ||
		req.LicenseLabel == "" ||
		req.CoverURL == "" ||
		req.AudioURL == "" {
		return nil, ErrInvalidInput
	}

	isPublished := true
	if req.IsPublished != nil {
		isPublished = *req.IsPublished
	}

	track, err := s.repo.Create(ctx, req, isPublished)
	if err != nil {
		return nil, err
	}
	if err := s.resolveTrack(ctx, track); err != nil {
		return nil, err
	}

	return track, nil
}

func (s *Service) resolveTracks(ctx context.Context, tracks []Track) error {
	for i := range tracks {
		if err := s.resolveTrack(ctx, &tracks[i]); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) resolveTrack(ctx context.Context, track *Track) error {
	if s.storage == nil || track == nil {
		return nil
	}

	track.CoverURL = s.storage.ResolveCoverURL(track.CoverURL)

	audioURL, err := s.storage.ResolveAudioURL(ctx, track.AudioURL)
	if err != nil {
		return fmt.Errorf("resolve track audio url: %w", err)
	}
	track.AudioURL = audioURL

	return nil
}
