package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type WhitelistRepo struct{}

func NewWhitelistRepo() *WhitelistRepo { return &WhitelistRepo{} }

func (r *WhitelistRepo) Create(ctx context.Context, w *model.WhitelistAddress) error {
	query := `
		INSERT INTO whitelist_addresses (id, enterprise_id, address, label, added_by, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		w.ID, w.EnterpriseID, w.Address, w.Label, w.AddedBy, w.Status,
	).Scan(&w.CreatedAt)
}

func (r *WhitelistRepo) ListByEnterprise(ctx context.Context, enterpriseID string) ([]model.WhitelistAddress, error) {
	query := `
		SELECT id, enterprise_id, address, label, added_by, status, created_at
		FROM whitelist_addresses WHERE enterprise_id = $1
		ORDER BY created_at DESC
	`
	rows, err := db.Pool.Query(ctx, query, enterpriseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addresses []model.WhitelistAddress
	for rows.Next() {
		var w model.WhitelistAddress
		if err := rows.Scan(
			&w.ID, &w.EnterpriseID, &w.Address, &w.Label,
			&w.AddedBy, &w.Status, &w.CreatedAt,
		); err != nil {
			return nil, err
		}
		addresses = append(addresses, w)
	}
	return addresses, nil
}

func (r *WhitelistRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM whitelist_addresses WHERE id = $1`
	result, err := db.Pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *WhitelistRepo) UpdateStatus(ctx context.Context, id, status string) error {
	query := `UPDATE whitelist_addresses SET status = $2 WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id, status, time.Now())
	return err
}
