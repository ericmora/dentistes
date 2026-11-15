package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type ClinicalFinding struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id,omitempty"`
	PatientID     string    `json:"patient_id"`
	DoctorID      string    `json:"doctor_id"`
	DoctorName    string    `json:"doctor_name,omitempty"`
	ToothNumber   string    `json:"tooth_number"`
	Surfaces      []string  `json:"surfaces"`
	PathologyCode string    `json:"pathology_code"`
	Diagnosis     string    `json:"diagnosis"`
	Severity      string    `json:"severity"`
	Status        string    `json:"status"`
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateFindingInput struct {
	ToothNumber   string   `json:"tooth_number"`
	Surfaces      []string `json:"surfaces"`
	PathologyCode string   `json:"pathology_code"`
	Diagnosis     string   `json:"diagnosis"`
	Severity      string   `json:"severity"`
	Notes         string   `json:"notes"`
}

type BudgetProcedureItem struct {
	ID              string  `json:"id"`
	TreatmentCode   string  `json:"treatment_code,omitempty"`
	Description     string  `json:"description"`
	ToothNumber     string  `json:"tooth_number,omitempty"`
	Quantity        int     `json:"quantity"`
	UnitPriceCents  int64   `json:"unit_price_cents"`
	DiscountPercent float64 `json:"discount_percent,omitempty"`
	TaxRatePercent  float64 `json:"tax_rate_percent,omitempty"`
}

type BudgetTreatmentOption struct {
	ID                   string                `json:"id"`
	OptionLabel          string                `json:"option_label"`
	Name                 string                `json:"name"`
	Description          string                `json:"description,omitempty"`
	IsRecommended        bool                  `json:"is_recommended"`
	Items                []BudgetProcedureItem `json:"items"`
	TotalCents           int64                 `json:"total_cents"`
	PatientResponse      string                `json:"patient_response"` // PENDING | ACCEPTED | REJECTED
	PatientResponseAt    *time.Time            `json:"patient_response_at,omitempty"`
	PatientResponseNotes string                `json:"patient_response_notes,omitempty"`
}

type BudgetFindingBlock struct {
	FindingID   string                  `json:"finding_id"`
	ToothNumber string                  `json:"tooth_number"`
	Surfaces    []string                `json:"surfaces,omitempty"`
	Diagnosis   string                  `json:"diagnosis"`
	Notes       string                  `json:"notes,omitempty"`
	Options     []BudgetTreatmentOption `json:"options"`
}

type PatientBudget struct {
	ID                string               `json:"id"`
	TenantID          string               `json:"tenant_id,omitempty"`
	PatientID         string               `json:"patient_id"`
	DoctorID          string               `json:"doctor_id"`
	DoctorName        string               `json:"doctor_name,omitempty"`
	Series            string               `json:"series"`
	BudgetNumber      int                  `json:"budget_number"`
	Title             string               `json:"title"`
	IssueDate         time.Time            `json:"issue_date"`
	ValidityDays      int                  `json:"validity_days"`
	ValidUntil        time.Time            `json:"valid_until"`
	Status            string               `json:"status"` // DRAFT | PRESENTED | ACCEPTED | PARTIAL | REJECTED | EXPIRED | INVOICED
	FindingsBlocks    []BudgetFindingBlock `json:"findings_blocks"`
	MinEstimateAmount float64              `json:"min_estimate_amount"`
	MaxEstimateAmount float64              `json:"max_estimate_amount"`
	AcceptedAmount    float64              `json:"accepted_amount"`
	Notes             string               `json:"notes"`
	InvoiceID         *string              `json:"invoice_id,omitempty"`
	CreatedAt         time.Time            `json:"created_at"`
	UpdatedAt         time.Time            `json:"updated_at"`
}

type CreateBudgetInput struct {
	Series         string               `json:"series"`
	Title          string               `json:"title"`
	ValidityDays   int                  `json:"validity_days"`
	Status         string               `json:"status"`
	Notes          string               `json:"notes"`
	FindingsBlocks []BudgetFindingBlock `json:"findings_blocks"`
}

func ComputeValidUntil(issueDate time.Time, validityDays int) time.Time {
	if validityDays <= 0 {
		validityDays = 30
	}
	return issueDate.AddDate(0, 0, validityDays)
}

func IsFindingOpen(status string) bool {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "INVOICED", "DISCARDED":
		return false
	default:
		return true
	}
}

func IsBudgetOpen(status string) bool {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "INVOICED", "REJECTED":
		return false
	default:
		return true
	}
}

