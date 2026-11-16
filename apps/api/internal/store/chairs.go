package store

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type DentalChair struct {
	ID                string    `json:"id"`
	Name              string    `json:"name"`
	ColorCode         string    `json:"color_code"`
	Equipment         string    `json:"equipment"`
	AllowedCategories []string  `json:"allowed_categories"`
	IsActive          bool      `json:"is_active"`
	CreatedAt         time.Time `json:"created_at"`
}

func (s *Store) ListDentalChairs(ctx context.Context, tx pgx.Tx) ([]DentalChair, error) {
	rows, err := tx.Query(ctx, `select id, name, coalesce(color_code, '#0D9488'), coalesce(equipment, ''), coalesce(allowed_categories, '[]'::jsonb), is_active, created_at
		from dental_chairs where is_active = true order by created_at, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []DentalChair{}
	for rows.Next() {
		var c DentalChair
		var catRaw []byte
		if err := rows.Scan(&c.ID, &c.Name, &c.ColorCode, &c.Equipment, &catRaw, &c.IsActive, &c.CreatedAt); err != nil {
			return nil, err
		}
		if len(catRaw) > 0 {
			_ = json.Unmarshal(catRaw, &c.AllowedCategories)
		}
		if c.AllowedCategories == nil {
			c.AllowedCategories = []string{}
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) CreateDentalChair(ctx context.Context, tx pgx.Tx, tenantID, name, colorCode, equipment string, allowedCategories []string) (*DentalChair, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("name is required")
	}
	if colorCode == "" {
		colorCode = "#0D9488"
	}
	if allowedCategories == nil {
		allowedCategories = []string{}
	}
	catJSON, _ := json.Marshal(allowedCategories)
	var c DentalChair
	var catRaw []byte
	err := tx.QueryRow(ctx, `insert into dental_chairs (tenant_id, name, color_code, equipment, allowed_categories)
		values ($1, $2, $3, $4, $5::jsonb)
		returning id, name, coalesce(color_code, '#0D9488'), coalesce(equipment, ''), coalesce(allowed_categories, '[]'::jsonb), is_active, created_at`,
		tenantID, strings.TrimSpace(name), colorCode, strings.TrimSpace(equipment), string(catJSON)).
		Scan(&c.ID, &c.Name, &c.ColorCode, &c.Equipment, &catRaw, &c.IsActive, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(catRaw, &c.AllowedCategories)
	if c.AllowedCategories == nil {
		c.AllowedCategories = []string{}
	}
	return &c, nil
}

func (s *Store) UpdateDentalChair(ctx context.Context, tx pgx.Tx, id, name, colorCode, equipment string, allowedCategories []string, isActive bool) (*DentalChair, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("name is required")
	}
	if colorCode == "" {
		colorCode = "#0D9488"
	}
	if allowedCategories == nil {
		allowedCategories = []string{}
	}
	catJSON, _ := json.Marshal(allowedCategories)
	var c DentalChair
	var catRaw []byte
	err := tx.QueryRow(ctx, `update dental_chairs
		set name = $2, color_code = $3, equipment = $4, allowed_categories = $5::jsonb, is_active = $6
		where id = $1
		returning id, name, coalesce(color_code, '#0D9488'), coalesce(equipment, ''), coalesce(allowed_categories, '[]'::jsonb), is_active, created_at`,
		id, strings.TrimSpace(name), colorCode, strings.TrimSpace(equipment), string(catJSON), isActive).
		Scan(&c.ID, &c.Name, &c.ColorCode, &c.Equipment, &catRaw, &c.IsActive, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(catRaw, &c.AllowedCategories)
	if c.AllowedCategories == nil {
		c.AllowedCategories = []string{}
	}
	return &c, nil
}

func (s *Store) DeleteDentalChair(ctx context.Context, tx pgx.Tx, id string) error {
	tag, err := tx.Exec(ctx, `update dental_chairs set is_active = false where id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
