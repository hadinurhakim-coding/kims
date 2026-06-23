package favorites

import (
	"context"
	"errors"
)

var ErrAlreadyFavorited = errors.New("track already favorited")
var ErrNotFavorited = errors.New("track not in favorites")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, userID string) (*ListResponse, error) {
	items, err := s.repo.List(ctx, userID)
	if err != nil {
		return nil, err
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
