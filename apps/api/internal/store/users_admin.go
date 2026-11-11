package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type TenantUser struct {
	MembershipID string    `json:"membership_id"`
	UserID       string    `json:"user_id"`
	Email        string    `json:"email"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *Store) ListTenantUsers(ctx context.Context, tx pgx.Tx, tenantID string) ([]TenantUser, error) {
	rows, err := tx.Query(ctx, `select m.id, u.id, u.email, u.full_name, m.role, m.is_active, m.created_at
		from memberships m
		join users u on u.id = m.user_id
		where m.tenant_id = $1
		order by u.full_name`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TenantUser{}
	for rows.Next() {
		var u TenantUser
		if err := rows.Scan(&u.MembershipID, &u.UserID, &u.Email, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (s *Store) GetTenantUserByMembershipID(ctx context.Context, tx pgx.Tx, tenantID, membershipID string) (*TenantUser, error) {
	var u TenantUser
	err := tx.QueryRow(ctx, `select m.id, u.id, u.email, u.full_name, m.role, m.is_active, m.created_at
		from memberships m
		join users u on u.id = m.user_id
		where m.id = $1 and m.tenant_id = $2`, membershipID, tenantID).
		Scan(&u.MembershipID, &u.UserID, &u.Email, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) UpdateMembership(ctx context.Context, tx pgx.Tx, tenantID, membershipID, role string, active bool) error {
	_, err := tx.Exec(ctx, "update memberships set role = $3, is_active = $4 where id = $1 and tenant_id = $2",
		membershipID, tenantID, role, active)
	return err
}

func (s *Store) CountActiveOwners(ctx context.Context, tx pgx.Tx, tenantID string) (int, error) {
	var n int
	err := tx.QueryRow(ctx, "select count(*) from memberships where tenant_id = $1 and role = 'OWNER' and is_active = true", tenantID).Scan(&n)
	return n, err
}
