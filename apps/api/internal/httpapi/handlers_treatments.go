package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListTreatments(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	includeInactive := r.URL.Query().Get("all") == "true"
	treatments, err := s.store.ListTreatments(r.Context(), tx, claims.TenantID, includeInactive)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list treatments", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"treatments": treatments})
}

func (s *Server) handleCreateTreatment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code             string  `json:"code"`
		Name             string  `json:"name"`
		Category         string  `json:"category"`
		DefaultPrice     float64 `json:"default_price"`
		EstimatedMinutes int     `json:"estimated_minutes"`
		Color            string  `json:"color"`
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
	if req.EstimatedMinutes <= 0 {
		req.EstimatedMinutes = 30
	}
	if req.Color == "" {
		req.Color = "#0EA5E9"
	}
	if req.Category == "" {
		req.Category = "GENERAL"
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	t, err := s.store.CreateTreatment(r.Context(), tx, store.Treatment{
		TenantID:         claims.TenantID,
		Code:             strings.TrimSpace(req.Code),
		Name:             req.Name,
		Category:         strings.ToUpper(strings.TrimSpace(req.Category)),
		DefaultPrice:     req.DefaultPrice,
		EstimatedMinutes: req.EstimatedMinutes,
		Color:            strings.TrimSpace(req.Color),
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create treatment", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"treatment": t})
}

func (s *Server) handleUpdateTreatment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	var req struct {
		Name             string  `json:"name"`
		Category         string  `json:"category"`
		DefaultPrice     float64 `json:"default_price"`
		EstimatedMinutes int     `json:"estimated_minutes"`
		Color            string  `json:"color"`
		IsActive         *bool   `json:"is_active"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	t, err := s.store.UpdateTreatment(r.Context(), tx, store.Treatment{
		ID:               id,
		TenantID:         claims.TenantID,
		Name:             strings.TrimSpace(req.Name),
		Category:         strings.ToUpper(strings.TrimSpace(req.Category)),
		DefaultPrice:     req.DefaultPrice,
		EstimatedMinutes: req.EstimatedMinutes,
		Color:            strings.TrimSpace(req.Color),
		IsActive:         isActive,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "treatment not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update treatment", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"treatment": t})
}

func (s *Server) handleDeleteTreatment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	if err := s.store.DeleteTreatment(r.Context(), tx, claims.TenantID, id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "treatment not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not delete treatment", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
