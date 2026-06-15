package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type ApprovalRepo struct{}

func NewApprovalRepo() *ApprovalRepo { return &ApprovalRepo{} }

func (r *ApprovalRepo) Create(ctx context.Context, a *model.Approval) error {
	query := `
		INSERT INTO approvals (id, enterprise_id, approval_type, requested_by, status,
			required_quorum, current_quorum, payload, idempotency_key, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		a.ID, a.EnterpriseID, a.ApprovalType, a.RequestedBy, a.Status,
		a.RequiredQuorum, a.CurrentQuorum, a.Payload, a.IdempotencyKey, a.ExpiresAt,
	).Scan(&a.CreatedAt)
}

func (r *ApprovalRepo) FindByID(ctx context.Context, id string) (*model.Approval, error) {
	query := `
		SELECT id, enterprise_id, approval_type, requested_by, status,
			required_quorum, current_quorum, payload, idempotency_key,
			expires_at, resolved_at, created_at
		FROM approvals WHERE id = $1
	`
	a := &model.Approval{}
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.EnterpriseID, &a.ApprovalType, &a.RequestedBy, &a.Status,
		&a.RequiredQuorum, &a.CurrentQuorum, &a.Payload, &a.IdempotencyKey,
		&a.ExpiresAt, &a.ResolvedAt, &a.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("approval not found")
	}
	return a, err
}

func (r *ApprovalRepo) FindByIDWithVotes(ctx context.Context, id string) (*model.Approval, []model.ApprovalVote, error) {
	a, err := r.FindByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	votes, err := r.GetVotes(ctx, id)
	if err != nil {
		return a, nil, err
	}
	return a, votes, nil
}

type ApprovalFilter struct {
	EnterpriseID string
	Status       string
	ApprovalType string
	Limit        int
	Offset       int
}

func (r *ApprovalRepo) FindByEnterpriseID(ctx context.Context, filter ApprovalFilter) ([]model.Approval, error) {
	query := `
		SELECT id, enterprise_id, approval_type, requested_by, status,
			required_quorum, current_quorum, payload, idempotency_key,
			expires_at, resolved_at, created_at
		FROM approvals
		WHERE enterprise_id = $1
	`
	args := []interface{}{filter.EnterpriseID}
	argIdx := 2

	if filter.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.ApprovalType != "" {
		query += fmt.Sprintf(" AND approval_type = $%d", argIdx)
		args = append(args, filter.ApprovalType)
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

	var approvals []model.Approval
	for rows.Next() {
		var a model.Approval
		if err := rows.Scan(
			&a.ID, &a.EnterpriseID, &a.ApprovalType, &a.RequestedBy, &a.Status,
			&a.RequiredQuorum, &a.CurrentQuorum, &a.Payload, &a.IdempotencyKey,
			&a.ExpiresAt, &a.ResolvedAt, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		approvals = append(approvals, a)
	}
	return approvals, nil
}

func (r *ApprovalRepo) CountByEnterpriseID(ctx context.Context, filter ApprovalFilter) (int, error) {
	query := `SELECT COUNT(*) FROM approvals WHERE enterprise_id = $1`
	args := []interface{}{filter.EnterpriseID}
	argIdx := 2

	if filter.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.ApprovalType != "" {
		query += fmt.Sprintf(" AND approval_type = $%d", argIdx)
		args = append(args, filter.ApprovalType)
		argIdx++
	}

	var count int
	err := db.Pool.QueryRow(ctx, query, args...).Scan(&count)
	return count, err
}

// FindPendingForApprover returns approvals where the given user is an eligible approver
// based on the policy rules embedded in the approval's payload, and has not yet voted.
func (r *ApprovalRepo) FindPendingForApprover(ctx context.Context, enterpriseID, voterID, userRole string, limit, offset int) ([]model.Approval, error) {
	// Get all pending/in_progress approvals for the enterprise, then filter in application layer
	// This is simpler than embedding role-checking logic in SQL
	query := `
		SELECT a.id, a.enterprise_id, a.approval_type, a.requested_by, a.status,
			a.required_quorum, a.current_quorum, a.payload, a.idempotency_key,
			a.expires_at, a.resolved_at, a.created_at
		FROM approvals a
		WHERE a.enterprise_id = $1
		AND a.status IN ('pending', 'in_progress')
		AND NOT EXISTS (
			SELECT 1 FROM approval_votes v
			WHERE v.approval_id = a.id AND v.voter_id = $2
		)
		ORDER BY a.created_at DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := db.Pool.Query(ctx, query, enterpriseID, voterID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var approvals []model.Approval
	for rows.Next() {
		var a model.Approval
		if err := rows.Scan(
			&a.ID, &a.EnterpriseID, &a.ApprovalType, &a.RequestedBy, &a.Status,
			&a.RequiredQuorum, &a.CurrentQuorum, &a.Payload, &a.IdempotencyKey,
			&a.ExpiresAt, &a.ResolvedAt, &a.CreatedAt,
		); err != nil {
			return nil, err
		}

		// Check if the user's role is in the eligible approvers list
		// This is stored in the payload under "eligibleApprovers"
		var payload map[string]interface{}
		if err := json.Unmarshal(a.Payload, &payload); err == nil {
			if approvers, ok := payload["eligibleApprovers"].([]interface{}); ok {
				roleKey := "role:" + userRole
				for _, approver := range approvers {
					if s, ok := approver.(string); ok && s == roleKey {
						approvals = append(approvals, a)
						break
					}
				}
			}
		}
	}
	return approvals, nil
}

func (r *ApprovalRepo) UpdateStatus(ctx context.Context, id, status string, resolvedAt *time.Time) error {
	query := `
		UPDATE approvals
		SET status = $2, resolved_at = $3
		WHERE id = $1
	`
	_, err := db.Pool.Exec(ctx, query, id, status, resolvedAt)
	return err
}

func (r *ApprovalRepo) UpdateQuorum(ctx context.Context, id string, quorum int, resolvedAt *time.Time) error {
	query := `
		UPDATE approvals
		SET current_quorum = $2, status = CASE WHEN $2 >= required_quorum THEN 'approved' ELSE 'in_progress' END, resolved_at = $3
		WHERE id = $1
	`
	_, err := db.Pool.Exec(ctx, query, id, quorum, resolvedAt)
	return err
}

func (r *ApprovalRepo) AddVote(ctx context.Context, v *model.ApprovalVote) error {
	query := `
		INSERT INTO approval_votes (id, approval_id, voter_id, vote, comment)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		v.ID, v.ApprovalID, v.VoterID, v.Vote, v.Comment,
	).Scan(&v.CreatedAt)
}

func (r *ApprovalRepo) GetVotes(ctx context.Context, approvalID string) ([]model.ApprovalVote, error) {
	query := `
		SELECT id, approval_id, voter_id, vote, comment, created_at
		FROM approval_votes
		WHERE approval_id = $1
		ORDER BY created_at ASC
	`
	rows, err := db.Pool.Query(ctx, query, approvalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var votes []model.ApprovalVote
	for rows.Next() {
		var v model.ApprovalVote
		if err := rows.Scan(
			&v.ID, &v.ApprovalID, &v.VoterID, &v.Vote, &v.Comment, &v.CreatedAt,
		); err != nil {
			return nil, err
		}
		votes = append(votes, v)
	}
	return votes, nil
}

func (r *ApprovalRepo) HasVoted(ctx context.Context, approvalID, voterID string) (bool, error) {
	var count int
	err := db.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM approval_votes WHERE approval_id = $1 AND voter_id = $2`,
		approvalID, voterID,
	).Scan(&count)
	return count > 0, err
}

func (r *ApprovalRepo) FindExpiredPending(ctx context.Context) ([]model.Approval, error) {
	query := `
		SELECT id, enterprise_id, approval_type, requested_by, status,
			required_quorum, current_quorum, payload, idempotency_key,
			expires_at, resolved_at, created_at
		FROM approvals
		WHERE status IN ('pending', 'in_progress')
		AND expires_at IS NOT NULL
		AND expires_at < $1
	`
	now := time.Now()
	rows, err := db.Pool.Query(ctx, query, now)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var approvals []model.Approval
	for rows.Next() {
		var a model.Approval
		if err := rows.Scan(
			&a.ID, &a.EnterpriseID, &a.ApprovalType, &a.RequestedBy, &a.Status,
			&a.RequiredQuorum, &a.CurrentQuorum, &a.Payload, &a.IdempotencyKey,
			&a.ExpiresAt, &a.ResolvedAt, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		approvals = append(approvals, a)
	}
	return approvals, nil
}
