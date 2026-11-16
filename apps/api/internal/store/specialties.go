package store

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Specialty struct {
	ID          string     `json:"id"`
	TenantID    string     `json:"tenant_id,omitempty"`
	Code        string     `json:"code"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	ColorCode   string     `json:"color_code"`
	IsActive    bool       `json:"is_active"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type DefaultSpecialtyDef struct {
	Code        string
	Name        string
	Description string
	ColorCode   string
}

var DefaultStandardSpecialties = []DefaultSpecialtyDef{
	{Code: "PREVENCION", Name: "Diagnóstico y Prevención", Description: "Revisiones, diagnósticos y limpiezas preventivas", ColorCode: "#0EA5E9"},
	{Code: "CONSERVADORA", Name: "Odontología Conservadora", Description: "Obturaciones, empastes simples y restauraciones", ColorCode: "#3B82F6"},
	{Code: "ENDODONCIA", Name: "Endodoncia", Description: "Tratamientos de conductos radiculares", ColorCode: "#8B5CF6"},
	{Code: "CIRUGIA", Name: "Cirugía e Implantes", Description: "Extracciones dentales, cirugía oral e implantología", ColorCode: "#F97316"},
	{Code: "IMPLANTES", Name: "Implantología", Description: "Implantes dentales, cirugías guiadas y osteointegración", ColorCode: "#0F172A"},
	{Code: "PERIODONCIA", Name: "Periodoncia", Description: "Tratamientos periodontales, raspados y curetajes", ColorCode: "#10B981"},
	{Code: "PROTESIS", Name: "Prótesis Dental", Description: "Prótesis fijas, removibles y sobre implantes", ColorCode: "#D97706"},
	{Code: "ORTODONCIA", Name: "Ortodoncia", Description: "Brackets, ortodoncia invisible y alineadores", ColorCode: "#EC4899"},
	{Code: "ESTETICA", Name: "Estética Dental", Description: "Blanqueamientos, carillas y estética dental", ColorCode: "#F59E0B"},
	{Code: "ODONTOPEDIATRIA", Name: "Odontopediatría", Description: "Odontología y atención infantil especializada", ColorCode: "#06B6D4"},
	{Code: "HIGIENE", Name: "Higiene Dental", Description: "Profilaxis bucodental y mantenimientos", ColorCode: "#14B8A6"},
	{Code: "GENERAL", Name: "General", Description: "Procedimientos y consultas generales", ColorCode: "#64748B"},
}

var codeSanitizerRegex = regexp.MustCompile(`[^A-Z0-9_]`)

func NormalizeSpecialtyCode(code, name string) string {
	raw := strings.TrimSpace(code)
	if raw == "" {
		raw = strings.TrimSpace(name)
	}
	raw = strings.ToUpper(raw)
	replacer := strings.NewReplacer(
		"Á", "A", "É", "E", "Í", "I", "Ó", "O", "Ú", "U", "Ü", "U", "Ñ", "N",
		"À", "A", "È", "E", "Ì", "I", "Ò", "O", "Ù", "U",
		" ", "_", "-", "_",
	)
	normalized := replacer.Replace(raw)
	sanitized := codeSanitizerRegex.ReplaceAllString(normalized, "")
	if sanitized == "" {
		sanitized = "SPECIALTY"
	}
	return sanitized
}

func (s *Store) SeedDefaultSpecialties(ctx context.Context, tx pgx.Tx, tenantID string) error {
	for _, spec := range DefaultStandardSpecialties {
		_, err := tx.Exec(ctx, `insert into specialties (tenant_id, code, name, description, color_code, is_active)
			values ($1::uuid, $2, $3, $4, $5, true)
			on conflict (tenant_id, code) do nothing`,
			tenantID, spec.Code, spec.Name, spec.Description, spec.ColorCode)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ListSpecialties(ctx context.Context, tx pgx.Tx, tenantID string, includeDeleted bool) ([]Specialty, error) {
	query := `select id, tenant_id, code, name, description, coalesce(color_code, '#0D9488'), is_active, deleted_at, created_at, updated_at
		from specialties where tenant_id = $1::uuid`
	if !includeDeleted {
		query += ` and is_active = true and deleted_at is null`
	}
	query += ` order by name asc`

	rows, err := tx.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Specialty{}
	for rows.Next() {
		var item Specialty
		if err := rows.Scan(&item.ID, &item.TenantID, &item.Code, &item.Name, &item.Description, &item.ColorCode, &item.IsActive, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Auto-seed if tenant has no specialties yet
	if len(out) == 0 && !includeDeleted {
		if err := s.SeedDefaultSpecialties(ctx, tx, tenantID); err != nil {
			return nil, err
		}
		rows2, err := tx.Query(ctx, query, tenantID)
		if err != nil {
			return nil, err
		}
		defer rows2.Close()
		for rows2.Next() {
			var item Specialty
			if err := rows2.Scan(&item.ID, &item.TenantID, &item.Code, &item.Name, &item.Description, &item.ColorCode, &item.IsActive, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt); err != nil {
				return nil, err
			}
			out = append(out, item)
		}
	}

	return out, nil
}

func (s *Store) CreateSpecialty(ctx context.Context, tx pgx.Tx, spec Specialty) (Specialty, error) {
	spec.Code = NormalizeSpecialtyCode(spec.Code, spec.Name)
	if spec.ColorCode == "" {
		spec.ColorCode = "#0D9488"
	}
	var out Specialty
	err := tx.QueryRow(ctx, `
		insert into specialties (tenant_id, code, name, description, color_code, is_active, deleted_at)
		values ($1::uuid, $2, $3, $4, $5, true, null)
		on conflict (tenant_id, code) do update
		set name = excluded.name,
		    description = excluded.description,
		    color_code = excluded.color_code,
		    is_active = true,
		    deleted_at = null,
		    updated_at = now()
		returning id, tenant_id, code, name, description, color_code, is_active, deleted_at, created_at, updated_at`,
		spec.TenantID, spec.Code, spec.Name, spec.Description, spec.ColorCode).Scan(
		&out.ID, &out.TenantID, &out.Code, &out.Name, &out.Description, &out.ColorCode, &out.IsActive, &out.DeletedAt, &out.CreatedAt, &out.UpdatedAt,
	)
	return out, err
}

func (s *Store) UpdateSpecialty(ctx context.Context, tx pgx.Tx, spec Specialty) (Specialty, error) {
	var out Specialty
	err := tx.QueryRow(ctx, `
		update specialties
		set name = coalesce(nullif($3, ''), name),
		    description = $4,
		    color_code = coalesce(nullif($5, ''), color_code),
		    is_active = $6,
		    updated_at = now()
		where id = $1::uuid and tenant_id = $2::uuid and deleted_at is null
		returning id, tenant_id, code, name, description, color_code, is_active, deleted_at, created_at, updated_at`,
		spec.ID, spec.TenantID, spec.Name, spec.Description, spec.ColorCode, spec.IsActive).Scan(
		&out.ID, &out.TenantID, &out.Code, &out.Name, &out.Description, &out.ColorCode, &out.IsActive, &out.DeletedAt, &out.CreatedAt, &out.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Specialty{}, ErrNotFound
	}
	return out, err
}

func (s *Store) DeleteSpecialty(ctx context.Context, tx pgx.Tx, tenantID, specialtyID string) error {
	cmd, err := tx.Exec(ctx, `update specialties set is_active = false, deleted_at = now(), updated_at = now()
		where id = $1::uuid and tenant_id = $2::uuid and deleted_at is null`,
		specialtyID, tenantID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
