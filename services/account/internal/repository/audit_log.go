package repository

import (
	"context"
	"fmt"
	"time"

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

// AuditLogFilter provides optional filters for querying audit logs.
type AuditLogFilter struct {
	EnterpriseID string
	Action       string
	ResourceType string
	ResourceID   string
	ActorID      string
	DateFrom     *time.Time
	DateTo       *time.Time
	Limit        int
	Offset       int
}

func (r *AuditLogRepo) List(ctx context.Context, filter AuditLogFilter) ([]model.AuditLog, error) {
	query := `
		SELECT id, enterprise_id, actor_id, action, resource_type, resource_id,
			details, ip_address, user_agent, created_at
		FROM audit_logs
		WHERE enterprise_id = $1
	`
	args := []interface{}{filter.EnterpriseID}
	argIdx := 2

	if filter.Action != "" {
		query += fmt.Sprintf(" AND action = $%d", argIdx)
		args = append(args, filter.Action)
		argIdx++
	}
	if filter.ResourceType != "" {
		query += fmt.Sprintf(" AND resource_type = $%d", argIdx)
		args = append(args, filter.ResourceType)
		argIdx++
	}
	if filter.ResourceID != "" {
		query += fmt.Sprintf(" AND resource_id = $%d", argIdx)
		args = append(args, filter.ResourceID)
		argIdx++
	}
	if filter.ActorID != "" {
		query += fmt.Sprintf(" AND actor_id = $%d", argIdx)
		args = append(args, filter.ActorID)
		argIdx++
	}
	if filter.DateFrom != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		args = append(args, *filter.DateFrom)
		argIdx++
	}
	if filter.DateTo != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		args = append(args, *filter.DateTo)
		argIdx++
	}

	query += " ORDER BY created_at DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIdx)
		args = append(args, filter.Limit)
		argIdx++
		query += fmt.Sprintf(" OFFSET $%d", argIdx)
		args = append(args, filter.Offset)
	}

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []model.AuditLog
	for rows.Next() {
		var l model.AuditLog
		if err := rows.Scan(
			&l.ID, &l.EnterpriseID, &l.ActorID, &l.Action,
			&l.ResourceType, &l.ResourceID, &l.Details,
			&l.IPAddress, &l.UserAgent, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func (r *AuditLogRepo) Count(ctx context.Context, filter AuditLogFilter) (int, error) {
	query := `SELECT COUNT(*) FROM audit_logs WHERE enterprise_id = $1`
	args := []interface{}{filter.EnterpriseID}
	argIdx := 2

	if filter.Action != "" {
		query += fmt.Sprintf(" AND action = $%d", argIdx)
		args = append(args, filter.Action)
		argIdx++
	}
	if filter.ResourceType != "" {
		query += fmt.Sprintf(" AND resource_type = $%d", argIdx)
		args = append(args, filter.ResourceType)
		argIdx++
	}
	if filter.DateFrom != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		args = append(args, *filter.DateFrom)
		argIdx++
	}
	if filter.DateTo != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		args = append(args, *filter.DateTo)
		argIdx++
	}

	var count int
	err := db.Pool.QueryRow(ctx, query, args...).Scan(&count)
	return count, err
}

// GetActionStats returns counts of audit actions grouped by action type.
func (r *AuditLogRepo) GetActionStats(ctx context.Context, enterpriseID string, from, to time.Time) (map[string]int, error) {
	query := `
		SELECT action, COUNT(*) as cnt
		FROM audit_logs
		WHERE enterprise_id = $1 AND created_at >= $2 AND created_at <= $3
		GROUP BY action
		ORDER BY cnt DESC
	`
	rows, err := db.Pool.Query(ctx, query, enterpriseID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var action string
		var count int
		if err := rows.Scan(&action, &count); err != nil {
			return nil, err
		}
		stats[action] = count
	}
	return stats, nil
}

