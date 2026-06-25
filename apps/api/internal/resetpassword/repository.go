package resetpassword

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

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (string, string, error) {
	const query = `
		SELECT id, name
		FROM users
		WHERE email = $1
	`

	var userID string
	var name string
	if err := r.dbConn.QueryRow(ctx, query, email).Scan(&userID, &name); err != nil {
		return "", "", fmt.Errorf("get user by email: %w", err)
	}

	return userID, name, nil
}

func (r *Repository) CreateOTP(
	ctx context.Context,
	userID string,
	otpHash string,
	expiresAt time.Time,
) error {
	tx, err := r.dbConn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin create otp: %w", err)
	}
	defer tx.Rollback(ctx)

	const invalidateQuery = `
		UPDATE password_resets
		SET used_at = NOW()
		WHERE user_id = $1
		  AND used_at IS NULL
	`
	if _, err := tx.Exec(ctx, invalidateQuery, userID); err != nil {
		return fmt.Errorf("invalidate existing otps: %w", err)
	}

	const insertQuery = `
		INSERT INTO password_resets (user_id, otp_hash, expires_at)
		VALUES ($1, $2, $3)
	`
	if _, err := tx.Exec(ctx, insertQuery, userID, otpHash, expiresAt); err != nil {
		return fmt.Errorf("insert otp: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit create otp: %w", err)
	}

	return nil
}

func (r *Repository) GetValidOTP(ctx context.Context, otpHash string) (*PasswordReset, error) {
	const query = `
		SELECT id, user_id, otp_hash, expires_at, used_at, created_at
		FROM password_resets
		WHERE otp_hash = $1
		  AND used_at IS NULL
		  AND expires_at > NOW()
	`

	var reset PasswordReset
	var usedAt sql.NullTime
	if err := r.dbConn.QueryRow(ctx, query, otpHash).Scan(
		&reset.ID,
		&reset.UserID,
		&reset.OTPHash,
		&reset.ExpiresAt,
		&usedAt,
		&reset.CreatedAt,
	); err != nil {
		return nil, fmt.Errorf("get valid otp: %w", err)
	}

	if usedAt.Valid {
		reset.UsedAt = &usedAt.Time
	}

	return &reset, nil
}

func (r *Repository) MarkOTPUsed(ctx context.Context, id string) error {
	const query = `
		UPDATE password_resets
		SET used_at = NOW()
		WHERE id = $1
	`

	if _, err := r.dbConn.Exec(ctx, query, id); err != nil {
		return fmt.Errorf("mark otp used: %w", err)
	}

	return nil
}

func (r *Repository) GetPasswordHash(ctx context.Context, userID string) (string, error) {
	const query = `
		SELECT password
		FROM users
		WHERE id = $1
	`

	var passwordHash string
	if err := r.dbConn.QueryRow(ctx, query, userID).Scan(&passwordHash); err != nil {
		return "", fmt.Errorf("get password hash: %w", err)
	}

	return passwordHash, nil
}

func (r *Repository) UpdatePassword(ctx context.Context, userID string, hashedPassword string) error {
	const query = `
		UPDATE users
		SET password = $1,
		    updated_at = NOW()
		WHERE id = $2
	`

	if _, err := r.dbConn.Exec(ctx, query, hashedPassword, userID); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	return nil
}
