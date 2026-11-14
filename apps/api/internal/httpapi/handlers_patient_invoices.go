package httpapi

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListPatientInvoices(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	if patientID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient id is required", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	invoices, err := s.store.ListPatientInvoices(r.Context(), tx, claims.TenantID, patientID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list patient invoices", nil)
		return
	}
	if invoices == nil {
		invoices = []store.Invoice{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"invoices": invoices})
}

func (s *Server) handleCreatePatientInvoice(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	if patientID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient id is required", nil)
		return
	}
	var in store.CreateInvoiceInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if len(in.Items) == 0 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "invoice must have at least one item", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	inv, err := s.store.CreateInvoice(r.Context(), tx, claims.TenantID, patientID, in)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create invoice", nil)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"invoice": inv})
}

func (s *Server) handleRecordInvoicePayment(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "id")
	if invoiceID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "invoice id is required", nil)
		return
	}
	var req struct {
		Amount               float64 `json:"amount"`
		PaymentMethod        string  `json:"payment_method"`
		TransactionReference string  `json:"transaction_reference"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	req.PaymentMethod = strings.ToUpper(strings.TrimSpace(req.PaymentMethod))
	if req.Amount <= 0 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "amount must be greater than 0", nil)
		return
	}
	switch req.PaymentMethod {
	case "CASH", "CARD", "TRANSFER", "FINANCING":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid payment_method (must be CASH, CARD, TRANSFER, FINANCING)", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	payment, err := s.store.RecordPayment(r.Context(), tx, claims.TenantID, invoiceID, req.Amount, req.PaymentMethod, req.TransactionReference)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not record payment", nil)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"payment": payment})
}
