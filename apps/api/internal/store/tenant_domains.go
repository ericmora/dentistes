package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type TenantDomain struct {
	ID            string     `json:"id"`
	TenantID      string     `json:"tenant_id"`
	Hostname      string     `json:"hostname"`
	IsPrimary     bool       `json:"is_primary"`
	TLSSecretName string     `json:"tls_secret_name"`
	Status        string     `json:"status"`
	LastError     *string    `json:"last_error,omitempty"`
	Attempts      int        `json:"attempts"`
	NextAttemptAt *time.Time `json:"next_attempt_at,omitempty"`
	ProvisionedAt *time.Time `json:"provisioned_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type PublicTenant struct {
	TenantID     string `json:"tenant_id"`
	Name         string `json:"name"`
	Subdomain    string `json:"subdomain"`
	TenantStatus string `json:"tenant_status"`
	Hostname     string `json:"hostname"`
	DomainStatus string `json:"domain_status"`
}

func (s *Store) CreateTenantDomain(ctx context.Context, tx pgx.Tx, tenantID, hostname, tlsSecret string) (*TenantDomain, error) {
	var d TenantDomain
	err := tx.QueryRow(ctx, `insert into tenant_domains (tenant_id, hostname, tls_secret_name)
		values ($1, $2, $3)
		returning id, tenant_id, hostname, is_primary, tls_secret_name, status, attempts, created_at`,
		tenantID, hostname, tlsSecret).
		Scan(&d.ID, &d.TenantID, &d.Hostname, &d.IsPrimary, &d.TLSSecretName, &d.Status, &d.Attempts, &d.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (s *Store) ListTenantDomains(ctx context.Context, tx pgx.Tx, tenantID string) ([]TenantDomain, error) {
	rows, err := tx.Query(ctx, `select id, tenant_id, hostname, is_primary, tls_secret_name, status, last_error, attempts, next_attempt_at, provisioned_at, created_at
		from tenant_domains where tenant_id = $1 order by is_primary desc, created_at`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TenantDomain{}
	for rows.Next() {
		var d TenantDomain
		if err := rows.Scan(&d.ID, &d.TenantID, &d.Hostname, &d.IsPrimary, &d.TLSSecretName, &d.Status, &d.LastError, &d.Attempts, &d.NextAttemptAt, &d.ProvisionedAt, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) ClaimPendingTenantDomains(ctx context.Context, tx pgx.Tx, limit int) ([]TenantDomain, error) {
	rows, err := tx.Query(ctx, `with candidates as (
			select d.id
			from tenant_domains d
			join tenants t on t.id = d.tenant_id
			where d.status in ('PENDING', 'FAILED')
			  and (d.next_attempt_at is null or d.next_attempt_at <= now())
			  and t.status <> 'CANCELED'
			order by d.created_at
			limit $1
			for update of d skip locked
		)
		update tenant_domains d
		set status = 'PROVISIONING', attempts = d.attempts + 1, updated_at = now()
		from candidates c
		where d.id = c.id
		returning d.id, d.tenant_id, d.hostname, d.is_primary, d.tls_secret_name, d.status, d.attempts, d.created_at`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TenantDomain{}
	for rows.Next() {
		var d TenantDomain
		if err := rows.Scan(&d.ID, &d.TenantID, &d.Hostname, &d.IsPrimary, &d.TLSSecretName, &d.Status, &d.Attempts, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) MarkTenantDomainReady(ctx context.Context, tx pgx.Tx, id string) error {
	_, err := tx.Exec(ctx, "update tenant_domains set status = 'READY', last_error = null, provisioned_at = now(), next_attempt_at = null where id = $1", id)
	return err
}

func (s *Store) MarkTenantDomainFailed(ctx context.Context, tx pgx.Tx, id, lastError string) error {
	_, err := tx.Exec(ctx, `update tenant_domains
		set status = 'FAILED', last_error = $2, next_attempt_at = now() + (least(attempts, 20) * interval '30 seconds')
		where id = $1`, id, lastError)
	return err
}

func (s *Store) ResetTenantDomainProvisioning(ctx context.Context, tx pgx.Tx, tenantID string) error {
	_, err := tx.Exec(ctx, `update tenant_domains
		set status = 'PENDING', attempts = 0, next_attempt_at = null, last_error = null
		where tenant_id = $1 and status <> 'DISABLED'`, tenantID)
	return err
}

func (s *Store) GetPublicTenantByHostname(ctx context.Context, tx pgx.Tx, hostname string) (*PublicTenant, error) {
	var t PublicTenant
	err := tx.QueryRow(ctx, `select t.id, t.name, t.subdomain, t.status, d.hostname, d.status
		from tenant_domains d
		join tenants t on t.id = d.tenant_id
		where d.hostname = $1`, hostname).
		Scan(&t.TenantID, &t.Name, &t.Subdomain, &t.TenantStatus, &t.Hostname, &t.DomainStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) CreateDefaultCabinet(ctx context.Context, tx pgx.Tx, tenantID, name string) error {
	_, err := tx.Exec(ctx, `insert into cabinets (tenant_id, name, color_code) values ($1, $2, '#0D9488')`, tenantID, name)
	return err
}

func (s *Store) UpdateTenantConfig(ctx context.Context, tx pgx.Tx, tenantID, configJSON string) error {
	_, err := tx.Exec(ctx, "update tenants set config = $2::jsonb where id = $1", tenantID, configJSON)
	return err
}
