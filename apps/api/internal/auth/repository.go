package auth

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	dbConn *pgxpool.Pool
}

func NewRepository(dbConn *pgxpool.Pool) *Repository {
	return &Repository{dbConn: dbConn}
}

func (r *Repository) CreateUser(
	ctx context.Context,
	name string,
	email string,
	hashedPassword string,
) (*User, error) {
	const query = `
		INSERT INTO users (name, email, password)
		VALUES ($1, $2, $3)
		RETURNING id, name, email, created_at, updated_at
	`

	var user User
	if err := r.dbConn.QueryRow(
		ctx,
		query,
		name,
		email,
		hashedPassword,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return &user, nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	const query = `
		SELECT id, name, email, password, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user User
	if err := r.dbConn.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}

	return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id string) (*User, error) {
	const query = `
		SELECT id, name, email, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user User
	if err := r.dbConn.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}

	return &user, nil
}

func (r *Repository) SaveRefreshToken(
	ctx context.Context,
	userID string,
	tokenHash string,
	expiresAt time.Time,
) error {
	const query = `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`

	if _, err := r.dbConn.Exec(ctx, query, userID, tokenHash, expiresAt); err != nil {
		return fmt.Errorf("save refresh token: %w", err)
	}

	return nil
}

func (r *Repository) GetRefreshToken(
	ctx context.Context,
	tokenHash string,
) (string, time.Time, *time.Time, error) {
	const query = `
		SELECT user_id, expires_at, revoked_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`

	var userID string
	var expiresAt time.Time
	var revokedAt sql.NullTime
	if err := r.dbConn.QueryRow(ctx, query, tokenHash).Scan(
		&userID,
		&expiresAt,
		&revokedAt,
	); err != nil {
		return "", time.Time{}, nil, fmt.Errorf("get refresh token: %w", err)
	}

	if revokedAt.Valid {
		return userID, expiresAt, &revokedAt.Time, nil
	}

	return userID, expiresAt, nil, nil
}

func (r *Repository) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	const query = `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE token_hash = $1
	`

	if _, err := r.dbConn.Exec(ctx, query, tokenHash); err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}

	return nil
}

func (r *Repository) RevokeAllUserTokens(ctx context.Context, userID string) error {
	const query = `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE user_id = $1
		  AND revoked_at IS NULL
	`

	if _, err := r.dbConn.Exec(ctx, query, userID); err != nil {
		return fmt.Errorf("revoke all user tokens: %w", err)
	}

	return nil
}
