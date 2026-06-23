package tracks

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("track not found")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
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

	return track, nil
}
