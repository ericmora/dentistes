package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListPatients(w http.ResponseWriter, r *http.Request) {
	limit := intQuery(r, "limit", 50)
	if limit < 1 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	offset := intQuery(r, "offset", 0)
	if offset < 0 {
		offset = 0
	}
	tx := txFrom(r.Context())
	patients, err := s.store.ListPatients(r.Context(), tx, strings.TrimSpace(r.URL.Query().Get("q")), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"patients": patients, "limit": limit, "offset": offset})
}

func (s *Server) handleCreatePatient(w http.ResponseWriter, r *http.Request) {
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
	alerts := `{"allergies": [], "conditions": [], "medications": [], "high_risk": false, "notes": ""}`
	if len(req.MedicalAlerts) > 0 {
		if !json.Valid(req.MedicalAlerts) {
			writeError(w, http.StatusBadRequest, "VALIDATION", "medical_alerts must be valid JSON", nil)
			return
		}
		alerts = string(req.MedicalAlerts)
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	patient, err := s.store.CreatePatient(r.Context(), tx, claims.TenantID, store.NewPatient{
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		DNINIE:        req.DNINIE,
		BirthDate:     req.BirthDate,
		Gender:        req.Gender,
		Phone:         req.Phone,
		Email:         req.Email,
		WhatsappOptIn: req.WhatsappOptIn,
		AddressJSON:   address,
		AlertsJSON:    alerts,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create patient", nil)
		return
	}
	writeJSON(w, http.StatusCreated, patient)
}

func intQuery(r *http.Request, key string, def int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return n
}
