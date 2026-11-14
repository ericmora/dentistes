package store

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type InvoiceItem struct {
	ID             string  `json:"id"`
	Description    string  `json:"description"`
	ToothNumber    string  `json:"tooth_number,omitempty"`
	Quantity       int     `json:"quantity"`
	UnitPriceCents int64   `json:"unit_price_cents"`
	TaxRatePercent float64 `json:"tax_rate_percent"`
}

type Invoice struct {
	ID               string        `json:"id"`
	TenantID         string        `json:"tenant_id,omitempty"`
	PatientID        string        `json:"patient_id"`
	Series           string        `json:"series"`
	InvoiceNumber    int           `json:"invoice_number"`
	IssueDate        time.Time     `json:"issue_date"`
	DueDate          *time.Time    `json:"due_date,omitempty"`
	Subtotal         float64       `json:"subtotal"`
	TaxAmount        float64       `json:"tax_amount"`
	TotalAmount      float64       `json:"total_amount"`
	PaidAmount       float64       `json:"paid_amount"`
	Status           string        `json:"status"`
	VerificationHash string        `json:"verification_hash"`
	Items            []InvoiceItem `json:"items"`
	Payments         []Payment     `json:"payments,omitempty"`
	CreatedAt        time.Time     `json:"created_at"`
}

type Payment struct {
	ID                   string    `json:"id"`
	TenantID             string    `json:"tenant_id,omitempty"`
	InvoiceID            string    `json:"invoice_id"`
	Amount               float64   `json:"amount"`
	PaymentMethod        string    `json:"payment_method"`
	TransactionReference string    `json:"transaction_reference,omitempty"`
	CreatedAt            time.Time `json:"created_at"`
}

type CreateInvoiceInput struct {
	Series    string        `json:"series"`
	IssueDate *time.Time    `json:"issue_date,omitempty"`
	DueDate   *time.Time    `json:"due_date,omitempty"`
	Status    string        `json:"status,omitempty"`
	Items     []InvoiceItem `json:"items"`
}

func ComputeVerificationHash(tenantID, series string, invoiceNumber int, total float64, date time.Time) string {
	payload := fmt.Sprintf("%s|%s|%d|%.2f|%s", tenantID, series, invoiceNumber, total, date.Format("2006-01-02"))
	sum := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(sum[:])
}

func (s *Store) CreateInvoice(ctx context.Context, tx pgx.Tx, tenantID, patientID string, in CreateInvoiceInput) (*Invoice, error) {
	if patientID == "" {
		return nil, errors.New("patient_id is required")
	}
	series := in.Series
	if series == "" {
		series = "FAC"
	}
	status := in.Status
	if status == "" {
		status = "ISSUED"
	}

	issueDate := time.Now().UTC()
	if in.IssueDate != nil {
		issueDate = *in.IssueDate
	}

	// Calculate totals
	var subtotal float64
	var taxAmount float64
	for _, item := range in.Items {
		itemSub := float64(item.Quantity) * (float64(item.UnitPriceCents) / 100.0)
		subtotal += itemSub
		taxAmount += (itemSub * item.TaxRatePercent) / 100.0
	}
	totalAmount := subtotal + taxAmount

	// Next sequential invoice number for series and tenant
	var nextNum int
	err := tx.QueryRow(ctx, `
		SELECT coalesce(max(invoice_number), 0) + 1
		FROM invoices
		WHERE tenant_id = $1 AND series = $2
	`, tenantID, series).Scan(&nextNum)
	if err != nil {
		return nil, fmt.Errorf("next invoice number: %w", err)
	}

	verificationHash := ComputeVerificationHash(tenantID, series, nextNum, totalAmount, issueDate)
	itemsJSON, err := json.Marshal(in.Items)
	if err != nil {
		return nil, fmt.Errorf("marshal items: %w", err)
	}

	var inv Invoice
	var issueDateDB time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO invoices (
			tenant_id, patient_id, series, invoice_number, issue_date, due_date,
			subtotal, tax_amount, total_amount, paid_amount, status,
			verification_hash, items
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0.00, $10, $11, $12)
		RETURNING id, tenant_id, patient_id, series, invoice_number, issue_date, due_date,
		          subtotal, tax_amount, total_amount, paid_amount, status,
		          verification_hash, items, created_at
	`, tenantID, patientID, series, nextNum, issueDate.Format("2006-01-02"), in.DueDate,
		subtotal, taxAmount, totalAmount, status, verificationHash, itemsJSON).Scan(
		&inv.ID, &inv.TenantID, &inv.PatientID, &inv.Series, &inv.InvoiceNumber,
		&issueDateDB, &inv.DueDate, &inv.Subtotal, &inv.TaxAmount, &inv.TotalAmount,
		&inv.PaidAmount, &inv.Status, &inv.VerificationHash, &itemsJSON, &inv.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert invoice: %w", err)
	}
	inv.IssueDate = issueDateDB
	_ = json.Unmarshal(itemsJSON, &inv.Items)
	return &inv, nil
}

func (s *Store) ListPatientInvoices(ctx context.Context, tx pgx.Tx, tenantID, patientID string) ([]Invoice, error) {
	rows, err := tx.Query(ctx, `
		SELECT id, tenant_id, patient_id, series, invoice_number, issue_date, due_date,
		       subtotal, tax_amount, total_amount, paid_amount, status,
		       verification_hash, items, created_at
		FROM invoices
		WHERE tenant_id = $1 AND patient_id = $2
		ORDER BY invoice_number DESC
	`, tenantID, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var inv Invoice
		var itemsJSON []byte
		var issueDateDB time.Time
		if err := rows.Scan(
			&inv.ID, &inv.TenantID, &inv.PatientID, &inv.Series, &inv.InvoiceNumber,
			&issueDateDB, &inv.DueDate, &inv.Subtotal, &inv.TaxAmount, &inv.TotalAmount,
			&inv.PaidAmount, &inv.Status, &inv.VerificationHash, &itemsJSON, &inv.CreatedAt,
		); err != nil {
			return nil, err
		}
		inv.IssueDate = issueDateDB
		_ = json.Unmarshal(itemsJSON, &inv.Items)
		invoices = append(invoices, inv)
	}
	return invoices, nil
}

func (s *Store) RecordPayment(ctx context.Context, tx pgx.Tx, tenantID, invoiceID string, amount float64, method, ref string) (*Payment, error) {
	if amount <= 0 {
		return nil, errors.New("amount must be greater than 0")
	}

	var p Payment
	err := tx.QueryRow(ctx, `
		INSERT INTO payments (tenant_id, invoice_id, amount, payment_method, transaction_reference)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, tenant_id, invoice_id, amount, payment_method, transaction_reference, created_at
	`, tenantID, invoiceID, amount, method, ref).Scan(
		&p.ID, &p.TenantID, &p.InvoiceID, &p.Amount, &p.PaymentMethod, &p.TransactionReference, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert payment: %w", err)
	}

	// Update paid_amount and status on invoice
	_, err = tx.Exec(ctx, `
		UPDATE invoices
		SET paid_amount = paid_amount + $1,
		    status = CASE
		        WHEN paid_amount + $1 >= total_amount THEN 'PAID'
		        ELSE 'PARTIAL'
		    END
		WHERE id = $2 AND tenant_id = $3
	`, amount, invoiceID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("update invoice paid amount: %w", err)
	}

	return &p, nil
}
