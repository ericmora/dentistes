package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func redactAlertsIfRestricted(role string, detail *store.PatientDetail) {
	if auth.HasPermission(role, "clinical:read") {
		return
	}
	var parsed struct {
		HighRisk                     bool `json:"high_risk"`
		RequiresAntibioticProphylaxis bool `json:"requires_antibiotic_prophylaxis"`
	}
	_ = json.Unmarshal(detail.MedicalAlerts, &parsed)
	summary := ""
	if parsed.HighRisk || detail.HighRisk {
		summary = "ALERTA: Paciente de riesgo clínico. Consultar con el facultativo."
	}
	redacted, _ := json.Marshal(map[string]any{
		"high_risk":                       parsed.HighRisk || detail.HighRisk,
		"requires_antibiotic_prophylaxis": parsed.RequiresAntibioticProphylaxis,
		"summary":                         summary,
	})
	detail.MedicalAlerts = redacted
}

func (s *Server) handleGetPatient(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	patient, err := s.store.GetPatientByID(r.Context(), tx, patientID)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "patient not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	if auth.HasPermission(claims.Role, "clinical:read") {
		_ = s.store.LogClinicalAccess(r.Context(), tx, claims.TenantID, claims.Subject, patientID, "patient_alerts")
	}
	redactAlertsIfRestricted(claims.Role, patient)
	writeJSON(w, http.StatusOK, map[string]any{"patient": patient})
}

func (s *Server) handleUpdatePatient(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	var req struct {
		FirstName     string          `json:"first_name"`
		LastName      string          `json:"last_name"`
		DNINIE        string          `json:"dni_nie"`
		BirthDate     string          `json:"birth_date"`
		Gender        string          `json:"gender"`
		Phone         string          `json:"phone"`
		Email         string          `json:"email"`
		WhatsappOptIn bool            `json:"whatsapp_opt_in"`
		Address       json.RawMessage `json:"address"`
		MedicalAlerts json.RawMessage `json:"medical_alerts"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Phone = strings.TrimSpace(req.Phone)
	if req.FirstName == "" || req.LastName == "" || req.Phone == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "first_name, last_name and phone are required", nil)
		return
	}
	if _, err := time.Parse("2006-01-02", req.BirthDate); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "birth_date must be YYYY-MM-DD", nil)
		return
	}
	address := "{}"
	if len(req.Address) > 0 {
		if !json.Valid(req.Address) {
			writeError(w, http.StatusBadRequest, "VALIDATION", "address must be valid JSON", nil)
			return
		}
		address = string(req.Address)
	}

	claims := claimsFrom(r.Context())
	var alertsPtr *string
	if len(req.MedicalAlerts) > 0 {
		if !auth.HasPermission(claims.Role, "clinical:write") {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "missing permission: clinical:write", nil)
			return
		}
		if !json.Valid(req.MedicalAlerts) {
			writeError(w, http.StatusBadRequest, "VALIDATION", "medical_alerts must be valid JSON", nil)
			return
		}
		raw := string(req.MedicalAlerts)
		alertsPtr = &raw
	}

	tx := txFrom(r.Context())
	patient, err := s.store.UpdatePatient(r.Context(), tx, patientID, store.UpdatePatientInput{
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		DNINIE:        req.DNINIE,
		BirthDate:     req.BirthDate,
		Gender:        req.Gender,
		Phone:         req.Phone,
		Email:         req.Email,
		WhatsappOptIn: req.WhatsappOptIn,
		AddressJSON:   address,
		AlertsJSON:    alertsPtr,
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "patient not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update patient", nil)
		return
	}
	redactAlertsIfRestricted(claims.Role, patient)
	writeJSON(w, http.StatusOK, map[string]any{"patient": patient})
}

func (s *Server) handleListClinicalRecords(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	if _, err := s.store.GetPatientByID(r.Context(), tx, patientID); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "patient not found", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	records, err := s.store.ListClinicalRecords(r.Context(), tx, patientID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	_ = s.store.LogClinicalAccess(r.Context(), tx, claims.TenantID, claims.Subject, patientID, "clinical_records")
	writeJSON(w, http.StatusOK, map[string]any{"records": records})
}

func (s *Server) handleCreateClinicalRecord(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	var req struct {
		EntryType     string  `json:"entry_type"`
		Content       string  `json:"content"`
		AppointmentID *string `json:"appointment_id"`
		AmendsEntryID *string `json:"amends_entry_id"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	entryType := strings.ToUpper(strings.TrimSpace(req.EntryType))
	switch entryType {
	case "NOTE", "DIAGNOSIS", "PROCEDURE", "PRESCRIPTION":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "entry_type must be NOTE, DIAGNOSIS, PROCEDURE or PRESCRIPTION", nil)
		return
	}
	content := strings.TrimSpace(req.Content)
	if content == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "content is required", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	if _, err := s.store.GetPatientByID(r.Context(), tx, patientID); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "patient not found", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	record, err := s.store.CreateClinicalRecord(r.Context(), tx, claims.TenantID, patientID, claims.Subject, req.AppointmentID, entryType, content, req.AmendsEntryID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create clinical record", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"record": record})
}

func (s *Server) handleListOdontograms(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	tx := txFrom(r.Context())
	if _, err := s.store.GetPatientByID(r.Context(), tx, patientID); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "patient not found", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	odontograms, err := s.store.ListOdontograms(r.Context(), tx, patientID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"odontograms": odontograms})
}

func (s *Server) handleUpsertOdontogram(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	odoType := strings.ToUpper(strings.TrimSpace(chi.URLParam(r, "type")))
	switch odoType {
	case "INITIAL", "CURRENT", "HISTORICAL":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "type must be INITIAL, CURRENT or HISTORICAL", nil)
		return
	}

	var req struct {
		TeethData json.RawMessage `json:"teeth_data"`
		Version   *int            `json:"version"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if len(req.TeethData) == 0 || !json.Valid(req.TeethData) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "teeth_data must be valid JSON", nil)
		return
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	if _, err := s.store.GetPatientByID(r.Context(), tx, patientID); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "patient not found", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	odo, err := s.store.UpsertOdontogram(r.Context(), tx, claims.TenantID, patientID, claims.Subject, odoType, string(req.TeethData), req.Version)
	if errors.Is(err, store.ErrVersionConflict) {
		writeError(w, http.StatusConflict, "VERSION_CONFLICT", "odontogram has been updated by another session", nil)
		return
	}
	if err != nil && err != pgx.ErrNoRows {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not save odontogram", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"odontogram": odo})
}