// ResolveFindingStatusAfterBudgetChange computes the clinical finding's next status
// when treatment options in a budget change.
// CRITICAL RULE: Discarding/rejecting treatment options NEVER discards the clinical finding!
// Instead, if all options in the budget are rejected, the finding returns to "OPEN" so
// another budget with new treatment options can be created and accepted for the same finding.
func ResolveFindingStatusAfterBudgetChange(currentFindingStatus string, block BudgetFindingBlock) string {
	cur := strings.ToUpper(strings.TrimSpace(currentFindingStatus))
	if cur == "INVOICED" || cur == "DISCARDED" {
		return cur
	}
	allRejected := len(block.Options) > 0
	for _, opt := range block.Options {
		resp := strings.ToUpper(strings.TrimSpace(opt.PatientResponse))
		if resp == "ACCEPTED" {
			return "ACCEPTED"
		}
		if resp != "REJECTED" {
			allRejected = false
		}
	}
	if allRejected {
		return "OPEN"
	}
	return "IN_BUDGET"
}

func ValidateFindingStatusUpdate(status, notes string) error {
	st := strings.ToUpper(strings.TrimSpace(status))
	switch st {
	case "OPEN", "IN_BUDGET", "ACCEPTED", "INVOICED":
		return nil
	case "DISCARDED":
		if strings.TrimSpace(notes) == "" {
			return errors.New("se requiere una nota clínica para cancelar el hallazgo")
		}
		return nil
	default:
		return errors.New("status must be OPEN, IN_BUDGET, ACCEPTED, INVOICED or DISCARDED")
	}
}

func FormatFindingCreatedHistoryContent(toothNumber string, surfaces []string, diagnosis, notes string) string {
	tooth := strings.TrimSpace(toothNumber)
	if tooth == "" {
		tooth = "General"
	}
	prefix := fmt.Sprintf("[Pieza %s]", tooth)
	if strings.EqualFold(tooth, "General") {
		prefix = "[General]"
	}
	msg := fmt.Sprintf("%s Hallazgo clínico registrado: %s", prefix, strings.TrimSpace(diagnosis))
	if len(surfaces) > 0 {
		msg += fmt.Sprintf(" (Caras: %s)", strings.Join(surfaces, ", "))
	}
	if strings.TrimSpace(notes) != "" {
		msg += fmt.Sprintf(" · Nota: %s", strings.TrimSpace(notes))
	}
	return msg
}

func FormatFindingCancelledHistoryContent(toothNumber, diagnosis, notes string) string {
	tooth := strings.TrimSpace(toothNumber)
	if tooth == "" {
		tooth = "General"
	}
	prefix := fmt.Sprintf("[Pieza %s]", tooth)
	if strings.EqualFold(tooth, "General") {
		prefix = "[General]"
	}
	return fmt.Sprintf("%s Hallazgo clínico cancelado (%s). Nota clínica: %s", prefix, strings.TrimSpace(diagnosis), strings.TrimSpace(notes))
}

func computeOptionTotalCents(items []BudgetProcedureItem) int64 {
	var total int64
	for _, it := range items {
		qty := it.Quantity
		if qty <= 0 {
			qty = 1
		}
		line := int64(qty) * it.UnitPriceCents
		if it.DiscountPercent > 0 && it.DiscountPercent <= 100 {
			discount := int64(float64(line) * (it.DiscountPercent / 100.0))
			line -= discount
		}
		if it.TaxRatePercent > 0 {
			tax := int64(float64(line) * (it.TaxRatePercent / 100.0))
			line += tax
		}
		total += line
	}
	return total
}

func NormalizeAndComputeBudgetBlocks(blocks []BudgetFindingBlock) ([]BudgetFindingBlock, float64, float64, float64) {
	out := make([]BudgetFindingBlock, len(blocks))
	var minTotalCents int64
	var maxTotalCents int64
	var acceptedTotalCents int64

	for i, blk := range blocks {
		bCopy := blk
		if bCopy.ToothNumber == "" {
			bCopy.ToothNumber = "General"
		}
		if bCopy.Surfaces == nil {
			bCopy.Surfaces = []string{}
		}
		bCopy.Options = make([]BudgetTreatmentOption, len(blk.Options))

		var blockMin int64 = -1
		var blockMax int64 = 0

		for j, opt := range blk.Options {
			oCopy := opt
			if oCopy.OptionLabel == "" {
				oCopy.OptionLabel = fmt.Sprintf("Opción %d", j+1)
			}
			resp := strings.ToUpper(strings.TrimSpace(oCopy.PatientResponse))
			switch resp {
			case "ACCEPTED", "REJECTED", "PENDING":
				oCopy.PatientResponse = resp
			default:
				oCopy.PatientResponse = "PENDING"
			}
			oCopy.TotalCents = computeOptionTotalCents(oCopy.Items)
			if blockMin == -1 || oCopy.TotalCents < blockMin {
				blockMin = oCopy.TotalCents
			}
			if oCopy.TotalCents > blockMax {
				blockMax = oCopy.TotalCents
			}
			if oCopy.PatientResponse == "ACCEPTED" {
				acceptedTotalCents += oCopy.TotalCents
			}
			bCopy.Options[j] = oCopy
		}

		if blockMin > 0 {
			minTotalCents += blockMin
		}
		maxTotalCents += blockMax
		out[i] = bCopy
	}

	return out, float64(minTotalCents) / 100.0, float64(maxTotalCents) / 100.0, float64(acceptedTotalCents) / 100.0
}

