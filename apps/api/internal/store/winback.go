package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type CancellationEmailTemplate struct {
	ID                string    `json:"id"`
	StepDay           int       `json:"step_day"`
	Name              string    `json:"name"`
	Subject           string    `json:"subject"`
	PreviewText       string    `json:"preview_text"`
	BodyHTML          string    `json:"body_html"`
	BodyText          string    `json:"body_text"`
	HasFreeMonthOffer bool      `json:"has_free_month_offer"`
	IsActive          bool      `json:"is_active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type CancellationEmailLog struct {
	ID             string     `json:"id"`
	TenantID       string     `json:"tenant_id"`
	RecipientEmail string     `json:"recipient_email"`
	RecipientName  string     `json:"recipient_name"`
	ClinicName     string     `json:"clinic_name"`
	StepDay        int        `json:"step_day"`
	Subject        string     `json:"subject"`
	TrackingToken  string     `json:"tracking_token"`
	SentAt         time.Time  `json:"sent_at"`
	OpenedAt       *time.Time `json:"opened_at,omitempty"`
	OpenCount      int        `json:"open_count"`
	LastOpenedAt   *time.Time `json:"last_opened_at,omitempty"`
	ClickedAt      *time.Time `json:"clicked_at,omitempty"`
	ClickCount     int        `json:"click_count"`
	ReactivatedAt  *time.Time `json:"reactivated_at,omitempty"`
	UserAgent      *string    `json:"user_agent,omitempty"`
	IPAddress      *string    `json:"ip_address,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type WinbackMetrics struct {
	TotalCanceledClinics    int     `json:"total_canceled_clinics"`
	ActiveInCustody         int     `json:"active_in_custody"`
	TotalEmailsSent         int     `json:"total_emails_sent"`
	TotalEmailsOpened       int     `json:"total_emails_opened"`
	OpenRatePercent         float64 `json:"open_rate_percent"`
	TotalClicks             int     `json:"total_clicks"`
	ClickRatePercent        float64 `json:"click_rate_percent"`
	TotalReactivations      int     `json:"total_reactivations"`
	ReactivationRatePercent float64 `json:"reactivation_rate_percent"`
}

func GenerateTrackingToken() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *Store) RecordTenantCancellation(ctx context.Context, tx pgx.Tx, tenantID string) error {
	now := time.Now().UTC()
	reactivationDeadline := now.Add(30 * 24 * time.Hour)
	purgeScheduled := now.Add(90 * 24 * time.Hour)

	_, err := tx.Exec(ctx, `
		update tenants
		set status = 'CANCELED',
		    canceled_at = $2,
		    reactivation_deadline_at = $3,
		    purge_scheduled_at = $4,
		    updated_at = now()
		where id = $1::uuid`,
		tenantID, now, reactivationDeadline, purgeScheduled)
	return err
}

