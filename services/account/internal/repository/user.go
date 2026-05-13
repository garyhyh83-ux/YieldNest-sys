package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/model"
)

type UserRepo struct{}

func NewUserRepo() *UserRepo { return &UserRepo{} }

func (r *UserRepo) Create(ctx context.Context, u *model.User) error {
	query := `
		INSERT INTO users (id, enterprise_id, email, display_name, role, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`
	return db.Pool.QueryRow(ctx, query,
		u.ID, u.EnterpriseID, u.Email, u.DisplayName, u.Role, u.Status,
	).Scan(&u.CreatedAt, &u.UpdatedAt)
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT id, enterprise_id, email, display_name, role, auth_factors, status,
			   last_login_at, created_at, updated_at
		FROM users WHERE id = $1
	`
	u := &model.User{}
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.EnterpriseID, &u.Email, &u.DisplayName, &u.Role,
		&u.AuthFactors, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, enterprise_id, email, display_name, role, auth_factors, status,
			   last_login_at, created_at, updated_at
		FROM users WHERE email = $1
	`
	u := &model.User{}
	err := db.Pool.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.EnterpriseID, &u.Email, &u.DisplayName, &u.Role,
		&u.AuthFactors, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepo) ListByEnterprise(ctx context.Context, enterpriseID string) ([]model.User, error) {
	query := `
		SELECT id, enterprise_id, email, display_name, role, auth_factors, status,
			   last_login_at, created_at, updated_at
		FROM users WHERE enterprise_id = $1
		ORDER BY created_at ASC
	`
	rows, err := db.Pool.Query(ctx, query, enterpriseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(
			&u.ID, &u.EnterpriseID, &u.Email, &u.DisplayName, &u.Role,
			&u.AuthFactors, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepo) UpdateRole(ctx context.Context, id, role string) error {
	query := `UPDATE users SET role = $2, updated_at = $3 WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id, role, time.Now())
	return err
}

func (r *UserRepo) SoftDelete(ctx context.Context, id string) error {
	query := `UPDATE users SET status = 'deleted', updated_at = $2 WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id, time.Now())
	return err
}