func ApplyBudgetOptionResponse(
	blocks []BudgetFindingBlock,
	findingID, optionID, response, notes string,
	now time.Time,
) ([]BudgetFindingBlock, string, error) {
	resp := strings.ToUpper(strings.TrimSpace(response))
	switch resp {
	case "ACCEPTED", "REJECTED", "PENDING":
	default:
		return nil, "", errors.New("patient_response must be PENDING, ACCEPTED or REJECTED")
	}

	found := false
	updated := make([]BudgetFindingBlock, len(blocks))
	for i, blk := range blocks {
		bCopy := blk
		bCopy.Options = make([]BudgetTreatmentOption, len(blk.Options))
		copy(bCopy.Options, blk.Options)

		if blk.FindingID == findingID {
			for j := range bCopy.Options {
				if bCopy.Options[j].ID == optionID {
					found = true
					bCopy.Options[j].PatientResponse = resp
					ts := now
					bCopy.Options[j].PatientResponseAt = &ts
					bCopy.Options[j].PatientResponseNotes = strings.TrimSpace(notes)
				} else if resp == "ACCEPTED" && bCopy.Options[j].PatientResponse != "REJECTED" {
					// Mutually exclusive alternatives for the same finding: accepting one rejects the other alternatives
					bCopy.Options[j].PatientResponse = "REJECTED"
					ts := now
					bCopy.Options[j].PatientResponseAt = &ts
					if bCopy.Options[j].PatientResponseNotes == "" {
						bCopy.Options[j].PatientResponseNotes = "Descartado al elegir otra alternativa para este hallazgo"
					}
				}
			}
		}
		updated[i] = bCopy
	}

	if !found {
		return nil, "", ErrNotFound
	}

	// Derive overall budget status from findings blocks
	totalFindings := len(updated)
	acceptedFindings := 0
	allRejectedFindings := 0

	for _, blk := range updated {
		hasAccepted := false
		allOptRejected := len(blk.Options) > 0
		for _, opt := range blk.Options {
			if opt.PatientResponse == "ACCEPTED" {
				hasAccepted = true
			}
			if opt.PatientResponse != "REJECTED" {
				allOptRejected = false
			}
		}
		if hasAccepted {
			acceptedFindings++
		}
		if allOptRejected {
			allRejectedFindings++
		}
	}

	nextStatus := "PRESENTED"
	if acceptedFindings == totalFindings && totalFindings > 0 {
		nextStatus = "ACCEPTED"
	} else if acceptedFindings > 0 {
		nextStatus = "PARTIAL"
	} else if allRejectedFindings == totalFindings && totalFindings > 0 {
		nextStatus = "REJECTED"
	}

	return updated, nextStatus, nil
}

func ExtractAcceptedInvoiceItems(blocks []BudgetFindingBlock) []InvoiceItem {
	var items []InvoiceItem
	for _, blk := range blocks {
		for _, opt := range blk.Options {
			if opt.PatientResponse != "ACCEPTED" {
				continue
			}
			for _, it := range opt.Items {
				qty := it.Quantity
				if qty <= 0 {
					qty = 1
				}
				unitCents := it.UnitPriceCents
				if it.DiscountPercent > 0 && it.DiscountPercent <= 100 {
					unitCents = int64(float64(unitCents) * (1.0 - it.DiscountPercent/100.0))
				}
				tooth := it.ToothNumber
				if tooth == "" {
					tooth = blk.ToothNumber
				}
				items = append(items, InvoiceItem{
					ID:             it.ID,
					Description:    fmt.Sprintf("%s (%s - %s)", it.Description, blk.Diagnosis, opt.Name),
					ToothNumber:    tooth,
					Quantity:       qty,
					UnitPriceCents: unitCents,
					TaxRatePercent: it.TaxRatePercent,
				})
			}
		}
	}
	return items
}

