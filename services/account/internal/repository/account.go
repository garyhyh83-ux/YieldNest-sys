package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type AccountRepo struct{}

func NewAccountRepo() *AccountRepo { return &AccountRepo{} }

func (r *AccountRepo) Create(ctx context.Context, a *model.SmartAccount) error {
	query := `
		INSERT INTO smart_accounts (id, enterprise_id, chain_id, account_address,
			safe_version, owners, threshold, factory_salt)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		a.ID, a.EnterpriseID, a.ChainID, a.AccountAddress,
		a.SafeVersion, a.Owners, a.Threshold, a.FactorySalt,
	).Scan(&a.CreatedAt)
}

func (r *AccountRepo) FindByID(ctx context.Context, id string) (*model.SmartAccount, error) {
	query := `
		SELECT id, enterprise_id, chain_id, account_address, safe_version,
			   owners, threshold, factory_salt, deployed_at, created_at
		FROM smart_accounts WHERE id = $1
	`
	a := &model.SmartAccount{}
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.EnterpriseID, &a.ChainID, &a.AccountAddress,
		&a.SafeVersion, &a.Owners, &a.Threshold, &a.FactorySalt,
		&a.DeployedAt, &a.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("account not found")
	}
	return a, err
}

func (r *AccountRepo) FindByEnterpriseChain(ctx context.Context, enterpriseID string, chainID int) (*model.SmartAccount, error) {
	query := `
		SELECT id, enterprise_id, chain_id, account_address, safe_version,
			   owners, threshold, factory_salt, deployed_at, created_at
		FROM smart_accounts
		WHERE enterprise_id = $1 AND chain_id = $2
	`
	a := &model.SmartAccount{}
	err := db.Pool.QueryRow(ctx, query, enterpriseID, chainID).Scan(
		&a.ID, &a.EnterpriseID, &a.ChainID, &a.AccountAddress,
		&a.SafeVersion, &a.Owners, &a.Threshold, &a.FactorySalt,
		&a.DeployedAt, &a.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (r *AccountRepo) ListByEnterprise(ctx context.Context, enterpriseID string) ([]model.SmartAccount, error) {
	query := `
		SELECT id, enterprise_id, chain_id, account_address, safe_version,
			   owners, threshold, factory_salt, deployed_at, created_at
		FROM smart_accounts WHERE enterprise_id = $1
		ORDER BY chain_id
	`
	rows, err := db.Pool.Query(ctx, query, enterpriseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []model.SmartAccount
	for rows.Next() {
		var a model.SmartAccount
		if err := rows.Scan(
			&a.ID, &a.EnterpriseID, &a.ChainID, &a.AccountAddress,
			&a.SafeVersion, &a.Owners, &a.Threshold, &a.FactorySalt,
			&a.DeployedAt, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		accounts = append(accounts, a)
	}
	return accounts, nil
}

func (r *AccountRepo) UpdateOwners(ctx context.Context, id string, owners []byte, threshold int) error {
	query := `UPDATE smart_accounts SET owners = $2, threshold = $3 WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id, owners, threshold)
	return err
}
