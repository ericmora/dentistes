package httpapi

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListWaitingList(w http.ResponseWriter, r *http.Request) {
	status := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("status")))
	tx := txFrom(r.Context())
	entries, err := s.store.ListWaitingList(r.Context(), tx, status)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entries": entries})
}

func (s *Server) handleCreateWaitingListEntry(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PatientID                string  `json:"patient_id"`
		DoctorID                 *string `json:"doctor_id"`
		TreatmentType            string  `json:"treatment_type"`
		EstimatedDurationMinutes int     `json:"estimated_duration_minutes"`
		PreferredTimeSlot        string  `json:"preferred_time_slot"`
		PreferredDays            []int32 `json:"preferred_days"`
		UrgencyLevel             string  `json:"urgency_level"`
		Notes                    string  `json:"notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	req.TreatmentType = strings.TrimSpace(req.TreatmentType)
	if req.PatientID == "" || req.TreatmentType == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient_id and treatment_type are required", nil)
		return
	}
	if req.EstimatedDurationMinutes <= 0 {
		req.EstimatedDurationMinutes = 30
	}
	slot := strings.ToUpper(strings.TrimSpace(req.PreferredTimeSlot))
	if slot == "" {
		slot = "ANY"
	}
	switch slot {
	case "ANY", "MORNING", "AFTERNOON":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "preferred_time_slot must be ANY, MORNING or AFTERNOON", nil)
		return
	}
	urgency := strings.ToUpper(strings.TrimSpace(req.UrgencyLevel))
	if urgency == "" {
		urgency = "NORMAL"
	}
	switch urgency {
	case "LOW", "NORMAL", "HIGH", "URGENT":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "urgency_level must be LOW, NORMAL, HIGH or URGENT", nil)
		return
	}
	days := req.PreferredDays
	if len(days) == 0 {
		days = []int32{1, 2, 3, 4, 5}
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	entry, err := s.store.CreateWaitingListEntry(r.Context(), tx, claims.TenantID, store.NewWaitingListEntry{
		PatientID:                req.PatientID,
		DoctorID:                 req.DoctorID,
		TreatmentType:            req.TreatmentType,
		EstimatedDurationMinutes: req.EstimatedDurationMinutes,
		PreferredTimeSlot:        slot,
		PreferredDays:            days,
		UrgencyLevel:             urgency,
		Notes:                    strings.TrimSpace(req.Notes),
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create waiting list entry", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"entry": entry})
}

func (s *Server) handleMatchWaitingList(w http.ResponseWriter, r *http.Request) {
	start, err := time.Parse(time.RFC3339, r.URL.Query().Get("start"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "start must be RFC3339", nil)
		return
	}
	end, err := time.Parse(time.RFC3339, r.URL.Query().Get("end"))
	if err != nil || !end.After(start) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "end must be RFC3339 after start", nil)
		return
	}
	limit := intQuery(r, "limit", 5)
	tx := txFrom(r.Context())
	matches, err := s.store.FindMatchingWaitingCandidates(r.Context(), tx, start, end, r.URL.Query().Get("doctor_id"), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"matches": matches})
}

func (s *Server) handleHoldWaitingListEntry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tx := txFrom(r.Context())
	entry, err := s.store.HoldWaitingListEntry(r.Context(), tx, id, 15)
	if errors.Is(err, store.ErrConflictState) {
		writeError(w, http.StatusConflict, "HOLD_CONFLICT", "waiting list entry is already held or closed", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not hold waiting list entry", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entry": entry})
}

func (s *Server) handleUpdateWaitingListStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	status := strings.ToUpper(strings.TrimSpace(req.Status))
	switch status {
	case "WAITING", "OFFERED", "SCHEDULED", "EXPIRED", "CANCELLED":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid waiting list status", nil)
		return
	}
	tx := txFrom(r.Context())
	entry, err := s.store.UpdateWaitingListStatus(r.Context(), tx, id, status)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "waiting list entry not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entry": entry})
}
