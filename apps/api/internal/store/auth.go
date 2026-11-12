package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) GetUserByEmail(ctx context.Context, tx pgx.Tx, email string) (*User, error) {
	var u User
	err := tx.QueryRow(ctx, `select id, email, password_hash, full_name, is_platform_admin, is_active
		from users where email = $1`, email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.IsPlatformAdmin, &u.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) GetUserByID(ctx context.Context, tx pgx.Tx, id string) (*User, error) {
	var u User
	err := tx.QueryRow(ctx, `select id, email, password_hash, full_name, is_platform_admin, is_active
		from users where id = $1`, id).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.IsPlatformAdmin, &u.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) CreateUser(ctx context.Context, tx pgx.Tx, email, passwordHash, fullName string, platformAdmin bool) (*User, error) {
	var u User
	err := tx.QueryRow(ctx, `insert into users (email, password_hash, full_name, is_platform_admin)
		values ($1, $2, $3, $4)
		returning id, email, full_name, is_platform_admin, is_active`,
		email, passwordHash, fullName, platformAdmin).
		Scan(&u.ID, &u.Email, &u.FullName, &u.IsPlatformAdmin, &u.IsActive)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) TouchLastLogin(ctx context.Context, tx pgx.Tx, userID string) error {
	_, err := tx.Exec(ctx, "update users set last_login_at = now() where id = $1", userID)
	return err
}

func (s *Store) CreateMembership(ctx context.Context, tx pgx.Tx, tenantID, userID, role string) (*Membership, error) {
	var m Membership
	err := tx.QueryRow(ctx, `insert into memberships (tenant_id, user_id, role)
		values ($1, $2, $3)
		returning id, tenant_id, user_id, role`,
		tenantID, userID, role).
		Scan(&m.ID, &m.TenantID, &m.UserID, &m.Role)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *Store) ListMembershipsForUser(ctx context.Context, tx pgx.Tx, userID string) ([]Membership, error) {
	rows, err := tx.Query(ctx, `select m.id, m.tenant_id, m.user_id, m.role, t.name, t.subdomain, t.status
		from memberships m
		join tenants t on t.id = m.tenant_id
		where m.user_id = $1 and m.is_active = true and t.status <> 'CANCELED'
		order by m.created_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Membership{}
	for rows.Next() {
		var m Membership
		if err := rows.Scan(&m.ID, &m.TenantID, &m.UserID, &m.Role, &m.TenantName, &m.Subdomain, &m.TenantStatus); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) GetMembership(ctx context.Context, tx pgx.Tx, userID, tenantID string) (*Membership, error) {
	var m Membership
	err := tx.QueryRow(ctx, `select m.id, m.tenant_id, m.user_id, m.role, t.name, t.subdomain, t.status
		from memberships m
		join tenants t on t.id = m.tenant_id
		where m.user_id = $1 and m.tenant_id = $2 and m.is_active = true`, userID, tenantID).
		Scan(&m.ID, &m.TenantID, &m.UserID, &m.Role, &m.TenantName, &m.Subdomain, &m.TenantStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *Store) CountPlatformAdmins(ctx context.Context, tx pgx.Tx) (int, error) {
	var n int
	err := tx.QueryRow(ctx, "select count(*) from users where is_platform_admin = true").Scan(&n)
	return n, err
}

func (s *Store) EnsurePlatformAdmin(ctx context.Context, tx pgx.Tx, email, passwordHash, fullName string) error {
	_, err := tx.Exec(ctx, `insert into users (email, password_hash, full_name, is_platform_admin)
		values ($1, $2, $3, true)
		on conflict (email) do update set is_platform_admin = true, is_active = true`,
		email, passwordHash, fullName)
	return err
}

func (s *Store) CreateSession(ctx context.Context, tx pgx.Tx, userID, tenantID, tokenHash, userAgent, ip string, expiresAt time.Time) error {
	_, err := tx.Exec(ctx, `insert into sessions (user_id, tenant_id, token_hash, user_agent, ip, expires_at)
		values ($1, nullif($2, '')::uuid, $3, nullif($4, ''), nullif($5, '')::inet, $6)`,
		userID, tenantID, tokenHash, userAgent, ip, expiresAt)
	return err
}

func (s *Store) GetSessionByHash(ctx context.Context, tx pgx.Tx, tokenHash string) (userID, tenantID string, expiresAt time.Time, revoked bool, err error) {
	var tenant *string
	err = tx.QueryRow(ctx, `select user_id, tenant_id::text, expires_at, revoked_at is not null
		from sessions where token_hash = $1`, tokenHash).
		Scan(&userID, &tenant, &expiresAt, &revoked)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", time.Time{}, false, ErrNotFound
	}
	if tenant != nil {
		tenantID = *tenant
	}
	return userID, tenantID, expiresAt, revoked, err
}

func (s *Store) DeleteSessionByHash(ctx context.Context, tx pgx.Tx, tokenHash string) error {
	_, err := tx.Exec(ctx, "delete from sessions where token_hash = $1", tokenHash)
	return err
}

func (s *Store) RevokeTenantSessions(ctx context.Context, tx pgx.Tx, tenantID string) error {
	_, err := tx.Exec(ctx, "update sessions set revoked_at = now() where tenant_id = $1 and revoked_at is null", tenantID)
	return err
}
