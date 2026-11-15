package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListPatientFindings(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	if patientID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient id is required", nil)
		return
	}
	onlyOpen := r.URL.Query().Get("open") == "true"
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	findings, err := s.store.ListPatientFindings(r.Context(), tx, claims.TenantID, patientID, onlyOpen)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list clinical findings", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"findings": findings})
}

func (s *Server) handleCreatePatientFinding(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	if patientID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient id is required", nil)
		return
	}
	var in store.CreateFindingInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if strings.TrimSpace(in.Diagnosis) == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "diagnosis is required", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	finding, err := s.store.CreatePatientFinding(r.Context(), tx, claims.TenantID, patientID, claims.Subject, in)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create clinical finding", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"finding": finding})
}

func (s *Server) handleUpdateFindingStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if err := store.ValidateFindingStatusUpdate(req.Status, req.Notes); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", err.Error(), nil)
		return
	}
	findingID := chi.URLParam(r, "id")
	if findingID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "finding id is required", nil)
		return
	}
	st := strings.ToUpper(strings.TrimSpace(req.Status))

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	finding, err := s.store.UpdatePatientFindingStatus(r.Context(), tx, claims.TenantID, findingID, st, req.Notes, claims.Subject)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "finding not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update finding status", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"finding": finding})
}

func (s *Server) handleListPatientBudgets(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	if patientID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient id is required", nil)
		return
	}
	onlyOpen := r.URL.Query().Get("open") == "true"
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	budgets, err := s.store.ListPatientBudgets(r.Context(), tx, claims.TenantID, patientID, onlyOpen)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list patient budgets", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"budgets": budgets})
}

func (s *Server) handleCreatePatientBudget(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	if patientID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient id is required", nil)
		return
	}
	var in store.CreateBudgetInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if len(in.FindingsBlocks) == 0 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "budget must include at least one finding block with treatment options", nil)
		return
	}
	for _, blk := range in.FindingsBlocks {
		if len(blk.Options) == 0 {
			writeError(w, http.StatusBadRequest, "VALIDATION", "each finding block must include at least one treatment option", nil)
			return
		}
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	budget, err := s.store.CreatePatientBudget(r.Context(), tx, claims.TenantID, patientID, claims.Subject, in)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create patient budget", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"budget": budget})
}

func (s *Server) handleUpdateBudgetOptionResponse(w http.ResponseWriter, r *http.Request) {
	budgetID := chi.URLParam(r, "id")
	if budgetID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "budget id is required", nil)
		return
	}
	var req struct {
		FindingID       string `json:"finding_id"`
		OptionID        string `json:"option_id"`
		PatientResponse string `json:"patient_response"`
		Notes           string `json:"notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	resp := strings.ToUpper(strings.TrimSpace(req.PatientResponse))
	switch resp {
	case "PENDING", "ACCEPTED", "REJECTED":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient_response must be PENDING, ACCEPTED or REJECTED", nil)
		return
	}
	if strings.TrimSpace(req.FindingID) == "" || strings.TrimSpace(req.OptionID) == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "finding_id and option_id are required", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	budget, err := s.store.UpdateBudgetOptionResponse(r.Context(), tx, claims.TenantID, budgetID, req.FindingID, req.OptionID, resp, req.Notes)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "budget or option not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"budget": budget})
}

func (s *Server) handleUpdateBudgetStatus(w http.ResponseWriter, r *http.Request) {
	budgetID := chi.URLParam(r, "id")
	if budgetID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "budget id is required", nil)
		return
	}
	var req struct {
		Status       string `json:"status"`
		ValidityDays *int   `json:"validity_days,omitempty"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	st := strings.ToUpper(strings.TrimSpace(req.Status))
	switch st {
	case "DRAFT", "PRESENTED", "ACCEPTED", "PARTIAL", "REJECTED", "EXPIRED":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid budget status", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	budget, err := s.store.UpdateBudgetStatus(r.Context(), tx, claims.TenantID, budgetID, st, req.ValidityDays)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "budget not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update budget status", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"budget": budget})
}

func (s *Server) handleConvertBudgetToInvoice(w http.ResponseWriter, r *http.Request) {
	budgetID := chi.URLParam(r, "id")
	if budgetID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "budget id is required", nil)
		return
	}
	var req struct {
		Series string `json:"series"`
	}
	_ = decodeJSON(r, &req)

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	budget, invoice, err := s.store.ConvertBudgetToInvoice(r.Context(), tx, claims.TenantID, budgetID, strings.ToUpper(strings.TrimSpace(req.Series)))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "budget not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"budget":  budget,
		"invoice": invoice,
	})
}
