package audit

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	dbConn *pgxpool.Pool
}

func NewRepository(dbConn *pgxpool.Pool) *Repository {
	return &Repository{dbConn: dbConn}
}

func (r *Repository) Record(ctx context.Context, req RecordRequest) error {
	if r == nil || r.dbConn == nil {
		return nil
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("marshal audit metadata: %w", err)
	}

	query := `
		INSERT INTO admin_audit_logs (
			actor_user_id,
			action,
			resource_type,
			resource_id,
			metadata
		) VALUES ($1, $2, $3, $4, $5)
	`
	if _, err := r.dbConn.Exec(
		ctx,
		query,
		nullableString(req.ActorUserID),
		req.Action,
		req.ResourceType,
		nullableString(req.ResourceID),
		metadataJSON,
	); err != nil {
		return fmt.Errorf("record admin audit log: %w", err)
	}

	return nil
}

func nullableString(value string) any {
	if value == "" {
		return nil
	}

	return value
}
