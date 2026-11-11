package store

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func (s *Store) ListPatients(ctx context.Context, tx pgx.Tx, search string, limit, offset int) ([]Patient, error) {
	rows, err := tx.Query(ctx, `select id, first_name, last_name, dni_nie, birth_date::text, gender, phone, email,
			whatsapp_opt_in, coalesce((medical_alerts->>'high_risk')::boolean, false), created_at
		from patients
		where ($1 = '' or first_name ilike '%' || $1 || '%' or last_name ilike '%' || $1 || '%' or phone ilike '%' || $1 || '%')
		order by last_name, first_name
		limit $2 offset $3`, search, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Patient{}
	for rows.Next() {
		var p Patient
		if err := rows.Scan(&p.ID, &p.FirstName, &p.LastName, &p.DNINIE, &p.BirthDate, &p.Gender, &p.Phone,
			&p.Email, &p.WhatsappOptIn, &p.HighRisk, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

type NewPatient struct {
	FirstName     string
	LastName      string
	DNINIE        string
	BirthDate     string
	Gender        string
	Phone         string
	Email         string
	WhatsappOptIn bool
	AddressJSON   string
	AlertsJSON    string
}

func (s *Store) CreatePatient(ctx context.Context, tx pgx.Tx, tenantID string, in NewPatient) (*Patient, error) {
	var p Patient
	err := tx.QueryRow(ctx, `insert into patients
			(tenant_id, first_name, last_name, dni_nie, birth_date, gender, phone, email, whatsapp_opt_in, address, medical_alerts)
		values ($1, $2, $3, nullif($4, ''), $5::date, nullif($6, ''), $7, nullif($8, ''), $9, $10::jsonb, $11::jsonb)
		returning id, first_name, last_name, dni_nie, birth_date::text, gender, phone, email, whatsapp_opt_in,
			coalesce((medical_alerts->>'high_risk')::boolean, false), created_at`,
		tenantID, in.FirstName, in.LastName, in.DNINIE, in.BirthDate, in.Gender, in.Phone, in.Email,
		in.WhatsappOptIn, in.AddressJSON, in.AlertsJSON).
		Scan(&p.ID, &p.FirstName, &p.LastName, &p.DNINIE, &p.BirthDate, &p.Gender, &p.Phone, &p.Email,
			&p.WhatsappOptIn, &p.HighRisk, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}
