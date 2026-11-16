package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/go-chi/chi/v5"
)

func (s *Server) handleListStaffAbsences(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	q := r.URL.Query()

	status := strings.ToUpper(strings.TrimSpace(q.Get("status")))
	userID := strings.TrimSpace(q.Get("user_id"))
	startDate := strings.TrimSpace(q.Get("start_date"))
	endDate := strings.TrimSpace(q.Get("end_date"))

	absences, err := s.store.ListStaffAbsences(r.Context(), tx, claims.TenantID, status, userID, startDate, endDate)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list absences", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"absences": absences})
}

func (s *Server) handleCreateStaffAbsence(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	var req struct {
		UserID      string `json:"user_id"`
		AbsenceType string `json:"absence_type"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Notes       string `json:"notes"`
		AutoApprove *bool  `json:"auto_approve"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}

	targetUserID := strings.TrimSpace(req.UserID)
	if targetUserID == "" {
		targetUserID = claims.Subject
	}

	settings, err := s.store.GetClinicBudgetSettings(r.Context(), tx, claims.TenantID)
	autoApprove := false
	if err == nil && settings.AutoApproveAbsences {
		autoApprove = true
	}
	if req.AutoApprove != nil && (claims.Role == "OWNER" || claims.Role == "ADMIN") {
		autoApprove = *req.AutoApprove
	}

	absence, err := s.store.CreateStaffAbsence(r.Context(), tx, claims.TenantID, targetUserID, req.AbsenceType, req.StartDate, req.EndDate, req.Notes, autoApprove)
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", err.Error(), nil)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"absence": absence})
}

func (s *Server) handleUpdateStaffAbsenceStatus(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}

	absence, err := s.store.UpdateStaffAbsenceStatus(r.Context(), tx, claims.TenantID, id, req.Status)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "absence not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", err.Error(), nil)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"absence": absence})
}
