package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListSpecialties(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	includeDeleted := r.URL.Query().Get("all") == "true" || r.URL.Query().Get("include_deleted") == "true"
	specialties, err := s.store.ListSpecialties(r.Context(), tx, claims.TenantID, includeDeleted)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list specialties", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"specialties": specialties})
}

func (s *Server) handleCreateSpecialty(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code        string `json:"code"`
		Name        string `json:"name"`
		Description string `json:"description"`
		ColorCode   string `json:"color_code"`
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

	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	spec, err := s.store.CreateSpecialty(r.Context(), tx, store.Specialty{
		TenantID:    claims.TenantID,
		Code:        strings.TrimSpace(req.Code),
		Name:        req.Name,
		Description: strings.TrimSpace(req.Description),
		ColorCode:   strings.TrimSpace(req.ColorCode),
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create specialty", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"specialty": spec})
}

func (s *Server) handleUpdateSpecialty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		ColorCode   string `json:"color_code"`
		IsActive    *bool  `json:"is_active"`
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
	spec, err := s.store.UpdateSpecialty(r.Context(), tx, store.Specialty{
		ID:          id,
		TenantID:    claims.TenantID,
		Name:        strings.TrimSpace(req.Name),
		Description: strings.TrimSpace(req.Description),
		ColorCode:   strings.TrimSpace(req.ColorCode),
		IsActive:    isActive,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "specialty not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update specialty", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"specialty": spec})
}

func (s *Server) handleDeleteSpecialty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	if err := s.store.DeleteSpecialty(r.Context(), tx, claims.TenantID, id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "specialty not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not delete specialty", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
