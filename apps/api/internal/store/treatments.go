package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type Treatment struct {
	ID               string    `json:"id"`
	TenantID         string    `json:"tenant_id,omitempty"`
	Code             string    `json:"code"`
	Name             string    `json:"name"`
	Category         string    `json:"category"`
	CategoryLabel    string    `json:"category_label"`
	DefaultPrice     float64   `json:"default_price"`
	EstimatedMinutes int       `json:"estimated_minutes"`
	Color            string    `json:"color"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
}

type StandardTreatmentDef struct {
	Code             string
	Name             string
	Category         string
	EstimatedMinutes int
	DefaultPrice     float64
	Color            string
}

var DefaultStandardTreatments = []StandardTreatmentDef{
	{Code: "REVISION", Name: "Revisión y Diagnóstico", Category: "PREVENCION", EstimatedMinutes: 30, DefaultPrice: 30.00, Color: "#0EA5E9"},
	{Code: "LIMPIEZA", Name: "Limpieza dental (Tartrectomía)", Category: "PREVENCION", EstimatedMinutes: 30, DefaultPrice: 50.00, Color: "#06B6D4"},
	{Code: "RADIOGRAFIA", Name: "Radiografía / Ortopantomografía", Category: "PREVENCION", EstimatedMinutes: 15, DefaultPrice: 25.00, Color: "#64748B"},
	{Code: "URGENCIA", Name: "Urgencia dental", Category: "PREVENCION", EstimatedMinutes: 30, DefaultPrice: 40.00, Color: "#EF4444"},
	{Code: "OBTURACION_SIMPLE", Name: "Obturación / Empaste simple", Category: "CONSERVADORA", EstimatedMinutes: 30, DefaultPrice: 60.00, Color: "#3B82F6"},
	{Code: "OBTURACION_COMPLEJA", Name: "Reconstrucción compleja", Category: "CONSERVADORA", EstimatedMinutes: 45, DefaultPrice: 85.00, Color: "#2563EB"},
	{Code: "SELLADOR", Name: "Sellador de fisuras", Category: "CONSERVADORA", EstimatedMinutes: 20, DefaultPrice: 30.00, Color: "#60A5FA"},
	{Code: "ENDODONCIA_UNIRRADICULAR", Name: "Endodoncia unirradicular", Category: "ENDODONCIA", EstimatedMinutes: 45, DefaultPrice: 140.00, Color: "#8B5CF6"},
	{Code: "ENDODONCIA_MULTIRRADICULAR", Name: "Endodoncia multirradicular", Category: "ENDODONCIA", EstimatedMinutes: 60, DefaultPrice: 210.00, Color: "#7C3AED"},
	{Code: "REENDODONCIA", Name: "Reendodoncia", Category: "ENDODONCIA", EstimatedMinutes: 60, DefaultPrice: 240.00, Color: "#6D28D9"},
	{Code: "EXTRACCION_SIMPLE", Name: "Extracción simple", Category: "CIRUGIA", EstimatedMinutes: 30, DefaultPrice: 50.00, Color: "#F97316"},
	{Code: "EXTRACCION_QUIRURGICA", Name: "Extracción quirúrgica / Cordal", Category: "CIRUGIA", EstimatedMinutes: 45, DefaultPrice: 120.00, Color: "#EA580C"},
	{Code: "IMPLANTE", Name: "Colocación de implante", Category: "CIRUGIA", EstimatedMinutes: 60, DefaultPrice: 750.00, Color: "#0F172A"},
	{Code: "CURETAJE_CUADRANTE", Name: "Curetaje / Raspado por cuadrante", Category: "PERIODONCIA", EstimatedMinutes: 45, DefaultPrice: 70.00, Color: "#10B981"},
	{Code: "MANTENIMIENTO_PERIODONTAL", Name: "Mantenimiento periodontal", Category: "PERIODONCIA", EstimatedMinutes: 30, DefaultPrice: 55.00, Color: "#059669"},
	{Code: "CORONA", Name: "Corona / Funda", Category: "PROTESIS", EstimatedMinutes: 45, DefaultPrice: 320.00, Color: "#D97706"},
	{Code: "PUENTE", Name: "Puente fijo", Category: "PROTESIS", EstimatedMinutes: 45, DefaultPrice: 550.00, Color: "#B45309"},
	{Code: "PROTESIS_REMOVIBLE", Name: "Prótesis removible", Category: "PROTESIS", EstimatedMinutes: 30, DefaultPrice: 450.00, Color: "#92400E"},
	{Code: "ORTODONCIA_REVISION", Name: "Ortodoncia (Ajuste mensual)", Category: "ORTODONCIA", EstimatedMinutes: 15, DefaultPrice: 60.00, Color: "#EC4899"},
	{Code: "ORTODONCIA_COLOCACION", Name: "Colocación brackets / Alineadores", Category: "ORTODONCIA", EstimatedMinutes: 60, DefaultPrice: 800.00, Color: "#DB2777"},
	{Code: "BLANQUEAMIENTO", Name: "Blanqueamiento dental", Category: "ESTETICA", EstimatedMinutes: 45, DefaultPrice: 250.00, Color: "#F59E0B"},
	{Code: "FERULA_DESCARGA", Name: "Férula de descarga (Bruxismo)", Category: "ESTETICA", EstimatedMinutes: 30, DefaultPrice: 180.00, Color: "#6366F1"},
}

func CategoryLabel(cat string) string {
	switch cat {
	case "PREVENCION":
		return "Diagnóstico y Prevención"
	case "CONSERVADORA":
		return "Conservadora"
	case "ENDODONCIA":
		return "Endodoncia"
	case "CIRUGIA":
		return "Cirugía e Implantes"
	case "PERIODONCIA":
		return "Periodoncia"
	case "PROTESIS":
		return "Prótesis"
	case "ORTODONCIA":
		return "Ortodoncia"
	case "ESTETICA":
		return "Estética dental"
	default:
		return "General"
	}
}

func (s *Store) SeedDefaultTreatments(ctx context.Context, tx pgx.Tx, tenantID string) error {
	for _, t := range DefaultStandardTreatments {
		_, err := tx.Exec(ctx, `insert into treatments_catalog (tenant_id, code, category, name, default_price, estimated_minutes, color, is_active)
			values ($1, $2, $3, $4, $5, $6, $7, true)
			on conflict do nothing`,
			tenantID, t.Code, t.Category, t.Name, t.DefaultPrice, t.EstimatedMinutes, t.Color)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ListTreatments(ctx context.Context, tx pgx.Tx, tenantID string, includeInactive bool) ([]Treatment, error) {
	query := `select id, tenant_id, coalesce(code, ''), category, name, default_price, estimated_minutes, coalesce(color, '#0EA5E9'), is_active, coalesce(created_at, now())
		from treatments_catalog where tenant_id = $1`
	if !includeInactive {
		query += ` and is_active = true`
	}
	query += ` order by category, name`

	rows, err := tx.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Treatment{}
	for rows.Next() {
		var t Treatment
		if err := rows.Scan(&t.ID, &t.TenantID, &t.Code, &t.Category, &t.Name, &t.DefaultPrice, &t.EstimatedMinutes, &t.Color, &t.IsActive, &t.CreatedAt); err != nil {
			return nil, err
		}
		t.CategoryLabel = CategoryLabel(t.Category)
		out = append(out, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Auto-seed if tenant has no treatments catalog yet
	if len(out) == 0 {
		if err := s.SeedDefaultTreatments(ctx, tx, tenantID); err != nil {
			return nil, err
		}
		rows2, err := tx.Query(ctx, query, tenantID)
		if err != nil {
			return nil, err
		}
		defer rows2.Close()
		for rows2.Next() {
			var t Treatment
			if err := rows2.Scan(&t.ID, &t.TenantID, &t.Code, &t.Category, &t.Name, &t.DefaultPrice, &t.EstimatedMinutes, &t.Color, &t.IsActive, &t.CreatedAt); err != nil {
				return nil, err
			}
			t.CategoryLabel = CategoryLabel(t.Category)
			out = append(out, t)
		}
	}

	return out, nil
}

func (s *Store) CreateTreatment(ctx context.Context, tx pgx.Tx, t Treatment) (*Treatment, error) {
	if t.EstimatedMinutes <= 0 {
		t.EstimatedMinutes = 30
	}
	if t.Color == "" {
		t.Color = "#0EA5E9"
	}
	if t.Category == "" {
		t.Category = "GENERAL"
	}
	var res Treatment
	err := tx.QueryRow(ctx, `insert into treatments_catalog (tenant_id, code, category, name, default_price, estimated_minutes, color, is_active)
		values ($1, $2, $3, $4, $5, $6, $7, true)
		returning id, tenant_id, coalesce(code, ''), category, name, default_price, estimated_minutes, coalesce(color, '#0EA5E9'), is_active, coalesce(created_at, now())`,
		t.TenantID, t.Code, t.Category, t.Name, t.DefaultPrice, t.EstimatedMinutes, t.Color).
		Scan(&res.ID, &res.TenantID, &res.Code, &res.Category, &res.Name, &res.DefaultPrice, &res.EstimatedMinutes, &res.Color, &res.IsActive, &res.CreatedAt)
	if err != nil {
		return nil, err
	}
	res.CategoryLabel = CategoryLabel(res.Category)
	return &res, nil
}

func (s *Store) UpdateTreatment(ctx context.Context, tx pgx.Tx, t Treatment) (*Treatment, error) {
	var res Treatment
	err := tx.QueryRow(ctx, `update treatments_catalog
		set name = coalesce(nullif($3, ''), name),
		    category = coalesce(nullif($4, ''), category),
		    default_price = $5,
		    estimated_minutes = $6,
		    color = coalesce(nullif($7, ''), color),
		    is_active = $8
		where id = $1 and tenant_id = $2
		returning id, tenant_id, coalesce(code, ''), category, name, default_price, estimated_minutes, coalesce(color, '#0EA5E9'), is_active, coalesce(created_at, now())`,
		t.ID, t.TenantID, t.Name, t.Category, t.DefaultPrice, t.EstimatedMinutes, t.Color, t.IsActive).
		Scan(&res.ID, &res.TenantID, &res.Code, &res.Category, &res.Name, &res.DefaultPrice, &res.EstimatedMinutes, &res.Color, &res.IsActive, &res.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	res.CategoryLabel = CategoryLabel(res.Category)
	return &res, nil
}

func (s *Store) DeleteTreatment(ctx context.Context, tx pgx.Tx, tenantID, treatmentID string) error {
	cmd, err := tx.Exec(ctx, `update treatments_catalog set is_active = false where id = $1 and tenant_id = $2`, treatmentID, tenantID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
