package httpapi

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleListUsers(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	users, err := s.store.ListTenantUsers(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

func (s *Server) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	var req struct {
		Email    string `json:"email"`
		FullName string `json:"full_name"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.FullName = strings.TrimSpace(req.FullName)
	req.Role = strings.ToUpper(strings.TrimSpace(req.Role))
	if _, err := mail.ParseAddress(req.Email); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid email", nil)
		return
	}
	if !auth.ValidRole(req.Role) || req.Role == "OWNER" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "rol inválido (usa ADMIN, DENTIST, HYGIENIST o RECEPTIONIST)", nil)
		return
	}
	if len(req.Password) < 10 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "password must be at least 10 characters", nil)
		return
	}

	user, err := s.store.GetUserByEmail(r.Context(), tx, req.Email)
	if errors.Is(err, store.ErrNotFound) {
		if len(req.FullName) < 2 {
			writeError(w, http.StatusBadRequest, "VALIDATION", "full_name is required for new users", nil)
			return
		}
		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
		user, err = s.store.CreateUser(r.Context(), tx, req.Email, hash, req.FullName, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create user", nil)
			return
		}
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	} else {
		if _, err := s.store.GetMembership(r.Context(), tx, user.ID, claims.TenantID); err == nil {
			writeError(w, http.StatusConflict, "ALREADY_MEMBER", "el usuario ya pertenece a este tenant", nil)
			return
		} else if !errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
	}

	membership, err := s.store.CreateMembership(r.Context(), tx, claims.TenantID, user.ID, req.Role)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not create membership", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"membership_id": membership.ID,
		"user_id":       user.ID,
		"email":         user.Email,
		"role":          membership.Role,
		"is_active":     true,
	})
}

func (s *Server) handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	membershipID := chi.URLParam(r, "id")
	var req struct {
		Role     *string `json:"role"`
		IsActive *bool   `json:"is_active"`
	}
	if err := decodeJSON(r, &req); err != nil || (req.Role == nil && req.IsActive == nil) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "role o is_active requeridos", nil)
		return
	}
	current, err := s.store.GetTenantUserByMembershipID(r.Context(), tx, claims.TenantID, membershipID)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "miembro no encontrado", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	role := current.Role
	if req.Role != nil {
		role = strings.ToUpper(strings.TrimSpace(*req.Role))
		if !auth.ValidRole(role) {
			writeError(w, http.StatusBadRequest, "VALIDATION", "rol inválido", nil)
			return
		}
		if role == "OWNER" && current.Role != "OWNER" {
			writeError(w, http.StatusBadRequest, "VALIDATION", "no se puede promover a OWNER desde la API; usa el propietario actual", nil)
			return
		}
	}
	active := current.IsActive
	if req.IsActive != nil {
		active = *req.IsActive
	}
	if current.UserID == claims.Subject && !active {
		writeError(w, http.StatusBadRequest, "VALIDATION", "no puedes desactivar tu propia cuenta", nil)
		return
	}
	if current.Role == "OWNER" && (role != "OWNER" || !active) {
		owners, err := s.store.CountActiveOwners(r.Context(), tx, claims.TenantID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
		if owners <= 1 {
			writeError(w, http.StatusBadRequest, "LAST_OWNER", "el tenant debe conservar al menos un OWNER activo", nil)
			return
		}
	}
	if err := s.store.UpdateMembership(r.Context(), tx, claims.TenantID, membershipID, role, active); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"membership_id": membershipID, "role": role, "is_active": active})
}
