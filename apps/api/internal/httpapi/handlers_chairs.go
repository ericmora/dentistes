package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/go-chi/chi/v5"
)

func (s *Server) handleListChairs(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())
	chairs, err := s.store.ListDentalChairs(r.Context(), tx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list chairs", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"chairs": chairs})
}

func (s *Server) handleCreateChair(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name              string   `json:"name"`
		ColorCode         string   `json:"color_code"`
		Equipment         string   `json:"equipment"`
		AllowedCategories []string `json:"allowed_categories"`
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
	chair, err := s.store.CreateDentalChair(r.Context(), tx, claims.TenantID, req.Name, strings.TrimSpace(req.ColorCode), strings.TrimSpace(req.Equipment), req.AllowedCategories)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create chair", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"chair": chair})
}

func (s *Server) handleUpdateChair(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	var req struct {
		Name              string   `json:"name"`
		ColorCode         string   `json:"color_code"`
		Equipment         string   `json:"equipment"`
		AllowedCategories []string `json:"allowed_categories"`
		IsActive          *bool    `json:"is_active"`
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
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	tx := txFrom(r.Context())
	chair, err := s.store.UpdateDentalChair(r.Context(), tx, id, req.Name, strings.TrimSpace(req.ColorCode), strings.TrimSpace(req.Equipment), req.AllowedCategories, isActive)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "chair not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update chair", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"chair": chair})
}

func (s *Server) handleDeleteChair(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "id is required", nil)
		return
	}
	tx := txFrom(r.Context())
	if err := s.store.DeleteDentalChair(r.Context(), tx, id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "chair not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not delete chair", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
