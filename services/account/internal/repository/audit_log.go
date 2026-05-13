package repository

import (
	"context"

	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type AuditLogRepo struct{}

func NewAuditLogRepo() *AuditLogRepo { return &AuditLogRepo{} }

func (r *AuditLogRepo) Create(ctx context.Context, log *model.AuditLog) error {
	query := `
		INSERT INTO audit_logs (id, enterprise_id, actor_id, action, resource_type, resource_id, details, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		log.ID, log.EnterpriseID, log.ActorID, log.Action,
		log.ResourceType, log.ResourceID, log.Details,
		log.IPAddress, log.UserAgent,
	).Scan(&log.CreatedAt)
}
