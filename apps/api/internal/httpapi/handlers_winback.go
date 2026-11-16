package httpapi

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

var transparent1x1PNG = []byte{
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
	0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
	0x42, 0x60, 0x82,
}

func (s *Server) handleTrackingPixel(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	token = strings.TrimSuffix(token, ".png")

	if token != "" {
		tx := txFrom(r.Context())
		ua := r.UserAgent()
		ip := r.Header.Get("X-Forwarded-For")
		if ip == "" {
			ip = r.RemoteAddr
		}
		_ = s.store.RecordPixelOpen(r.Context(), tx, token, ua, ip)
	}

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(transparent1x1PNG)
}

func (s *Server) handleTrackingClick(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	targetURL := "https://app.dentistes.2mes4.com/reactivate"

	if token != "" {
		tx := txFrom(r.Context())
		log, err := s.store.RecordLinkClick(r.Context(), tx, token)
		if err == nil && log != nil {
			targetURL = fmt.Sprintf("https://app.dentistes.2mes4.com/reactivate?token=%s&clinic=%s", token, log.ClinicName)
		}
	}

	http.Redirect(w, r, targetURL, http.StatusFound)
}

func (s *Server) handleReactivateClinicAccount(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token string `json:"token"`
	}
	_ = decodeJSON(r, &req)

	tx := txFrom(r.Context())
	claims := claimsFrom(r.Context())

	tenantID := ""
	if claims != nil && claims.TenantID != "" {
		tenantID = claims.TenantID
	}

	// If token passed, match log
	if req.Token != "" {
		log, err := s.store.RecordLinkClick(r.Context(), tx, req.Token)
		if err == nil && log != nil {
			tenantID = log.TenantID
		}
	}

	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "no active session or valid tracking token found for reactivation", nil)
		return
	}

	if err := s.store.ReactivateTenant(r.Context(), tx, tenantID, req.Token); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not reactivate clinic account", nil)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"status":  "ACTIVE",
		"message": "Clínica reactivada con éxito. Todos los historiales, tarifas y citas están restaurados.",
	})
}

// Platform Admin Endpoints
func (s *Server) handleAdminGetWinbackMetrics(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())
	metrics, err := s.store.GetWinbackMetrics(r.Context(), tx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not load winback metrics", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"metrics": metrics})
}

func (s *Server) handleAdminListWinbackLogs(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())
	logs, err := s.store.ListCancellationEmailLogs(r.Context(), tx, 100)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list winback logs", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"logs": logs})
}

func (s *Server) handleAdminListWinbackTemplates(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())
	templates, err := s.store.ListCancellationTemplates(r.Context(), tx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list winback templates", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"templates": templates})
}

func (s *Server) handleAdminUpdateWinbackTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "template id is required", nil)
		return
	}

	var req struct {
		Subject           string `json:"subject"`
		PreviewText       string `json:"preview_text"`
		BodyHTML          string `json:"body_html"`
		BodyText          string `json:"body_text"`
		HasFreeMonthOffer bool   `json:"has_free_month_offer"`
		IsActive          bool   `json:"is_active"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}

	tx := txFrom(r.Context())
	updated, err := s.store.UpdateCancellationTemplate(r.Context(), tx, id, req.Subject, req.PreviewText, req.BodyHTML, req.BodyText, req.HasFreeMonthOffer, req.IsActive)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not update winback template", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"template": updated})
}

func (s *Server) handleAdminSendTestWinbackEmail(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RecipientEmail string `json:"recipient_email"`
		StepDay        int    `json:"step_day"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if req.RecipientEmail == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "recipient_email is required", nil)
		return
	}
	if req.StepDay <= 0 {
		req.StepDay = 15
	}

	tx := txFrom(r.Context())
	tmpl, err := s.store.GetCancellationTemplateByStep(r.Context(), tx, req.StepDay)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "template step not found", nil)
		return
	}

	// Generate log with token
	token := store.GenerateTrackingToken()
	pixelURL := fmt.Sprintf("https://api.dentistes.2mes4.com/api/v1/tracking/pixel/%s.png", token)
	clickURL := fmt.Sprintf("https://api.dentistes.2mes4.com/api/v1/tracking/click/%s", token)

	renderedHTML := strings.ReplaceAll(tmpl.BodyHTML, "{{owner_name}}", "Dr. Titular de Prueba")
	renderedHTML = strings.ReplaceAll(renderedHTML, "{{clinic_name}}", "Clínica Dental Demo")
	renderedHTML = strings.ReplaceAll(renderedHTML, "{{days_remaining}}", fmt.Sprintf("%d", 30-req.StepDay))
	renderedHTML = strings.ReplaceAll(renderedHTML, "{{reactivate_url}}", clickURL)
	renderedHTML = strings.ReplaceAll(renderedHTML, "{{tracking_pixel_url}}", pixelURL)

	// In test mode we simulate dispatch and record log for immediate inspection
	// We use the first tenant or a demo tenant
	var demoTenantID string
	_ = tx.QueryRow(r.Context(), `select id from tenants order by created_at desc limit 1`).Scan(&demoTenantID)
	if demoTenantID != "" {
		_, _ = s.store.RecordCancellationEmailSent(r.Context(), tx, store.CancellationEmailLog{
			TenantID:       demoTenantID,
			RecipientEmail: req.RecipientEmail,
			RecipientName:  "Dr. Titular de Prueba",
			ClinicName:     "Clínica Dental Demo",
			StepDay:        req.StepDay,
			Subject:        tmpl.Subject,
			TrackingToken:  token,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":                 true,
		"message":            fmt.Sprintf("Email de prueba (Paso Día %d) simulado y registrado con píxel de tracking.", req.StepDay),
		"tracking_token":     token,
		"tracking_pixel_url": pixelURL,
		"rendered_preview":   renderedHTML,
	})
}

func (s *Server) handleAdminTriggerWinbackCron(w http.ResponseWriter, r *http.Request) {
	tx := txFrom(r.Context())

	// Find canceled tenants in custody
	rows, err := tx.Query(r.Context(), `
		select id, name, coalesce(canceled_at, created_at)
		from tenants
		where status = 'CANCELED' and (purge_scheduled_at is null or purge_scheduled_at > now())`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not query canceled tenants", nil)
		return
	}
	defer rows.Close()

	type CanceledTenant struct {
		ID         string
		Name       string
		CanceledAt time.Time
	}
	var canceled []CanceledTenant
	for rows.Next() {
		var ct CanceledTenant
		if err := rows.Scan(&ct.ID, &ct.Name, &ct.CanceledAt); err == nil {
			canceled = append(canceled, ct)
		}
	}

	dispatchedCount := 0
	steps := []int{5, 10, 15, 20, 25, 30}

	for _, ct := range canceled {
		daysElapsed := int(time.Since(ct.CanceledAt).Hours() / 24)

		for _, step := range steps {
			if daysElapsed >= step {
				// Check if already sent
				var alreadySent bool
				_ = tx.QueryRow(r.Context(), `
					select exists(select 1 from cancellation_email_logs where tenant_id = $1::uuid and step_day = $2)`,
					ct.ID, step).Scan(&alreadySent)

				if !alreadySent {
					tmpl, err := s.store.GetCancellationTemplateByStep(r.Context(), tx, step)
					if err == nil && tmpl != nil && tmpl.IsActive {
						// Get owner user email
						var ownerEmail, ownerName string
						_ = tx.QueryRow(r.Context(), `
							select u.email, u.full_name
							from users u
							join memberships m on m.user_id = u.id
							where m.tenant_id = $1::uuid and m.role = 'OWNER' limit 1`, ct.ID).
							Scan(&ownerEmail, &ownerName)

						if ownerEmail != "" {
							token := store.GenerateTrackingToken()
							_, _ = s.store.RecordCancellationEmailSent(r.Context(), tx, store.CancellationEmailLog{
								TenantID:       ct.ID,
								RecipientEmail: ownerEmail,
								RecipientName:  ownerName,
								ClinicName:     ct.Name,
								StepDay:        step,
								Subject:        tmpl.Subject,
								TrackingToken:  token,
							})
							dispatchedCount++
						}
					}
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":               true,
		"evaluated_clinics": len(canceled),
		"emails_dispatched": dispatchedCount,
	})
}
