package fiscal

import (
	"strings"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

const (
	FlagElectronicInvoicing = "fiscal.electronic_invoicing"
)

type CapabilitiesResponse struct {
	TenantID     string       `json:"tenant_id"`
	CountryCode  string       `json:"country_code"`
	Currency     string       `json:"currency"`
	Localization Localization `json:"localization"`
	Features     Features     `json:"features"`
}

type Localization struct {
	TaxIDLabel        string `json:"tax_id_label"`
	TaxIDPlaceholder  string `json:"tax_id_placeholder"`
	FiscalAuthority   string `json:"fiscal_authority"`
	DocumentLabel     string `json:"document_label"`
}

type Features struct {
	ElectronicInvoicing ElectronicInvoicingFeature `json:"electronic_invoicing"`
	InternalCashRegister InternalCashRegisterFeature `json:"internal_cash_register"`
}

type ElectronicInvoicingFeature struct {
	Status         string `json:"status"`
	Enabled        bool   `json:"enabled"`
	WaitlistJoined bool   `json:"waitlist_joined"`
	FallbackMode   string `json:"fallback_mode"`
	UINotice       string `json:"ui_notice,omitempty"`
}

type InternalCashRegisterFeature struct {
	Status  string `json:"status"`
	Enabled bool   `json:"enabled"`
}

func placeholderForCountry(countryCode string) string {
	switch strings.ToUpper(countryCode) {
	case "ES":
		return "B12345678"
	case "MX":
		return "XAXX010101000"
	case "CO":
		return "900123456-1"
	case "PE":
		return "20123456789"
	case "CL":
		return "76123456-7"
	case "AR":
		return "30712345678"
	default:
		return "TAX-ID-123"
	}
}

func ResolveCapabilities(tenantID string, cfg *store.RegionalFiscalConfig, override *store.TenantFeatureFlag) CapabilitiesResponse {
	if cfg == nil {
		cfg = &store.RegionalFiscalConfig{
			CountryCode:        "ES",
			CountryName:        "Espanya",
			CurrencyCode:       "EUR",
			TaxAuthorityName:   "AEAT",
			FiscalDocumentName: "VeriFactu / TicketBAI",
			TaxIDLabel:         "NIF",
			TaxIDRegex:         "^[A-Z0-9]{8,10}$",
			ComplianceStatus:   "ACTIVE_DIRECT",
			RequiresPartner:    false,
			AdapterClass:       "VeriFactuAdapter",
			RetentionYears:     5,
		}
	}

	resp := CapabilitiesResponse{
		TenantID:    tenantID,
		CountryCode: cfg.CountryCode,
		Currency:    cfg.CurrencyCode,
		Localization: Localization{
			TaxIDLabel:       cfg.TaxIDLabel,
			TaxIDPlaceholder: placeholderForCountry(cfg.CountryCode),
			FiscalAuthority:  cfg.TaxAuthorityName,
			DocumentLabel:    cfg.FiscalDocumentName,
		},
		Features: Features{
			InternalCashRegister: InternalCashRegisterFeature{
				Status:  "ACTIVE",
				Enabled: true,
			},
		},
	}

	// Evaluació segons les regles de precedència (3.3 de l'especificació)
	// 1. Override explícit de Tenant
	if override != nil {
		if override.IsEnabled {
			resp.Features.ElectronicInvoicing = ElectronicInvoicingFeature{
				Status:       override.RolloutStage,
				Enabled:      true,
				FallbackMode: "INTERNAL_RECEIPT_PDF",
			}
			return resp
		}
		if override.RolloutStage == "WAITLIST" {
			resp.Features.ElectronicInvoicing = ElectronicInvoicingFeature{
				Status:         cfg.ComplianceStatus,
				Enabled:        false,
				WaitlistJoined: true,
				FallbackMode:   "INTERNAL_RECEIPT_PDF",
				UINotice:       noticeForComingSoon(cfg),
			}
			return resp
		}
	}

	// 2. Estat global del país
	switch cfg.ComplianceStatus {
	case "ACTIVE_DIRECT", "ACTIVE_PARTNER":
		resp.Features.ElectronicInvoicing = ElectronicInvoicingFeature{
			Status:       "ACTIVE",
			Enabled:      true,
			FallbackMode: "INTERNAL_RECEIPT_PDF",
		}
	case "COMING_SOON":
		resp.Features.ElectronicInvoicing = ElectronicInvoicingFeature{
			Status:         "COMING_SOON",
			Enabled:        false,
			WaitlistJoined: false,
			FallbackMode:   "INTERNAL_RECEIPT_PDF",
			UINotice:       noticeForComingSoon(cfg),
		}
	default: // "INTERNAL_ONLY"
		resp.Features.ElectronicInvoicing = ElectronicInvoicingFeature{
			Status:       "INTERNAL_ONLY",
			Enabled:      false,
			FallbackMode: "INTERNAL_RECEIPT_PDF",
		}
	}

	return resp
}

func noticeForComingSoon(cfg *store.RegionalFiscalConfig) string {
	return "La facturació electrònica " + cfg.FiscalDocumentName + " (" + cfg.TaxAuthorityName + ") està en fase d'integració. Pots emetre pressupostos i rebuts interns ara mateix i apuntar-te per activar el timbrat automàtic."
}
