package history

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("history entry not found")
var ErrInvalidInput = errors.New("invalid history input")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
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
