package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type ApprovalPolicyRepo struct{}

func NewApprovalPolicyRepo() *ApprovalPolicyRepo { return &ApprovalPolicyRepo{} }

func (r *ApprovalPolicyRepo) Create(ctx context.Context, p *model.ApprovalPolicy) error {
	query := `
		INSERT INTO approval_policies (id, enterprise_id, policy_type, rules)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at
	`
	return db.Pool.QueryRow(ctx, query,
		p.ID, p.EnterpriseID, p.PolicyType, p.Rules,
	).Scan(&p.CreatedAt, &p.UpdatedAt)
}

func (r *ApprovalPolicyRepo) FindByID(ctx context.Context, id string) (*model.ApprovalPolicy, error) {
	query := `
		SELECT id, enterprise_id, policy_type, rules, created_at, updated_at
		FROM approval_policies WHERE id = $1
	`
	p := &model.ApprovalPolicy{}
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.EnterpriseID, &p.PolicyType, &p.Rules,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("approval policy not found")
	}
	return p, err
}

func (r *ApprovalPolicyRepo) FindByEnterpriseID(ctx context.Context, enterpriseID string) ([]model.ApprovalPolicy, error) {
	query := `
		SELECT id, enterprise_id, policy_type, rules, created_at, updated_at
		FROM approval_policies
		WHERE enterprise_id = $1
		ORDER BY created_at DESC
	`
	rows, err := db.Pool.Query(ctx, query, enterpriseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var policies []model.ApprovalPolicy
	for rows.Next() {
		var p model.ApprovalPolicy
		if err := rows.Scan(
			&p.ID, &p.EnterpriseID, &p.PolicyType, &p.Rules,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		policies = append(policies, p)
	}
	return policies, nil
}

func (r *ApprovalPolicyRepo) FindByEnterpriseAndType(ctx context.Context, enterpriseID, policyType string) (*model.ApprovalPolicy, error) {
	query := `
		SELECT id, enterprise_id, policy_type, rules, created_at, updated_at
		FROM approval_policies
		WHERE enterprise_id = $1 AND policy_type = $2
		ORDER BY created_at DESC
		LIMIT 1
	`
	p := &model.ApprovalPolicy{}
	err := db.Pool.QueryRow(ctx, query, enterpriseID, policyType).Scan(
		&p.ID, &p.EnterpriseID, &p.PolicyType, &p.Rules,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil // no policy configured — not an error
	}
	return p, err
}

func (r *ApprovalPolicyRepo) Update(ctx context.Context, p *model.ApprovalPolicy) error {
	query := `
		UPDATE approval_policies
		SET policy_type = $2, rules = $3, updated_at = $4
		WHERE id = $1
	`
	_, err := db.Pool.Exec(ctx, query, p.ID, p.PolicyType, p.Rules, time.Now())
	return err
}

func (r *ApprovalPolicyRepo) Delete(ctx context.Context, id string) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM approval_policies WHERE id = $1`, id)
	return err
}
