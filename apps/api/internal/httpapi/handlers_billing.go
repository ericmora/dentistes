package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
)

func (s *Server) handleSubscription(w http.ResponseWriter, r *http.Request) {
	ent, err := s.entitlementsFor(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"subscription": ent.Subscription,
		"entitlements": ent.Result,
	})
}

func (s *Server) handleCheckout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlanKey string `json:"plan_key"`
	}
	if err := decodeJSON(r, &req); err != nil || req.PlanKey == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "plan_key is required", nil)
		return
	}
	if !s.stripe.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "billing is not configured", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	plan, err := s.store.GetPlanByKey(r.Context(), tx, req.PlanKey)
	if errors.Is(err, store.ErrNotFound) || (plan != nil && !plan.IsActive) {
		writeError(w, http.StatusBadRequest, "UNKNOWN_PLAN", "unknown or inactive plan", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	if plan.StripePriceID == "" {
		writeError(w, http.StatusBadRequest, "PLAN_NOT_CONFIGURED", "plan has no Stripe price configured", map[string]any{"plan": plan.Key})
		return
	}
	sub, err := s.store.GetSubscription(r.Context(), tx, claims.TenantID)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	customerID := ""
	if sub != nil {
		customerID = sub.StripeCustomerID
	}
	if customerID == "" {
		user, err := s.store.GetUserByID(r.Context(), tx, claims.Subject)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
		customerID, err = s.stripe.CreateCustomer(r.Context(), user.Email, user.FullName, claims.TenantID)
		if err != nil {
			slog.Error("stripe create customer", "error", err)
			writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not create billing customer", nil)
			return
		}
		if err := s.store.SetStripeCustomer(r.Context(), tx, claims.TenantID, customerID); err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
	}
	trialDays := 0
	paymentCollection := ""
	if sub == nil || (sub.Status == "INCOMPLETE" && sub.StripeSubscriptionID == "") {
		trialDays = s.cfg.TrialDays
		paymentCollection = "always"
	}
	url, err := s.stripe.CreateCheckout(r.Context(), stripeapi.CheckoutParams{
		CustomerID:              customerID,
		PriceID:                 plan.StripePriceID,
		TenantID:                claims.TenantID,
		SuccessURL:              s.cfg.AppURL + "/onboarding/complete?session_id={CHECKOUT_SESSION_ID}",
		CancelURL:               s.cfg.AppURL + "/billing?checkout=cancel",
		TrialPeriodDays:         trialDays,
		PaymentMethodCollection: paymentCollection,
	})
	if err != nil {
		slog.Error("stripe checkout", "error", err)
		writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not start checkout", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (s *Server) handleConfirmCheckout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SessionID string `json:"session_id"`
	}
	if err := decodeJSON(r, &req); err != nil || strings.TrimSpace(req.SessionID) == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "session_id is required", nil)
		return
	}
	if !s.stripe.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "billing is not configured", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())

	cs, err := s.stripe.GetCheckoutSession(r.Context(), strings.TrimSpace(req.SessionID))
	if err != nil {
		slog.Error("stripe get checkout session", "error", err)
		writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not verify checkout session", nil)
		return
	}
	sessionTenant := cs.Metadata["tenant_id"]
	if sessionTenant == "" {
		sessionTenant = cs.ClientReferenceID
	}
	if sessionTenant != claims.TenantID {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "checkout session does not belong to this tenant", nil)
		return
	}
	if cs.Customer != "" {
		if err := s.store.SetStripeCustomer(r.Context(), tx, claims.TenantID, cs.Customer); err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
	}
	if cs.Subscription != "" {
		sub, err := s.stripe.GetSubscription(r.Context(), cs.Subscription)
		if err != nil {
			slog.Error("stripe get subscription", "error", err)
			writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not load Stripe subscription", nil)
			return
		}
		if err := s.syncSubscription(r.Context(), tx, claims.TenantID, sub); err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
			return
		}
	}
	ent, err := s.loadEntitlementsForTenant(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"subscription": ent.Subscription,
		"entitlements": ent.Result,
	})
}

