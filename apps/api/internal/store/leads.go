package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type NewLead struct {
	ContactName string
	ClinicName  string
	Email       string
	Phone       string
	Interest    string
	Lang        string
	Notes       string
	Source      string
	UTMSource   string
	UTMMedium   string
	UTMCampaign string
	IP          string
}

func (s *Store) CreateLead(ctx context.Context, tx pgx.Tx, in NewLead) (*Lead, error) {
	var l Lead
	err := tx.QueryRow(ctx, `insert into leads
			(contact_name, clinic_name, email, phone, interest, lang, notes, source, utm_source, utm_medium, utm_campaign, ip)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, nullif($12, '')::inet)
		returning id, contact_name, clinic_name, email, phone, interest, lang, notes, source, utm_source, utm_medium, utm_campaign, status, created_at, updated_at`,
		in.ContactName, in.ClinicName, in.Email, in.Phone, in.Interest, in.Lang, in.Notes,
		in.Source, in.UTMSource, in.UTMMedium, in.UTMCampaign, in.IP).
		Scan(&l.ID, &l.ContactName, &l.ClinicName, &l.Email, &l.Phone, &l.Interest, &l.Lang,
			&l.Notes, &l.Source, &l.UTMSource, &l.UTMMedium, &l.UTMCampaign, &l.Status, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (s *Store) ListLeads(ctx context.Context, tx pgx.Tx, status string, limit int) ([]Lead, error) {
	rows, err := tx.Query(ctx, `select id, contact_name, clinic_name, email, phone, interest, lang, notes, source, utm_source, utm_medium, utm_campaign, status, created_at, updated_at
		from leads
		where ($1 = '' or status = $1)
		order by created_at desc
		limit $2`, status, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Lead{}
	for rows.Next() {
		var l Lead
		if err := rows.Scan(&l.ID, &l.ContactName, &l.ClinicName, &l.Email, &l.Phone, &l.Interest, &l.Lang,
			&l.Notes, &l.Source, &l.UTMSource, &l.UTMMedium, &l.UTMCampaign, &l.Status, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (s *Store) UpdateLeadStatus(ctx context.Context, tx pgx.Tx, id, status string) (*Lead, error) {
	var l Lead
	err := tx.QueryRow(ctx, `update leads set status = $2
		where id = $1
		returning id, contact_name, clinic_name, email, phone, interest, lang, notes, source, utm_source, utm_medium, utm_campaign, status, created_at, updated_at`,
		id, status).
		Scan(&l.ID, &l.ContactName, &l.ClinicName, &l.Email, &l.Phone, &l.Interest, &l.Lang,
			&l.Notes, &l.Source, &l.UTMSource, &l.UTMMedium, &l.UTMCampaign, &l.Status, &l.CreatedAt, &l.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &l, nil
}