func (s *Store) ListCancellationTemplates(ctx context.Context, tx pgx.Tx) ([]CancellationEmailTemplate, error) {
	rows, err := tx.Query(ctx, `
		select id, step_day, name, subject, coalesce(preview_text, ''), body_html, body_text, has_free_month_offer, is_active, created_at, updated_at
		from cancellation_email_templates
		order by step_day asc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CancellationEmailTemplate
	for rows.Next() {
		var t CancellationEmailTemplate
		if err := rows.Scan(&t.ID, &t.StepDay, &t.Name, &t.Subject, &t.PreviewText, &t.BodyHTML, &t.BodyText, &t.HasFreeMonthOffer, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) GetCancellationTemplateByStep(ctx context.Context, tx pgx.Tx, stepDay int) (*CancellationEmailTemplate, error) {
	var t CancellationEmailTemplate
	err := tx.QueryRow(ctx, `
		select id, step_day, name, subject, coalesce(preview_text, ''), body_html, body_text, has_free_month_offer, is_active, created_at, updated_at
		from cancellation_email_templates
		where step_day = $1`, stepDay).
		Scan(&t.ID, &t.StepDay, &t.Name, &t.Subject, &t.PreviewText, &t.BodyHTML, &t.BodyText, &t.HasFreeMonthOffer, &t.IsActive, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &t, err
}

func (s *Store) UpdateCancellationTemplate(ctx context.Context, tx pgx.Tx, id string, subject, previewText, bodyHTML, bodyText string, hasFreeMonthOffer, isActive bool) (*CancellationEmailTemplate, error) {
	var t CancellationEmailTemplate
	err := tx.QueryRow(ctx, `
		update cancellation_email_templates
		set subject = $2,
		    preview_text = $3,
		    body_html = $4,
		    body_text = $5,
		    has_free_month_offer = $6,
		    is_active = $7,
		    updated_at = now()
		where id = $1::uuid
		returning id, step_day, name, subject, coalesce(preview_text, ''), body_html, body_text, has_free_month_offer, is_active, created_at, updated_at`,
		id, subject, previewText, bodyHTML, bodyText, hasFreeMonthOffer, isActive).
		Scan(&t.ID, &t.StepDay, &t.Name, &t.Subject, &t.PreviewText, &t.BodyHTML, &t.BodyText, &t.HasFreeMonthOffer, &t.IsActive, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &t, err
}

func (s *Store) RecordCancellationEmailSent(ctx context.Context, tx pgx.Tx, in CancellationEmailLog) (*CancellationEmailLog, error) {
	if in.TrackingToken == "" {
		in.TrackingToken = GenerateTrackingToken()
	}
	var out CancellationEmailLog
	err := tx.QueryRow(ctx, `
		insert into cancellation_email_logs (tenant_id, recipient_email, recipient_name, clinic_name, step_day, subject, tracking_token, sent_at)
		values ($1::uuid, $2, $3, $4, $5, $6, $7, now())
		returning id, tenant_id, recipient_email, recipient_name, clinic_name, step_day, subject, tracking_token, sent_at, opened_at, open_count, last_opened_at, clicked_at, click_count, reactivated_at, user_agent, ip_address, created_at`,
		in.TenantID, in.RecipientEmail, in.RecipientName, in.ClinicName, in.StepDay, in.Subject, in.TrackingToken).
		Scan(&out.ID, &out.TenantID, &out.RecipientEmail, &out.RecipientName, &out.ClinicName, &out.StepDay, &out.Subject, &out.TrackingToken, &out.SentAt, &out.OpenedAt, &out.OpenCount, &out.LastOpenedAt, &out.ClickedAt, &out.ClickCount, &out.ReactivatedAt, &out.UserAgent, &out.IPAddress, &out.CreatedAt)
	return &out, err
}

func (s *Store) RecordPixelOpen(ctx context.Context, tx pgx.Tx, token, userAgent, ip string) error {
	cmd, err := tx.Exec(ctx, `
		update cancellation_email_logs
		set open_count = open_count + 1,
		    opened_at = coalesce(opened_at, now()),
		    last_opened_at = now(),
		    user_agent = coalesce(nullif($2, ''), user_agent),
		    ip_address = coalesce(nullif($3, ''), ip_address)
		where tracking_token = $1`,
		token, userAgent, ip)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) RecordLinkClick(ctx context.Context, tx pgx.Tx, token string) (*CancellationEmailLog, error) {
	var out CancellationEmailLog
	err := tx.QueryRow(ctx, `
		update cancellation_email_logs
		set click_count = click_count + 1,
		    clicked_at = coalesce(clicked_at, now())
		where tracking_token = $1
		returning id, tenant_id, recipient_email, recipient_name, clinic_name, step_day, subject, tracking_token, sent_at, opened_at, open_count, last_opened_at, clicked_at, click_count, reactivated_at, user_agent, ip_address, created_at`,
		token).
		Scan(&out.ID, &out.TenantID, &out.RecipientEmail, &out.RecipientName, &out.ClinicName, &out.StepDay, &out.Subject, &out.TrackingToken, &out.SentAt, &out.OpenedAt, &out.OpenCount, &out.LastOpenedAt, &out.ClickedAt, &out.ClickCount, &out.ReactivatedAt, &out.UserAgent, &out.IPAddress, &out.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &out, err
}

func (s *Store) ListCancellationEmailLogs(ctx context.Context, tx pgx.Tx, limit int) ([]CancellationEmailLog, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := tx.Query(ctx, `
		select id, tenant_id, recipient_email, recipient_name, clinic_name, step_day, subject, tracking_token, sent_at, opened_at, open_count, last_opened_at, clicked_at, click_count, reactivated_at, user_agent, ip_address, created_at
		from cancellation_email_logs
		order by sent_at desc
		limit $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CancellationEmailLog
	for rows.Next() {
		var l CancellationEmailLog
		if err := rows.Scan(&l.ID, &l.TenantID, &l.RecipientEmail, &l.RecipientName, &l.ClinicName, &l.StepDay, &l.Subject, &l.TrackingToken, &l.SentAt, &l.OpenedAt, &l.OpenCount, &l.LastOpenedAt, &l.ClickedAt, &l.ClickCount, &l.ReactivatedAt, &l.UserAgent, &l.IPAddress, &l.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (s *Store) GetWinbackMetrics(ctx context.Context, tx pgx.Tx) (*WinbackMetrics, error) {
	var m WinbackMetrics

	// Count total canceled clinics
	_ = tx.QueryRow(ctx, `select count(*) from tenants where status = 'CANCELED'`).Scan(&m.TotalCanceledClinics)

	// Count canceled clinics within 90-day custody
	_ = tx.QueryRow(ctx, `select count(*) from tenants where status = 'CANCELED' and (purge_scheduled_at is null or purge_scheduled_at > now())`).Scan(&m.ActiveInCustody)

	// Total emails sent
	_ = tx.QueryRow(ctx, `select count(*) from cancellation_email_logs`).Scan(&m.TotalEmailsSent)

	// Total unique emails opened
	_ = tx.QueryRow(ctx, `select count(*) from cancellation_email_logs where open_count > 0`).Scan(&m.TotalEmailsOpened)

	// Total clicks
	_ = tx.QueryRow(ctx, `select coalesce(sum(click_count), 0) from cancellation_email_logs`).Scan(&m.TotalClicks)

	// Total reactivated clinics via winback
	_ = tx.QueryRow(ctx, `select count(distinct tenant_id) from cancellation_email_logs where reactivated_at is not nil`).Scan(&m.TotalReactivations)

	if m.TotalEmailsSent > 0 {
		m.OpenRatePercent = float64(m.TotalEmailsOpened) / float64(m.TotalEmailsSent) * 100.0
		m.ClickRatePercent = float64(m.TotalClicks) / float64(m.TotalEmailsSent) * 100.0
	}
	if m.TotalCanceledClinics > 0 {
		m.ReactivationRatePercent = float64(m.TotalReactivations) / float64(m.TotalCanceledClinics) * 100.0
	}

	return &m, nil
}

func (s *Store) ReactivateTenant(ctx context.Context, tx pgx.Tx, tenantID string, trackingToken string) error {
	cmd, err := tx.Exec(ctx, `
		update tenants
		set status = 'ACTIVE',
		    canceled_at = null,
		    reactivation_deadline_at = null,
		    purge_scheduled_at = null,
		    updated_at = now()
		where id = $1::uuid and status = 'CANCELED'`, tenantID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}

	if trackingToken != "" {
		_, _ = tx.Exec(ctx, `
			update cancellation_email_logs
			set reactivated_at = now()
			where tracking_token = $1`, trackingToken)
	} else {
		_, _ = tx.Exec(ctx, `
			update cancellation_email_logs
			set reactivated_at = now()
			where tenant_id = $1::uuid and reactivated_at is null`, tenantID)
	}

	return nil
}
