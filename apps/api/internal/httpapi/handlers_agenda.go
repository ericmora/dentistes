package httpapi

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListCabinets(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())
	cabinets, err := s.store.ListCabinets(r.Context(), tx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"cabinets": cabinets})
}

func (s *Server) handleCreateCabinet(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name         string                         `json:"name"`
		ColorCode    string                         `json:"color_code"`
		Availability []store.CabinetDayAvailability `json:"availability"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "name is required", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	cab, err := s.store.CreateCabinet(r.Context(), tx, claims.TenantID, req.Name, strings.TrimSpace(req.ColorCode), req.Availability)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create cabinet", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"cabinet": cab})
}

func (s *Server) handleUpdateCabinet(w http.ResponseWriter, r *http.Request) {
	cabinetID := chi.URLParam(r, "id")
	if cabinetID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "cabinet id is required", nil)
		return
	}
	var req struct {
		Name         string                         `json:"name"`
		ColorCode    string                         `json:"color_code"`
		Availability []store.CabinetDayAvailability `json:"availability"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	cab, err := s.store.UpdateCabinet(r.Context(), tx, claims.TenantID, cabinetID, strings.TrimSpace(req.Name), strings.TrimSpace(req.ColorCode), req.Availability)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "cabinet not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update cabinet", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"cabinet": cab})
}

func (s *Server) handleDeleteCabinet(w http.ResponseWriter, r *http.Request) {
	cabinetID := chi.URLParam(r, "id")
	if cabinetID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "cabinet id is required", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	if err := s.store.DeleteCabinet(r.Context(), tx, claims.TenantID, cabinetID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "cabinet not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not delete cabinet", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleListDoctors(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())
	doctors, err := s.store.ListDoctors(r.Context(), tx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"doctors": doctors})
}

func (s *Server) handleListAppointments(w http.ResponseWriter, r *http.Request) {
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")
	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)

	if startStr != "" {
		parsed, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			writeError(w, http.StatusBadRequest, "VALIDATION", "start must be RFC3339", nil)
			return
		}
		start = parsed
	}
	if endStr != "" {
		parsed, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			writeError(w, http.StatusBadRequest, "VALIDATION", "end must be RFC3339", nil)
			return
		}
		end = parsed
	}
	if !end.After(start) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "end must be after start", nil)
		return
	}

	tx := txFrom(r.Context())
	items, err := s.store.ListAppointments(r.Context(), tx, start, end, r.URL.Query().Get("cabinet_id"), r.URL.Query().Get("doctor_id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"appointments": items})
}

func (s *Server) handleCreateAppointment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PatientID     string `json:"patient_id"`
		DoctorID      string `json:"doctor_id"`
		CabinetID     string `json:"cabinet_id"`
		StartTime     string `json:"start_time"`
		EndTime       string `json:"end_time"`
		TreatmentType string `json:"treatment_type"`
		IsForced      bool   `json:"is_forced"`
		Notes         string `json:"notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	start, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "start_time must be RFC3339", nil)
		return
	}
	end, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil || !end.After(start) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "end_time must be RFC3339 after start_time", nil)
		return
	}
	req.TreatmentType = strings.TrimSpace(req.TreatmentType)
	if req.PatientID == "" || req.DoctorID == "" || req.CabinetID == "" || req.TreatmentType == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "patient_id, doctor_id, cabinet_id and treatment_type are required", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	appt, err := s.store.CreateAppointment(r.Context(), tx, claims.TenantID, store.UpsertAppointmentInput{
		PatientID:     req.PatientID,
		DoctorID:      req.DoctorID,
		CabinetID:     req.CabinetID,
		StartTime:     start,
		EndTime:       end,
		TreatmentType: req.TreatmentType,
		IsForced:      req.IsForced,
		Notes:         strings.TrimSpace(req.Notes),
	})
	if errors.Is(err, store.ErrOverlap) {
		writeError(w, http.StatusConflict, "APPOINTMENT_OVERLAP", "cabinet already has an appointment in that time range", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create appointment", nil)
		return
	}

	s.hub.Publish(claims.TenantID, "appointment.created", appt)
	writeJSON(w, http.StatusCreated, map[string]any{"appointment": appt})
}

func (s *Server) handleUpdateAppointment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		DoctorID      string `json:"doctor_id"`
		CabinetID     string `json:"cabinet_id"`
		StartTime     string `json:"start_time"`
		EndTime       string `json:"end_time"`
		TreatmentType string `json:"treatment_type"`
		IsForced      bool   `json:"is_forced"`
		Notes         string `json:"notes"`
		Version       *int   `json:"version"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if req.Version == nil {
		if ifMatch := strings.Trim(strings.TrimSpace(r.Header.Get("If-Match")), `"`); ifMatch != "" {
			if v, err := strconv.Atoi(ifMatch); err == nil {
				req.Version = &v
			}
		}
	}

	start, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "start_time must be RFC3339", nil)
		return
	}
	end, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil || !end.After(start) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "end_time must be RFC3339 after start_time", nil)
		return
	}
	req.TreatmentType = strings.TrimSpace(req.TreatmentType)
	if req.DoctorID == "" || req.CabinetID == "" || req.TreatmentType == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "doctor_id, cabinet_id and treatment_type are required", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	appt, err := s.store.UpdateAppointment(r.Context(), tx, id, store.UpsertAppointmentInput{
		DoctorID:      req.DoctorID,
		CabinetID:     req.CabinetID,
		StartTime:     start,
		EndTime:       end,
		TreatmentType: req.TreatmentType,
		IsForced:      req.IsForced,
		Notes:         strings.TrimSpace(req.Notes),
	}, req.Version)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "appointment not found", nil)
		return
	}
	if errors.Is(err, store.ErrVersionConflict) {
		writeError(w, http.StatusConflict, "VERSION_CONFLICT", "appointment was modified by another user", nil)
		return
	}
	if errors.Is(err, store.ErrOverlap) {
		writeError(w, http.StatusConflict, "APPOINTMENT_OVERLAP", "cabinet already has an appointment in that time range", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update appointment", nil)
		return
	}

	s.hub.Publish(claims.TenantID, "appointment.updated", appt)
	writeJSON(w, http.StatusOK, map[string]any{"appointment": appt})
}

func (s *Server) handleUpdateAppointmentStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status             string `json:"status"`
		CancellationReason string `json:"cancellation_reason"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	status := strings.ToUpper(strings.TrimSpace(req.Status))
	switch status {
	case "SCHEDULED", "WHATSAPP_SENT", "CONFIRMED", "WAITING_ROOM", "IN_CABINET", "COMPLETED", "NO_SHOW", "CANCELLED":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid appointment status", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	appt, err := s.store.UpdateAppointmentStatus(r.Context(), tx, id, status, strings.TrimSpace(req.CancellationReason))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "appointment not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update appointment status", nil)
		return
	}

	s.hub.Publish(claims.TenantID, "appointment.status", appt)

	var matches []store.WaitingCandidateMatch
	if status == "CANCELLED" {
		if ent, entErr := s.entitlementsFor(r.Context()); entErr == nil && ent.Result.Features["waiting_list"] {
			if found, mErr := s.store.FindMatchingWaitingCandidates(r.Context(), tx, appt.StartTime, appt.EndTime, appt.DoctorID, 5); mErr == nil && len(found) > 0 {
				matches = found
				s.hub.Publish(claims.TenantID, "waiting_list.matches", map[string]any{
					"appointment": appt,
					"matches":     matches,
				})
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"appointment":          appt,
		"waiting_list_matches": matches,
	})
}

func (s *Server) handleAppointmentStream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "STREAM_UNSUPPORTED", "streaming unsupported", nil)
		return
	}

	claims := claimsFrom(r.Context())
	ch, cancel := s.hub.Subscribe(claims.TenantID)
	defer cancel()

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	_, _ = fmt.Fprintf(w, "event: ready\ndata: {\"tenant_id\":%q}\n\n", claims.TenantID)
	flusher.Flush()

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case msg, open := <-ch:
			if !open {
				return
			}
			_, _ = fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-ticker.C:
			_, _ = fmt.Fprint(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}
