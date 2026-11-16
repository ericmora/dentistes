package store

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type FindingMaster struct {
	ID                    string     `json:"id"`
	TenantID              string     `json:"tenant_id,omitempty"`
	Code                  string     `json:"code"`
	Name                  string     `json:"name"`
	Description           string     `json:"description"`
	Category              string     `json:"category"`
	DefaultSeverity       string     `json:"default_severity"`
	ColorCode             string     `json:"color_code"`
	DefaultTreatmentCodes []string   `json:"default_treatment_codes"`
	IsActive              bool       `json:"is_active"`
	DeletedAt             *time.Time `json:"deleted_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

type DefaultFindingDef struct {
	Code                  string
	Name                  string
	Description           string
	Category              string
	DefaultSeverity       string
	ColorCode             string
	DefaultTreatmentCodes []string
}

var DefaultStandardFindings = []DefaultFindingDef{
	{
		Code:                  "CARIES_ESMALTE",
		Name:                  "Caries superficial / esmalte",
		Description:           "Lesión cariosa incipiente o limitada al esmalte sin compromiso pulpar",
		Category:              "CONSERVADORA",
		DefaultSeverity:       "LOW",
		ColorCode:             "#3B82F6",
		DefaultTreatmentCodes: []string{"OBTURACION_SIMPLE"},
	},
	{
		Code:                  "CARIES_PROFUNDA",
		Name:                  "Caries profunda con pulpitis",
		Description:           "Afectación dentinaria profunda con inflamación o necrosis pulpar",
		Category:              "ENDODONCIA",
		DefaultSeverity:       "HIGH",
		ColorCode:             "#8B5CF6",
		DefaultTreatmentCodes: []string{"ENDODONCIA_MULTIRRADICULAR", "OBTURACION_COMPLEJA", "CORONA"},
	},
	{
		Code:                  "FRACTURA_DENTAL",
		Name:                  "Fractura coronal dental",
		Description:           "Rotura traumática de estructura dental con o sin afección cuspídea",
		Category:              "CONSERVADORA",
		DefaultSeverity:       "MEDIUM",
		ColorCode:             "#F59E0B",
		DefaultTreatmentCodes: []string{"OBTURACION_COMPLEJA", "CORONA"},
	},
	{
		Code:                  "RESTO_RADICULAR",
		Name:                  "Resto radicular / Destrucción severa",
		Description:           "Pieza no restaurable por pérdida masiva de tejido biológico",
		Category:              "CIRUGIA",
		DefaultSeverity:       "HIGH",
		ColorCode:             "#EA580C",
		DefaultTreatmentCodes: []string{"EXTRACCION_QUIRURGICA", "IMPLANTE", "CORONA"},
	},
	{
		Code:                  "DIENTE_INCLUIDO",
		Name:                  "Diente incluido / Cordal impactado",
		Description:           "Tercer molar o pieza retenida que requiere abordaje quirúrgico",
		Category:              "CIRUGIA",
		DefaultSeverity:       "MEDIUM",
		ColorCode:             "#F97316",
		DefaultTreatmentCodes: []string{"EXTRACCION_QUIRURGICA"},
	},
	{
		Code:                  "GINGIVITIS",
		Name:                  "Gingivitis y cálculo supragingival",
		Description:           "Inflamación de tejidos blandos y depósitos de sarro",
		Category:              "PREVENCION",
		DefaultSeverity:       "LOW",
		ColorCode:             "#06B6D4",
		DefaultTreatmentCodes: []string{"LIMPIEZA"},
	},
	{
		Code:                  "PERIODONTITIS",
		Name:                  "Periodontitis activa (Bolsas periodontales)",
		Description:           "Pérdida de inserción ósea y presencia de bolsas > 4mm",
		Category:              "PERIODONCIA",
		DefaultSeverity:       "HIGH",
		ColorCode:             "#10B981",
		DefaultTreatmentCodes: []string{"CURETAJE_CUADRANTE", "MANTENIMIENTO_PERIODONTAL"},
	},
	{
		Code:                  "EDENTULISMO_UNITARIO",
		Name:                  "Ausencia de pieza dental (Edentulismo)",
		Description:           "Pérdida de pieza dentaria que precisa rehabilitación prostodóncica",
		Category:              "CIRUGIA",
		DefaultSeverity:       "MEDIUM",
		ColorCode:             "#0F172A",
		DefaultTreatmentCodes: []string{"IMPLANTE", "CORONA"},
	},
	{
		Code:                  "BRUXISMO",
		Name:                  "Bruxismo / Desgaste oclusal severo",
		Description:           "Parafunción masticatoria con atrición dental y sobrecarga articular",
		Category:              "ESTETICA",
		DefaultSeverity:       "MEDIUM",
		ColorCode:             "#6366F1",
		DefaultTreatmentCodes: []string{"FERULA_DESCARGA"},
	},
	{
		Code:                  "ABSCESO_PERIAPICAL",
		Name:                  "Infección / Absceso periapical",
		Description:           "Proceso infeccioso agudo con exudado periapical o flemón",
		Category:              "ENDODONCIA",
		DefaultSeverity:       "HIGH",
		ColorCode:             "#EF4444",
		DefaultTreatmentCodes: []string{"URGENCIA", "ENDODONCIA_MULTIRRADICULAR", "OBTURACION_COMPLEJA"},
	},
	{
		Code:                  "TINCION_ESTETICA",
		Name:                  "Tinción dental / Deseo de aclaramiento",
		Description:           "Decoloración o pigmentación dental susceptible de blanqueamiento",
		Category:              "ESTETICA",
		DefaultSeverity:       "LOW",
		ColorCode:             "#F59E0B",
		DefaultTreatmentCodes: []string{"LIMPIEZA", "BLANQUEAMIENTO"},
	},
	{
		Code:                  "PREVENCION_SELLADO",
		Name:                  "Fisuras profundas en riesgo",
		Description:           "Anatomía oclusal retentiva con alto riesgo de caries",
		Category:              "CONSERVADORA",
		DefaultSeverity:       "LOW",
		ColorCode:             "#60A5FA",
		DefaultTreatmentCodes: []string{"SELLADOR"},
	},
}

var findingCodeRegex = regexp.MustCompile(`[^A-Z0-9_]`)

func NormalizeFindingCode(code, name string) string {
	raw := strings.TrimSpace(code)
	if raw == "" {
		raw = strings.TrimSpace(name)
	}
	raw = strings.ToUpper(raw)
	replacer := strings.NewReplacer(
		"Á", "A", "É", "E", "Í", "I", "Ó", "O", "Ú", "U", "Ü", "U", "Ñ", "N",
		"À", "A", "È", "E", "Ì", "I", "Ò", "O", "Ù", "U",
		" ", "_", "-", "_", "/", "_", "(", "", ")", "",
	)
	normalized := replacer.Replace(raw)
	sanitized := findingCodeRegex.ReplaceAllString(normalized, "")
	if sanitized == "" {
		sanitized = "FINDING"
	}
	return sanitized
}

func (s *Store) SeedDefaultFindings(ctx context.Context, tx pgx.Tx, tenantID string) error {
	for _, f := range DefaultStandardFindings {
		rawJSON, err := json.Marshal(f.DefaultTreatmentCodes)
		if err != nil {
			rawJSON = []byte("[]")
		}
		_, err = tx.Exec(ctx, `insert into findings_catalog (
				tenant_id, code, name, description, category, default_severity, color_code, default_treatment_codes, is_active
			) values ($1::uuid, $2, $3, $4, $5, $6, $7, $8::jsonb, true)
			on conflict (tenant_id, code) do nothing`,
			tenantID, f.Code, f.Name, f.Description, f.Category, f.DefaultSeverity, f.ColorCode, string(rawJSON))
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ListFindingsMaster(ctx context.Context, tx pgx.Tx, tenantID string, includeDeleted bool) ([]FindingMaster, error) {
	query := `select id, tenant_id, code, name, description, category, default_severity,
		coalesce(color_code, '#0D9488'), default_treatment_codes, is_active, deleted_at, created_at, updated_at
		from findings_catalog where tenant_id = $1::uuid`
	if !includeDeleted {
		query += ` and is_active = true and deleted_at is null`
	}
	query += ` order by name asc`

	rows, err := tx.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []FindingMaster{}
	for rows.Next() {
		var item FindingMaster
		var rawTreatments []byte
		if err := rows.Scan(
			&item.ID, &item.TenantID, &item.Code, &item.Name, &item.Description, &item.Category, &item.DefaultSeverity,
			&item.ColorCode, &rawTreatments, &item.IsActive, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if len(rawTreatments) > 0 {
			_ = json.Unmarshal(rawTreatments, &item.DefaultTreatmentCodes)
		}
		if item.DefaultTreatmentCodes == nil {
			item.DefaultTreatmentCodes = []string{}
		}
		out = append(out, item)
	}

	// Auto-seed if tenant has no findings yet
	if len(out) == 0 && !includeDeleted {
		if err := s.SeedDefaultFindings(ctx, tx, tenantID); err != nil {
			return nil, err
		}
		rows2, err := tx.Query(ctx, query, tenantID)
		if err != nil {
			return nil, err
		}
		defer rows2.Close()
		for rows2.Next() {
			var item FindingMaster
			var rawTreatments []byte
			if err := rows2.Scan(
				&item.ID, &item.TenantID, &item.Code, &item.Name, &item.Description, &item.Category, &item.DefaultSeverity,
				&item.ColorCode, &rawTreatments, &item.IsActive, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt,
			); err != nil {
				return nil, err
			}
			if len(rawTreatments) > 0 {
				_ = json.Unmarshal(rawTreatments, &item.DefaultTreatmentCodes)
			}
			if item.DefaultTreatmentCodes == nil {
				item.DefaultTreatmentCodes = []string{}
			}
			out = append(out, item)
		}
	}

	return out, nil
}

func (s *Store) GetFindingMasterByID(ctx context.Context, tx pgx.Tx, tenantID, id string) (*FindingMaster, error) {
	var item FindingMaster
	var rawTreatments []byte
	err := tx.QueryRow(ctx, `select id, tenant_id, code, name, description, category, default_severity,
		coalesce(color_code, '#0D9488'), default_treatment_codes, is_active, deleted_at, created_at, updated_at
		from findings_catalog
		where tenant_id = $1::uuid and id = $2::uuid`,
		tenantID, id,
	).Scan(
		&item.ID, &item.TenantID, &item.Code, &item.Name, &item.Description, &item.Category, &item.DefaultSeverity,
		&item.ColorCode, &rawTreatments, &item.IsActive, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if len(rawTreatments) > 0 {
		_ = json.Unmarshal(rawTreatments, &item.DefaultTreatmentCodes)
	}
	if item.DefaultTreatmentCodes == nil {
		item.DefaultTreatmentCodes = []string{}
	}
	return &item, nil
}

func (s *Store) CreateFindingMaster(ctx context.Context, tx pgx.Tx, tenantID string, item FindingMaster) (*FindingMaster, error) {
	code := NormalizeFindingCode(item.Code, item.Name)
	name := strings.TrimSpace(item.Name)
	if name == "" {
		return nil, errors.New("name is required")
	}
	category := strings.TrimSpace(item.Category)
	if category == "" {
		category = "GENERAL"
	}
	severity := strings.ToUpper(strings.TrimSpace(item.DefaultSeverity))
	if severity != "LOW" && severity != "HIGH" {
		severity = "MEDIUM"
	}
	color := strings.TrimSpace(item.ColorCode)
	if color == "" {
		color = "#0D9488"
	}
	treatmentsJSON, err := json.Marshal(item.DefaultTreatmentCodes)
	if err != nil || len(item.DefaultTreatmentCodes) == 0 {
		treatmentsJSON = []byte("[]")
	}

	var created FindingMaster
	var rawTreatments []byte
	err = tx.QueryRow(ctx, `insert into findings_catalog (
			tenant_id, code, name, description, category, default_severity, color_code, default_treatment_codes, is_active
		) values ($1::uuid, $2, $3, $4, $5, $6, $7, $8::jsonb, true)
		on conflict (tenant_id, code) do update set
			name = excluded.name,
			description = excluded.description,
			category = excluded.category,
			default_severity = excluded.default_severity,
			color_code = excluded.color_code,
			default_treatment_codes = excluded.default_treatment_codes,
			is_active = true,
			deleted_at = null,
			updated_at = now()
		returning id, tenant_id, code, name, description, category, default_severity,
			coalesce(color_code, '#0D9488'), default_treatment_codes, is_active, deleted_at, created_at, updated_at`,
		tenantID, code, name, strings.TrimSpace(item.Description), category, severity, color, string(treatmentsJSON),
	).Scan(
		&created.ID, &created.TenantID, &created.Code, &created.Name, &created.Description, &created.Category,
		&created.DefaultSeverity, &created.ColorCode, &rawTreatments, &created.IsActive, &created.DeletedAt,
		&created.CreatedAt, &created.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if len(rawTreatments) > 0 {
		_ = json.Unmarshal(rawTreatments, &created.DefaultTreatmentCodes)
	}
	if created.DefaultTreatmentCodes == nil {
		created.DefaultTreatmentCodes = []string{}
	}
	return &created, nil
}

func (s *Store) UpdateFindingMaster(ctx context.Context, tx pgx.Tx, tenantID, id string, item FindingMaster) (*FindingMaster, error) {
	name := strings.TrimSpace(item.Name)
	if name == "" {
		return nil, errors.New("name is required")
	}
	category := strings.TrimSpace(item.Category)
	if category == "" {
		category = "GENERAL"
	}
	severity := strings.ToUpper(strings.TrimSpace(item.DefaultSeverity))
	if severity != "LOW" && severity != "HIGH" {
		severity = "MEDIUM"
	}
	color := strings.TrimSpace(item.ColorCode)
	if color == "" {
		color = "#0D9488"
	}
	treatmentsJSON, err := json.Marshal(item.DefaultTreatmentCodes)
	if err != nil || len(item.DefaultTreatmentCodes) == 0 {
		treatmentsJSON = []byte("[]")
	}

	var updated FindingMaster
	var rawTreatments []byte
	err = tx.QueryRow(ctx, `update findings_catalog
		set name = $3,
			description = $4,
			category = $5,
			default_severity = $6,
			color_code = $7,
			default_treatment_codes = $8::jsonb,
			is_active = $9,
			updated_at = now()
		where tenant_id = $1::uuid and id = $2::uuid and deleted_at is null
		returning id, tenant_id, code, name, description, category, default_severity,
			coalesce(color_code, '#0D9488'), default_treatment_codes, is_active, deleted_at, created_at, updated_at`,
		tenantID, id, name, strings.TrimSpace(item.Description), category, severity, color, string(treatmentsJSON), item.IsActive,
	).Scan(
		&updated.ID, &updated.TenantID, &updated.Code, &updated.Name, &updated.Description, &updated.Category,
		&updated.DefaultSeverity, &updated.ColorCode, &rawTreatments, &updated.IsActive, &updated.DeletedAt,
		&updated.CreatedAt, &updated.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if len(rawTreatments) > 0 {
		_ = json.Unmarshal(rawTreatments, &updated.DefaultTreatmentCodes)
	}
	if updated.DefaultTreatmentCodes == nil {
		updated.DefaultTreatmentCodes = []string{}
	}
	return &updated, nil
}

func (s *Store) DeleteFindingMaster(ctx context.Context, tx pgx.Tx, tenantID, id string) error {
	res, err := tx.Exec(ctx, `update findings_catalog
		set is_active = false,
			deleted_at = now(),
			updated_at = now()
		where tenant_id = $1::uuid and id = $2::uuid and deleted_at is null`,
		tenantID, id,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
