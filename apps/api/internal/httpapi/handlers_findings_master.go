package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListFindingsMaster(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	includeDeleted := r.URL.Query().Get("all") == "true" || r.URL.Query().Get("include_deleted") == "true"
	findings, err := s.store.ListFindingsMaster(r.Context(), tx, claims.TenantID, includeDeleted)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list findings master", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"findings": findings})
}

func (s *Server) handleCreateFindingMaster(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code                  string   `json:"code"`
		Name                  string   `json:"name"`
		Description           string   `json:"description"`
		Category              string   `json:"category"`
		DefaultSeverity       string   `json:"default_severity"`
		ColorCode             string   `json:"color_code"`
		DefaultTreatmentCodes []string `json:"default_treatment_codes"`
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
	if req.ColorCode == "" {
		req.ColorCode = "#0D9488"
	}
	if req.DefaultSeverity == "" {
		req.DefaultSeverity = "MEDIUM"
	}
	if req.DefaultTreatmentCodes == nil {
		req.DefaultTreatmentCodes = []string{}
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	finding, err := s.store.CreateFindingMaster(r.Context(), tx, claims.TenantID, store.FindingMaster{
		TenantID:              claims.TenantID,
		Code:                  strings.TrimSpace(req.Code),
		Name:                  req.Name,
		Description:           strings.TrimSpace(req.Description),
		Category:              strings.TrimSpace(req.Category),
		DefaultSeverity:       req.DefaultSeverity,
		ColorCode:             strings.TrimSpace(req.ColorCode),
		DefaultTreatmentCodes: req.DefaultTreatmentCodes,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create finding master", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"finding": finding})
}

func (s *Server) handleUpdateFindingMaster(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	var req struct {
		Name                  string   `json:"name"`
		Description           string   `json:"description"`
		Category              string   `json:"category"`
		DefaultSeverity       string   `json:"default_severity"`
		ColorCode             string   `json:"color_code"`
		DefaultTreatmentCodes []string `json:"default_treatment_codes"`
		IsActive              *bool    `json:"is_active"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	if req.DefaultTreatmentCodes == nil {
		req.DefaultTreatmentCodes = []string{}
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	finding, err := s.store.UpdateFindingMaster(r.Context(), tx, claims.TenantID, id, store.FindingMaster{
		ID:                    id,
		TenantID:              claims.TenantID,
		Name:                  strings.TrimSpace(req.Name),
		Description:           strings.TrimSpace(req.Description),
		Category:              strings.TrimSpace(req.Category),
		DefaultSeverity:       req.DefaultSeverity,
		ColorCode:             strings.TrimSpace(req.ColorCode),
		DefaultTreatmentCodes: req.DefaultTreatmentCodes,
		IsActive:              isActive,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "finding not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update finding master", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"finding": finding})
}

func (s *Server) handleDeleteFindingMaster(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	if err := s.store.DeleteFindingMaster(r.Context(), tx, claims.TenantID, id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "finding not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not delete finding master", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
