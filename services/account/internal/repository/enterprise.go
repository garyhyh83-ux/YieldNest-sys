package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type EnterpriseRepo struct{}

func NewEnterpriseRepo() *EnterpriseRepo { return &EnterpriseRepo{} }

func (r *EnterpriseRepo) Create(ctx context.Context, e *model.Enterprise) error {
	query := `
		INSERT INTO enterprises (id, legal_name, registration_number, country, entity_type, kyb_status, risk_score)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at
	`
	return db.Pool.QueryRow(ctx, query,
		e.ID, e.LegalName, e.RegistrationNumber, e.Country,
		e.EntityType, e.KYBStatus, e.RiskScore,
	).Scan(&e.CreatedAt, &e.UpdatedAt)
}

func (r *EnterpriseRepo) FindByID(ctx context.Context, id string) (*model.Enterprise, error) {
	query := `
		SELECT id, legal_name, registration_number, country, entity_type,
			   kyb_status, kyb_provider_ref, risk_score, created_at, updated_at
		FROM enterprises WHERE id = $1
	`
	e := &model.Enterprise{}
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&e.ID, &e.LegalName, &e.RegistrationNumber, &e.Country,
		&e.EntityType, &e.KYBStatus, &e.KYBProviderRef, &e.RiskScore,
		&e.CreatedAt, &e.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("enterprise not found")
	}
	return e, err
}

func (r *EnterpriseRepo) List(ctx context.Context, limit, offset int) ([]model.Enterprise, error) {
	query := `
		SELECT id, legal_name, registration_number, country, entity_type,
			   kyb_status, kyb_provider_ref, risk_score, created_at, updated_at
		FROM enterprises
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := db.Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enterprises []model.Enterprise
	for rows.Next() {
		var e model.Enterprise
		if err := rows.Scan(
			&e.ID, &e.LegalName, &e.RegistrationNumber, &e.Country,
			&e.EntityType, &e.KYBStatus, &e.KYBProviderRef, &e.RiskScore,
			&e.CreatedAt, &e.UpdatedAt,
		); err != nil {
			return nil, err
		}
		enterprises = append(enterprises, e)
	}
	return enterprises, nil
}

func (r *EnterpriseRepo) Update(ctx context.Context, e *model.Enterprise) error {
	query := `
		UPDATE enterprises
		SET legal_name = $2, registration_number = $3, country = $4,
			entity_type = $5, risk_score = $6, updated_at = $7
		WHERE id = $1
	`
	_, err := db.Pool.Exec(ctx, query,
		e.ID, e.LegalName, e.RegistrationNumber, e.Country,
		e.EntityType, e.RiskScore, time.Now(),
	)
	return err
}

func (r *EnterpriseRepo) UpdateKYBStatus(ctx context.Context, id, status, providerRef string) error {
	query := `
		UPDATE enterprises
		SET kyb_status = $2, kyb_provider_ref = $3, updated_at = $4
		WHERE id = $1
	`
	_, err := db.Pool.Exec(ctx, query, id, status, providerRef, time.Now())
	return err
}
