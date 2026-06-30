package tracks

import (
	"context"
	"errors"
	"fmt"
	"log"
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
	return s.list(ctx, params, true)
}

func (s *Service) ListAdmin(ctx context.Context, params ListParams) (*ListResponse, error) {
	params.IncludeDrafts = true
	return s.list(ctx, params, false)
}

func (s *Service) list(ctx context.Context, params ListParams, resolveMedia bool) (*ListResponse, error) {
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
	if resolveMedia {
		if err := s.resolveTracks(ctx, items); err != nil {
			return nil, err
		}
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

func (s *Service) GetPlayURL(
	ctx context.Context,
	trackID string,
	storageSvc *storage.Service,
) (*PlayURLResponse, error) {
	track, err := s.repo.GetByID(ctx, trackID)
	if err != nil {
		return nil, err
	}
	if track == nil {
		return nil, ErrNotFound
	}
	if storageSvc == nil {
		return nil, storage.ErrNotConfigured
	}

	const expirySeconds = 1800
	signedURL, err := storageSvc.CreateSignedAudioURL(track.AudioURL, expirySeconds)
	if err != nil {
		return nil, fmt.Errorf("failed to create signed url: %w", err)
	}

	return &PlayURLResponse{
		URL:       signedURL,
		ExpiresIn: expirySeconds,
	}, nil
}

func (s *Service) Download(
	ctx context.Context,
	trackID string,
	userID string,
	storageSvc *storage.Service,
	historyRecorder HistoryRecorder,
) (*DownloadResponse, error) {
	track, err := s.repo.GetByID(ctx, trackID)
	if err != nil {
		return nil, err
	}
	if track == nil {
		return nil, ErrNotFound
	}
	if storageSvc == nil {
		return nil, storage.ErrNotConfigured
	}

	const expirySeconds = 300
	signedURL, err := storageSvc.CreateSignedAudioURL(track.AudioURL, expirySeconds)
	if err != nil {
		return nil, fmt.Errorf("failed to create signed url: %w", err)
	}

	if err := s.repo.IncrementDownloadCount(ctx, trackID); err != nil {
		log.Printf("warning: failed to increment download count for track %s: %v", trackID, err)
	}

	if userID != "" && historyRecorder != nil {
		if err := historyRecorder.Record(ctx, userID, trackID); err != nil {
			log.Printf("warning: failed to record download history: %v", err)
		}
	}

	return &DownloadResponse{
		URL:       signedURL,
		ExpiresIn: expirySeconds,
	}, nil
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*Track, error) {
	normalized, isPublished, err := normalizeTrackRequest(req)
	if err != nil {
		return nil, err
	}

	track, err := s.repo.Create(ctx, normalized, isPublished)
	if err != nil {
		return nil, err
	}
	if err := s.resolveTrack(ctx, track); err != nil {
		return nil, err
	}

	return track, nil
}

func (s *Service) Update(ctx context.Context, id string, req CreateRequest) (*Track, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrNotFound
	}

	normalized, isPublished, err := normalizeTrackRequest(req)
	if err != nil {
		return nil, err
	}

	track, err := s.repo.Update(ctx, id, normalized, isPublished)
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

func (s *Service) Delete(ctx context.Context, id string) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return ErrNotFound
	}

	deleted, err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrNotFound
	}

	return nil
}

func (s *Service) UploadMedia(ctx context.Context, req UploadRequest) (*UploadResponse, error) {
	if s.storage == nil {
		return nil, storage.ErrNotConfigured
	}

	target, err := uploadTargetFromKind(req.Kind)
	if err != nil {
		return nil, err
	}

	result, err := s.storage.UploadObject(ctx, storage.UploadRequest{
		Target:      target,
		Path:        req.Path,
		ContentType: req.ContentType,
		Body:        req.Body,
		Upsert:      req.Upsert,
	})
	if err != nil {
		return nil, err
	}

	return &UploadResponse{
		Path:      result.Path,
		PublicURL: result.PublicURL,
	}, nil
}

func normalizeTrackRequest(req CreateRequest) (CreateRequest, bool, error) {
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
		return CreateRequest{}, false, ErrInvalidInput
	}

	isPublished := true
	if req.IsPublished != nil {
		isPublished = *req.IsPublished
	}

	return req, isPublished, nil
}

func uploadTargetFromKind(kind string) (storage.UploadTarget, error) {
	switch strings.ToLower(strings.TrimSpace(kind)) {
	case "audio":
		return storage.UploadTargetAudio, nil
	case "cover":
		return storage.UploadTargetCover, nil
	default:
		return "", ErrInvalidInput
	}
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