func (s *Store) ListPatientFindings(ctx context.Context, tx pgx.Tx, tenantID, patientID string, onlyOpen bool) ([]ClinicalFinding, error) {
	query := `
		SELECT cf.id, cf.tenant_id, cf.patient_id, cf.doctor_id, COALESCE(u.full_name, ''),
		       cf.tooth_number, cf.surfaces, cf.pathology_code, cf.diagnosis,
		       cf.severity, cf.status, cf.notes, cf.created_at, cf.updated_at
		FROM clinical_findings cf
		LEFT JOIN users u ON u.id = cf.doctor_id
		WHERE cf.tenant_id = $1 AND cf.patient_id = $2
	`
	if onlyOpen {
		query += ` AND cf.status NOT IN ('INVOICED', 'DISCARDED')`
	}
	query += ` ORDER BY cf.created_at DESC`

	rows, err := tx.Query(ctx, query, tenantID, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ClinicalFinding{}
	for rows.Next() {
		var f ClinicalFinding
		var surfBytes []byte
		if err := rows.Scan(
			&f.ID, &f.TenantID, &f.PatientID, &f.DoctorID, &f.DoctorName,
			&f.ToothNumber, &surfBytes, &f.PathologyCode, &f.Diagnosis,
			&f.Severity, &f.Status, &f.Notes, &f.CreatedAt, &f.UpdatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(surfBytes, &f.Surfaces)
		if f.Surfaces == nil {
			f.Surfaces = []string{}
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *Store) CreatePatientFinding(ctx context.Context, tx pgx.Tx, tenantID, patientID, doctorID string, in CreateFindingInput) (*ClinicalFinding, error) {
	tooth := strings.TrimSpace(in.ToothNumber)
	if tooth == "" {
		tooth = "General"
	}
	diagnosis := strings.TrimSpace(in.Diagnosis)
	if diagnosis == "" {
		return nil, errors.New("diagnosis is required")
	}
	severity := strings.ToUpper(strings.TrimSpace(in.Severity))
	switch severity {
	case "LOW", "MEDIUM", "HIGH":
	default:
		severity = "MEDIUM"
	}
	code := strings.ToUpper(strings.TrimSpace(in.PathologyCode))
	if code == "" {
		code = "GENERAL"
	}
	surfaces := in.Surfaces
	if surfaces == nil {
		surfaces = []string{}
	}
	surfJSON, err := json.Marshal(surfaces)
	if err != nil {
		return nil, err
	}

	var f ClinicalFinding
	var surfOut []byte
	err = tx.QueryRow(ctx, `
		WITH inserted AS (
			INSERT INTO clinical_findings (
				tenant_id, patient_id, doctor_id, tooth_number, surfaces,
				pathology_code, diagnosis, severity, status, notes
			) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'OPEN', $9)
			RETURNING id, tenant_id, patient_id, doctor_id, tooth_number, surfaces,
			          pathology_code, diagnosis, severity, status, notes, created_at, updated_at
		)
		SELECT i.id, i.tenant_id, i.patient_id, i.doctor_id, COALESCE(u.full_name, ''),
		       i.tooth_number, i.surfaces, i.pathology_code, i.diagnosis,
		       i.severity, i.status, i.notes, i.created_at, i.updated_at
		FROM inserted i
		LEFT JOIN users u ON u.id = i.doctor_id
	`, tenantID, patientID, doctorID, tooth, string(surfJSON), code, diagnosis, severity, strings.TrimSpace(in.Notes)).Scan(
		&f.ID, &f.TenantID, &f.PatientID, &f.DoctorID, &f.DoctorName,
		&f.ToothNumber, &surfOut, &f.PathologyCode, &f.Diagnosis,
		&f.Severity, &f.Status, &f.Notes, &f.CreatedAt, &f.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(surfOut, &f.Surfaces)
	if f.Surfaces == nil {
		f.Surfaces = []string{}
	}

	// Automatically append the clinical finding to the patient's clinical history (clinical_records)
	historyContent := FormatFindingCreatedHistoryContent(f.ToothNumber, f.Surfaces, f.Diagnosis, f.Notes)
	_, _ = tx.Exec(ctx, `
		INSERT INTO clinical_records (tenant_id, patient_id, doctor_id, entry_type, content, attachments)
		VALUES ($1, $2, $3, 'DIAGNOSIS', $4, '[]'::jsonb)
	`, tenantID, patientID, doctorID, historyContent)

	return &f, nil
}

func (s *Store) UpdatePatientFindingStatus(ctx context.Context, tx pgx.Tx, tenantID, findingID, status, notes string, actorDoctorID ...string) (*ClinicalFinding, error) {
	if err := ValidateFindingStatusUpdate(status, notes); err != nil {
		return nil, err
	}
	st := strings.ToUpper(strings.TrimSpace(status))

	var f ClinicalFinding
	var surfOut []byte
	err := tx.QueryRow(ctx, `
		WITH updated AS (
			UPDATE clinical_findings
			SET status = $3,
			    notes = CASE WHEN $4 <> '' THEN $4 ELSE notes END
			WHERE id = $1 AND tenant_id = $2
			RETURNING id, tenant_id, patient_id, doctor_id, tooth_number, surfaces,
			          pathology_code, diagnosis, severity, status, notes, created_at, updated_at
		)
		SELECT u.id, u.tenant_id, u.patient_id, u.doctor_id, COALESCE(usr.full_name, ''),
		       u.tooth_number, u.surfaces, u.pathology_code, u.diagnosis,
		       u.severity, u.status, u.notes, u.created_at, u.updated_at
		FROM updated u
		LEFT JOIN users usr ON usr.id = u.doctor_id
	`, findingID, tenantID, st, strings.TrimSpace(notes)).Scan(
		&f.ID, &f.TenantID, &f.PatientID, &f.DoctorID, &f.DoctorName,
		&f.ToothNumber, &surfOut, &f.PathologyCode, &f.Diagnosis,
		&f.Severity, &f.Status, &f.Notes, &f.CreatedAt, &f.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(surfOut, &f.Surfaces)

	// When cancelling a finding (DISCARDED), append the mandatory clinical note to the patient's clinical history
	if st == "DISCARDED" {
		docID := f.DoctorID
		if len(actorDoctorID) > 0 && strings.TrimSpace(actorDoctorID[0]) != "" {
			docID = strings.TrimSpace(actorDoctorID[0])
		}
		cancelContent := FormatFindingCancelledHistoryContent(f.ToothNumber, f.Diagnosis, notes)
		_, _ = tx.Exec(ctx, `
			INSERT INTO clinical_records (tenant_id, patient_id, doctor_id, entry_type, content, attachments)
			VALUES ($1, $2, $3, 'NOTE', $4, '[]'::jsonb)
		`, tenantID, f.PatientID, docID, cancelContent)
	}

	return &f, nil
}

func (s *Store) ListPatientBudgets(ctx context.Context, tx pgx.Tx, tenantID, patientID string, onlyOpen bool) ([]PatientBudget, error) {
	query := `
		SELECT b.id, b.tenant_id, b.patient_id, b.doctor_id, COALESCE(u.full_name, ''),
		       b.series, b.budget_number, b.title, b.issue_date, b.validity_days, b.valid_until,
		       b.status, b.findings_blocks, b.min_estimate_amount, b.max_estimate_amount,
		       b.accepted_amount, b.notes, b.invoice_id, b.created_at, b.updated_at
		FROM patient_budgets b
		LEFT JOIN users u ON u.id = b.doctor_id
		WHERE b.tenant_id = $1 AND b.patient_id = $2
	`
	if onlyOpen {
		query += ` AND b.status NOT IN ('INVOICED', 'REJECTED')`
	}
	query += ` ORDER BY b.budget_number DESC`

	rows, err := tx.Query(ctx, query, tenantID, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []PatientBudget{}
	for rows.Next() {
		var b PatientBudget
		var blocksJSON []byte
		if err := rows.Scan(
			&b.ID, &b.TenantID, &b.PatientID, &b.DoctorID, &b.DoctorName,
			&b.Series, &b.BudgetNumber, &b.Title, &b.IssueDate, &b.ValidityDays, &b.ValidUntil,
			&b.Status, &blocksJSON, &b.MinEstimateAmount, &b.MaxEstimateAmount,
			&b.AcceptedAmount, &b.Notes, &b.InvoiceID, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(blocksJSON, &b.FindingsBlocks)
		if b.FindingsBlocks == nil {
			b.FindingsBlocks = []BudgetFindingBlock{}
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (s *Store) CreatePatientBudget(ctx context.Context, tx pgx.Tx, tenantID, patientID, doctorID string, in CreateBudgetInput) (*PatientBudget, error) {
	if len(in.FindingsBlocks) == 0 {
		return nil, errors.New("findings_blocks must have at least one finding with treatment options")
	}
	series := strings.ToUpper(strings.TrimSpace(in.Series))
	if series == "" {
		series = "PRE"
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		title = "Plan de Tratamiento Odontológico"
	}
	validityDays := in.ValidityDays
	if validityDays <= 0 {
		validityDays = 30
	}
	status := strings.ToUpper(strings.TrimSpace(in.Status))
	switch status {
	case "DRAFT", "PRESENTED", "ACCEPTED", "PARTIAL":
	default:
		status = "PRESENTED"
	}

	issueDate := time.Now().UTC()
	validUntil := ComputeValidUntil(issueDate, validityDays)
	normalizedBlocks, minEst, maxEst, acceptedAmt := NormalizeAndComputeBudgetBlocks(in.FindingsBlocks)
	blocksJSON, err := json.Marshal(normalizedBlocks)
	if err != nil {
		return nil, err
	}

	var nextNum int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(budget_number), 0) + 1
		FROM patient_budgets
		WHERE tenant_id = $1 AND series = $2
	`, tenantID, series).Scan(&nextNum); err != nil {
		return nil, err
	}

	var b PatientBudget
	var rawBlocks []byte
	err = tx.QueryRow(ctx, `
		WITH inserted AS (
			INSERT INTO patient_budgets (
				tenant_id, patient_id, doctor_id, series, budget_number, title,
				issue_date, validity_days, valid_until, status, findings_blocks,
				min_estimate_amount, max_estimate_amount, accepted_amount, notes
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)
			RETURNING id, tenant_id, patient_id, doctor_id, series, budget_number, title,
			          issue_date, validity_days, valid_until, status, findings_blocks,
			          min_estimate_amount, max_estimate_amount, accepted_amount, notes, invoice_id, created_at, updated_at
		)
		SELECT i.id, i.tenant_id, i.patient_id, i.doctor_id, COALESCE(u.full_name, ''),
		       i.series, i.budget_number, i.title, i.issue_date, i.validity_days, i.valid_until,
		       i.status, i.findings_blocks, i.min_estimate_amount, i.max_estimate_amount,
		       i.accepted_amount, i.notes, i.invoice_id, i.created_at, i.updated_at
		FROM inserted i
		LEFT JOIN users u ON u.id = i.doctor_id
	`, tenantID, patientID, doctorID, series, nextNum, title,
		issueDate.Format("2006-01-02"), validityDays, validUntil.Format("2006-01-02"),
		status, string(blocksJSON), minEst, maxEst, acceptedAmt, strings.TrimSpace(in.Notes)).Scan(
		&b.ID, &b.TenantID, &b.PatientID, &b.DoctorID, &b.DoctorName,
		&b.Series, &b.BudgetNumber, &b.Title, &b.IssueDate, &b.ValidityDays, &b.ValidUntil,
		&b.Status, &rawBlocks, &b.MinEstimateAmount, &b.MaxEstimateAmount,
		&b.AcceptedAmount, &b.Notes, &b.InvoiceID, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(rawBlocks, &b.FindingsBlocks)

	// Mark referenced OPEN/IN_BUDGET clinical findings according to the new budget's options
	for _, blk := range normalizedBlocks {
		if blk.FindingID != "" {
			nextFindSt := ResolveFindingStatusAfterBudgetChange("IN_BUDGET", blk)
			_, _ = tx.Exec(ctx, `
				UPDATE clinical_findings
				SET status = $3
				WHERE id = $1::uuid AND tenant_id = $2 AND status NOT IN ('INVOICED', 'DISCARDED')
			`, blk.FindingID, tenantID, nextFindSt)
		}
	}

	return &b, nil
}

func (s *Store) UpdateBudgetOptionResponse(
	ctx context.Context,
	tx pgx.Tx,
	tenantID, budgetID, findingID, optionID, response, notes string,
) (*PatientBudget, error) {
	var currentBlocksRaw []byte
	var currentStatus string
	err := tx.QueryRow(ctx, `
		SELECT findings_blocks, status
		FROM patient_budgets
		WHERE id = $1 AND tenant_id = $2
	`, budgetID, tenantID).Scan(&currentBlocksRaw, &currentStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if currentStatus == "INVOICED" {
		return nil, errors.New("cannot modify options of an already invoiced budget")
	}

	var currentBlocks []BudgetFindingBlock
	if err := json.Unmarshal(currentBlocksRaw, &currentBlocks); err != nil {
		return nil, err
	}

	updatedBlocks, nextStatus, err := ApplyBudgetOptionResponse(currentBlocks, findingID, optionID, response, notes, time.Now().UTC())
	if err != nil {
		return nil, err
	}
	normalizedBlocks, minEst, maxEst, acceptedAmt := NormalizeAndComputeBudgetBlocks(updatedBlocks)
	blocksJSON, err := json.Marshal(normalizedBlocks)
	if err != nil {
		return nil, err
	}

	var b PatientBudget
	var rawOut []byte
	err = tx.QueryRow(ctx, `
		WITH updated AS (
			UPDATE patient_budgets
			SET findings_blocks = $3::jsonb,
			    status = $4,
			    min_estimate_amount = $5,
			    max_estimate_amount = $6,
			    accepted_amount = $7
			WHERE id = $1 AND tenant_id = $2
			RETURNING id, tenant_id, patient_id, doctor_id, series, budget_number, title,
			          issue_date, validity_days, valid_until, status, findings_blocks,
			          min_estimate_amount, max_estimate_amount, accepted_amount, notes, invoice_id, created_at, updated_at
		)
		SELECT u.id, u.tenant_id, u.patient_id, u.doctor_id, COALESCE(usr.full_name, ''),
		       u.series, u.budget_number, u.title, u.issue_date, u.validity_days, u.valid_until,
		       u.status, u.findings_blocks, u.min_estimate_amount, u.max_estimate_amount,
		       u.accepted_amount, u.notes, u.invoice_id, u.created_at, u.updated_at
		FROM updated u
		LEFT JOIN users usr ON usr.id = u.doctor_id
	`, budgetID, tenantID, string(blocksJSON), nextStatus, minEst, maxEst, acceptedAmt).Scan(
		&b.ID, &b.TenantID, &b.PatientID, &b.DoctorID, &b.DoctorName,
		&b.Series, &b.BudgetNumber, &b.Title, &b.IssueDate, &b.ValidityDays, &b.ValidUntil,
		&b.Status, &rawOut, &b.MinEstimateAmount, &b.MaxEstimateAmount,
		&b.AcceptedAmount, &b.Notes, &b.InvoiceID, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(rawOut, &b.FindingsBlocks)

	// Sync linked clinical_finding status based on options for that finding.
	// IMPORTANT: When all options in a budget are rejected, the finding returns to 'OPEN' (not 'DISCARDED').
	for _, blk := range normalizedBlocks {
		if blk.FindingID == findingID {
			findingNextStatus := ResolveFindingStatusAfterBudgetChange("IN_BUDGET", blk)
			_, _ = tx.Exec(ctx, `
				UPDATE clinical_findings
				SET status = $3
				WHERE id = $1::uuid AND tenant_id = $2 AND status NOT IN ('INVOICED', 'DISCARDED')
			`, findingID, tenantID, findingNextStatus)
		}
	}

	return &b, nil
}

func (s *Store) UpdateBudgetStatus(ctx context.Context, tx pgx.Tx, tenantID, budgetID, status string, validityDays *int) (*PatientBudget, error) {
	st := strings.ToUpper(strings.TrimSpace(status))
	switch st {
	case "DRAFT", "PRESENTED", "ACCEPTED", "PARTIAL", "REJECTED", "EXPIRED":
	default:
		return nil, errors.New("invalid budget status")
	}

	var b PatientBudget
	var rawOut []byte
	var err error
	if validityDays != nil && *validityDays > 0 {
		validUntil := ComputeValidUntil(time.Now().UTC(), *validityDays)
		err = tx.QueryRow(ctx, `
			WITH updated AS (
				UPDATE patient_budgets
				SET status = $3,
				    validity_days = $4,
				    valid_until = $5
				WHERE id = $1 AND tenant_id = $2
				RETURNING id, tenant_id, patient_id, doctor_id, series, budget_number, title,
				          issue_date, validity_days, valid_until, status, findings_blocks,
				          min_estimate_amount, max_estimate_amount, accepted_amount, notes, invoice_id, created_at, updated_at
			)
			SELECT u.id, u.tenant_id, u.patient_id, u.doctor_id, COALESCE(usr.full_name, ''),
			       u.series, u.budget_number, u.title, u.issue_date, u.validity_days, u.valid_until,
			       u.status, u.findings_blocks, u.min_estimate_amount, u.max_estimate_amount,
			       u.accepted_amount, u.notes, u.invoice_id, u.created_at, u.updated_at
			FROM updated u
			LEFT JOIN users usr ON usr.id = u.doctor_id
		`, budgetID, tenantID, st, *validityDays, validUntil.Format("2006-01-02")).Scan(
			&b.ID, &b.TenantID, &b.PatientID, &b.DoctorID, &b.DoctorName,
			&b.Series, &b.BudgetNumber, &b.Title, &b.IssueDate, &b.ValidityDays, &b.ValidUntil,
			&b.Status, &rawOut, &b.MinEstimateAmount, &b.MaxEstimateAmount,
			&b.AcceptedAmount, &b.Notes, &b.InvoiceID, &b.CreatedAt, &b.UpdatedAt,
		)
	} else {
		err = tx.QueryRow(ctx, `
			WITH updated AS (
				UPDATE patient_budgets
				SET status = $3
				WHERE id = $1 AND tenant_id = $2
				RETURNING id, tenant_id, patient_id, doctor_id, series, budget_number, title,
				          issue_date, validity_days, valid_until, status, findings_blocks,
				          min_estimate_amount, max_estimate_amount, accepted_amount, notes, invoice_id, created_at, updated_at
			)
			SELECT u.id, u.tenant_id, u.patient_id, u.doctor_id, COALESCE(usr.full_name, ''),
			       u.series, u.budget_number, u.title, u.issue_date, u.validity_days, u.valid_until,
			       u.status, u.findings_blocks, u.min_estimate_amount, u.max_estimate_amount,
			       u.accepted_amount, u.notes, u.invoice_id, u.created_at, u.updated_at
			FROM updated u
			LEFT JOIN users usr ON usr.id = u.doctor_id
		`, budgetID, tenantID, st).Scan(
			&b.ID, &b.TenantID, &b.PatientID, &b.DoctorID, &b.DoctorName,
			&b.Series, &b.BudgetNumber, &b.Title, &b.IssueDate, &b.ValidityDays, &b.ValidUntil,
			&b.Status, &rawOut, &b.MinEstimateAmount, &b.MaxEstimateAmount,
			&b.AcceptedAmount, &b.Notes, &b.InvoiceID, &b.CreatedAt, &b.UpdatedAt,
		)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(rawOut, &b.FindingsBlocks)

	// When an entire budget is REJECTED or EXPIRED, any referenced findings return to 'OPEN'
	// (never 'DISCARDED') so they can be budgeted again in a subsequent budget.
	if st == "REJECTED" || st == "EXPIRED" {
		for _, blk := range b.FindingsBlocks {
			if blk.FindingID != "" {
				_, _ = tx.Exec(ctx, `
					UPDATE clinical_findings
					SET status = 'OPEN'
					WHERE id = $1::uuid AND tenant_id = $2 AND status NOT IN ('INVOICED', 'DISCARDED')
				`, blk.FindingID, tenantID)
			}
		}
	}

	return &b, nil
}

func (s *Store) ConvertBudgetToInvoice(ctx context.Context, tx pgx.Tx, tenantID, budgetID, invoiceSeries string) (*PatientBudget, *Invoice, error) {
	var patientID string
	var blocksRaw []byte
	var currentStatus string
	err := tx.QueryRow(ctx, `
		SELECT patient_id, findings_blocks, status
		FROM patient_budgets
		WHERE id = $1 AND tenant_id = $2
	`, budgetID, tenantID).Scan(&patientID, &blocksRaw, &currentStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, ErrNotFound
	}
	if err != nil {
		return nil, nil, err
	}
	if currentStatus == "INVOICED" {
		return nil, nil, errors.New("budget is already invoiced")
	}

	var blocks []BudgetFindingBlock
	if err := json.Unmarshal(blocksRaw, &blocks); err != nil {
		return nil, nil, err
	}

	items := ExtractAcceptedInvoiceItems(blocks)
	if len(items) == 0 {
		return nil, nil, errors.New("no accepted treatment options to invoice")
	}

	if invoiceSeries == "" {
		invoiceSeries = "FAC"
	}
	inv, err := s.CreateInvoice(ctx, tx, tenantID, patientID, CreateInvoiceInput{
		Series: invoiceSeries,
		Status: "ISSUED",
		Items:  items,
	})
	if err != nil {
		return nil, nil, err
	}

	var b PatientBudget
	var rawOut []byte
	err = tx.QueryRow(ctx, `
		WITH updated AS (
			UPDATE patient_budgets
			SET status = 'INVOICED',
			    invoice_id = $3
			WHERE id = $1 AND tenant_id = $2
			RETURNING id, tenant_id, patient_id, doctor_id, series, budget_number, title,
			          issue_date, validity_days, valid_until, status, findings_blocks,
			          min_estimate_amount, max_estimate_amount, accepted_amount, notes, invoice_id, created_at, updated_at
		)
		SELECT u.id, u.tenant_id, u.patient_id, u.doctor_id, COALESCE(usr.full_name, ''),
		       u.series, u.budget_number, u.title, u.issue_date, u.validity_days, u.valid_until,
		       u.status, u.findings_blocks, u.min_estimate_amount, u.max_estimate_amount,
		       u.accepted_amount, u.notes, u.invoice_id, u.created_at, u.updated_at
		FROM updated u
		LEFT JOIN users usr ON usr.id = u.doctor_id
	`, budgetID, tenantID, inv.ID).Scan(
		&b.ID, &b.TenantID, &b.PatientID, &b.DoctorID, &b.DoctorName,
		&b.Series, &b.BudgetNumber, &b.Title, &b.IssueDate, &b.ValidityDays, &b.ValidUntil,
		&b.Status, &rawOut, &b.MinEstimateAmount, &b.MaxEstimateAmount,
		&b.AcceptedAmount, &b.Notes, &b.InvoiceID, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, nil, err
	}
	_ = json.Unmarshal(rawOut, &b.FindingsBlocks)

	// Mark findings that had an accepted option as INVOICED (closed)
	for _, blk := range blocks {
		if blk.FindingID == "" {
			continue
		}
		for _, opt := range blk.Options {
			if opt.PatientResponse == "ACCEPTED" {
				_, _ = tx.Exec(ctx, `
					UPDATE clinical_findings
					SET status = 'INVOICED'
					WHERE id = $1::uuid AND tenant_id = $2
				`, blk.FindingID, tenantID)
				break
			}
		}
	}

	return &b, inv, nil
}