func (s *Server) handleListInvoices(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	sub, err := s.store.GetSubscription(r.Context(), tx, claims.TenantID)
	if errors.Is(err, store.ErrNotFound) || sub.StripeCustomerID == "" {
		writeJSON(w, http.StatusOK, map[string]any{"invoices": []stripeapi.InvoiceItem{}})
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	if !s.stripe.Enabled() {
		writeJSON(w, http.StatusOK, map[string]any{"invoices": []stripeapi.InvoiceItem{}})
		return
	}
	invoices, err := s.stripe.ListInvoices(r.Context(), sub.StripeCustomerID, 24)
	if err != nil {
		slog.Error("stripe list invoices", "error", err)
		writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not list Stripe invoices", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"invoices": invoices})
}

func (s *Server) handleCancelSubscription(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Immediately bool `json:"immediately"`
	}
	_ = decodeJSON(r, &req)
	if !s.stripe.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "billing is not configured", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	sub, err := s.store.GetSubscription(r.Context(), tx, claims.TenantID)
	if errors.Is(err, store.ErrNotFound) || sub.StripeSubscriptionID == "" {
		writeError(w, http.StatusBadRequest, "NO_ACTIVE_SUBSCRIPTION", "no Stripe subscription to cancel", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	var updated *stripeapi.Subscription
	if req.Immediately {
		updated, err = s.stripe.CancelSubscriptionNow(r.Context(), sub.StripeSubscriptionID)
	} else {
		updated, err = s.stripe.SetCancelAtPeriodEnd(r.Context(), sub.StripeSubscriptionID, true)
	}
	if err != nil {
		slog.Error("stripe cancel subscription", "error", err)
		writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not cancel subscription", nil)
		return
	}
	if err := s.syncSubscription(r.Context(), tx, claims.TenantID, updated); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	ent, err := s.loadEntitlementsForTenant(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"subscription": ent.Subscription,
		"entitlements": ent.Result,
	})
}

func (s *Server) handleResumeSubscription(w http.ResponseWriter, r *http.Request) {
	if !s.stripe.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "billing is not configured", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	sub, err := s.store.GetSubscription(r.Context(), tx, claims.TenantID)
	if errors.Is(err, store.ErrNotFound) || sub.StripeSubscriptionID == "" {
		writeError(w, http.StatusBadRequest, "NO_ACTIVE_SUBSCRIPTION", "no Stripe subscription to resume", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	updated, err := s.stripe.SetCancelAtPeriodEnd(r.Context(), sub.StripeSubscriptionID, false)
	if err != nil {
		slog.Error("stripe resume subscription", "error", err)
		writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not resume subscription", nil)
		return
	}
	if err := s.syncSubscription(r.Context(), tx, claims.TenantID, updated); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	ent, err := s.loadEntitlementsForTenant(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"subscription": ent.Subscription,
		"entitlements": ent.Result,
	})
}

func (s *Server) handleCancelClinicAccount(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	if claims == nil || claims.Role != "OWNER" {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "only the clinic owner can cancel the account", nil)
		return
	}
	var req struct {
		ConfirmSubdomain string `json:"confirm_subdomain"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	tx := txFrom(r.Context())
	tenant, err := s.store.GetTenantByID(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	if !strings.EqualFold(strings.TrimSpace(req.ConfirmSubdomain), tenant.Subdomain) {
		writeError(w, http.StatusBadRequest, "VALIDATION", "confirm_subdomain does not match clinic subdomain", nil)
		return
	}

	sub, err := s.store.GetSubscription(r.Context(), tx, claims.TenantID)
	if err == nil && sub.StripeSubscriptionID != "" && s.stripe.Enabled() {
		updated, cErr := s.stripe.CancelSubscriptionNow(r.Context(), sub.StripeSubscriptionID)
		if cErr != nil {
			slog.Error("stripe cancel subscription on account close", "error", cErr)
			writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not cancel Stripe subscription", nil)
			return
		}
		_ = s.syncSubscription(r.Context(), tx, claims.TenantID, updated)
	}

	if err := s.store.UpdateTenantStatus(r.Context(), tx, claims.TenantID, "CANCELED"); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not cancel clinic account", nil)
		return
	}
	_ = s.store.RevokeTenantSessions(r.Context(), tx, claims.TenantID)
	s.clearRefreshCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"status": "CANCELED"})
}

func (s *Server) handlePortal(w http.ResponseWriter, r *http.Request) {
	if !s.stripe.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "billing is not configured", nil)
		return
	}
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	sub, err := s.store.GetSubscription(r.Context(), tx, claims.TenantID)
	if err != nil || sub.StripeCustomerID == "" {
		writeError(w, http.StatusBadRequest, "NO_BILLING_CUSTOMER", "no billing customer for this tenant", nil)
		return
	}
	url, err := s.stripe.CreatePortal(r.Context(), sub.StripeCustomerID, s.cfg.StripePortalReturn)
	if err != nil {
		slog.Error("stripe portal", "error", err)
		writeError(w, http.StatusBadGateway, "STRIPE_ERROR", "could not open billing portal", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (s *Server) handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	if s.cfg.StripeWebhookSecret == "" {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "billing is not configured", nil)
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "could not read body", nil)
		return
	}
	if err := stripeapi.VerifyWebhook(body, r.Header.Get("Stripe-Signature"), s.cfg.StripeWebhookSecret); err != nil {
		slog.Warn("stripe webhook signature rejected", "error", err)
		writeError(w, http.StatusBadRequest, "INVALID_SIGNATURE", "invalid Stripe signature", nil)
		return
	}
	event, err := stripeapi.ParseEvent(body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid event", nil)
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var cs stripeapi.CheckoutSession
		if json.Unmarshal(event.Data.Object, &cs) == nil {
			tenantID := cs.Metadata["tenant_id"]
			if tenantID == "" {
				tenantID = cs.ClientReferenceID
			}
			if tenantID != "" {
				_ = s.db.WithTenant(r.Context(), tenantID, "", func(tx pgx.Tx) error {
					if cs.Customer != "" {
						if err := s.store.SetStripeCustomer(r.Context(), tx, tenantID, cs.Customer); err != nil {
							return err
						}
					}
					if cs.Subscription != "" {
						sub, err := s.stripe.GetSubscription(r.Context(), cs.Subscription)
						if err != nil {
							return err
						}
						return s.syncSubscription(r.Context(), tx, tenantID, sub)
					}
					return nil
				})
			}
		}
	case "customer.created":
		var cust stripeapi.Customer
		if json.Unmarshal(event.Data.Object, &cust) == nil {
			tenantID := cust.Metadata["tenant_id"]
			if tenantID != "" && cust.ID != "" {
				_ = s.db.WithTenant(r.Context(), tenantID, "", func(tx pgx.Tx) error {
					return s.store.SetStripeCustomer(r.Context(), tx, tenantID, cust.ID)
				})
			}
		}
	case "customer.deleted":
		var cust stripeapi.Customer
		if json.Unmarshal(event.Data.Object, &cust) == nil {
			tenantID := cust.Metadata["tenant_id"]
			if tenantID != "" && cust.ID != "" {
				_ = s.db.WithTenant(r.Context(), tenantID, "", func(tx pgx.Tx) error {
					return s.store.SetSubscriptionStatusByCustomer(r.Context(), tx, cust.ID, "CANCELED")
				})
			}
		}
	case "customer.subscription.created",
		"customer.subscription.updated",
		"customer.subscription.deleted",
		"customer.subscription.paused",
		"customer.subscription.resumed":
		var sub stripeapi.Subscription
		if json.Unmarshal(event.Data.Object, &sub) == nil {
			if event.Type == "customer.subscription.paused" && sub.Status == "" {
				sub.Status = "paused"
			}
			tenantID := sub.Metadata["tenant_id"]
			if tenantID != "" {
				_ = s.db.WithTenant(r.Context(), tenantID, "", func(tx pgx.Tx) error {
					return s.syncSubscription(r.Context(), tx, tenantID, &sub)
				})
			}
		}
	case "invoice.payment_failed", "invoice.paid", "invoice.payment_succeeded":
		var inv stripeapi.Invoice
		if json.Unmarshal(event.Data.Object, &inv) == nil {
			if subID := inv.SubscriptionID(); subID != "" && s.stripe.Enabled() {
				sub, err := s.stripe.GetSubscription(r.Context(), subID)
				if err == nil {
					tenantID := sub.Metadata["tenant_id"]
					if tenantID != "" {
						_ = s.db.WithTenant(r.Context(), tenantID, "", func(tx pgx.Tx) error {
							if event.Type == "invoice.payment_failed" {
								sub.Status = "past_due"
							}
							return s.syncSubscription(r.Context(), tx, tenantID, sub)
						})
					}
				}
			}
		}
	default:
		slog.Debug("unhandled stripe event", "type", event.Type)
	}

	writeJSON(w, http.StatusOK, map[string]bool{"received": true})
}

func (s *Server) syncSubscription(ctx context.Context, tx pgx.Tx, tenantID string, sub *stripeapi.Subscription) error {
	planKey := ""
	if priceID := sub.PriceID(); priceID != "" {
		if plan, err := s.store.GetPlanByStripePrice(ctx, tx, priceID); err == nil {
			planKey = plan.Key
		}
	}
	status := strings.ToUpper(sub.Status)
	if status == "INCOMPLETE_EXPIRED" {
		status = "CANCELED"
	}
	var trialEnds *time.Time
	if sub.TrialEnd > 0 {
		t := time.Unix(sub.TrialEnd, 0).UTC()
		trialEnds = &t
	}
	if err := s.store.UpsertSubscription(ctx, tx, tenantID, planKey, status, sub.Customer, sub.ID, sub.PeriodEnd(), sub.CancelAtPeriodEnd, trialEnds); err != nil {
		return err
	}
	return nil
}
