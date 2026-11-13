package fiscal_test

import (
	"testing"

	"github.com/ericmora/dentistes/apps/api/internal/fiscal"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func TestResolveCapabilities_ActiveDirect(t *testing.T) {
	config := &store.RegionalFiscalConfig{
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
		DefaultVATRate:     0.0,
		RetentionYears:     5,
	}

	caps := fiscal.ResolveCapabilities("tenant-1", config, nil)

	if caps.CountryCode != "ES" {
		t.Fatalf("expected country ES, got %s", caps.CountryCode)
	}
	if caps.Currency != "EUR" {
		t.Fatalf("expected currency EUR, got %s", caps.Currency)
	}
	if caps.Localization.TaxIDLabel != "NIF" {
		t.Fatalf("expected tax label NIF, got %s", caps.Localization.TaxIDLabel)
	}
	if !caps.Features.ElectronicInvoicing.Enabled {
		t.Fatalf("expected electronic invoicing to be enabled for ACTIVE_DIRECT")
	}
	if caps.Features.ElectronicInvoicing.Status != "ACTIVE" {
		t.Fatalf("expected status ACTIVE, got %s", caps.Features.ElectronicInvoicing.Status)
	}
}

func TestResolveCapabilities_ComingSoon_Waitlist(t *testing.T) {
	config := &store.RegionalFiscalConfig{
		CountryCode:        "MX",
		CountryName:        "Mèxic",
		CurrencyCode:       "MXN",
		TaxAuthorityName:   "SAT",
		FiscalDocumentName: "CFDI 4.0",
		TaxIDLabel:         "RFC",
		TaxIDRegex:         "^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$",
		ComplianceStatus:   "COMING_SOON",
		RequiresPartner:    true,
		AdapterClass:       "SatMexicoAdapter",
	}

	// Case 1: No override yet
	caps := fiscal.ResolveCapabilities("tenant-mx", config, nil)
	if caps.Features.ElectronicInvoicing.Enabled {
		t.Fatalf("expected electronic invoicing to be disabled for COMING_SOON")
	}
	if caps.Features.ElectronicInvoicing.Status != "COMING_SOON" {
		t.Fatalf("expected COMING_SOON status")
	}
	if caps.Features.ElectronicInvoicing.WaitlistJoined {
		t.Fatalf("expected waitlist_joined to be false")
	}

	// Case 2: Tenant joined waitlist
	flagWaitlist := &store.TenantFeatureFlag{
		TenantID:     "tenant-mx",
		FlagKey:      fiscal.FlagElectronicInvoicing,
		IsEnabled:    false,
		RolloutStage: "WAITLIST",
	}
	capsWaitlist := fiscal.ResolveCapabilities("tenant-mx", config, flagWaitlist)
	if !capsWaitlist.Features.ElectronicInvoicing.WaitlistJoined {
		t.Fatalf("expected waitlist_joined to be true")
	}

	// Case 3: Tenant has explicit pilot/beta override
	flagOverride := &store.TenantFeatureFlag{
		TenantID:     "tenant-mx",
		FlagKey:      fiscal.FlagElectronicInvoicing,
		IsEnabled:    true,
		RolloutStage: "BETA",
	}
	capsBeta := fiscal.ResolveCapabilities("tenant-mx", config, flagOverride)
	if !capsBeta.Features.ElectronicInvoicing.Enabled {
		t.Fatalf("expected override to enable electronic invoicing")
	}
	if capsBeta.Features.ElectronicInvoicing.Status != "BETA" {
		t.Fatalf("expected BETA status from override, got %s", capsBeta.Features.ElectronicInvoicing.Status)
	}
}

func TestResolveCapabilities_DefaultFallback(t *testing.T) {
	caps := fiscal.ResolveCapabilities("tenant-unknown", nil, nil)
	if caps.CountryCode != "ES" {
		t.Fatalf("expected default country ES, got %s", caps.CountryCode)
	}
	if caps.Currency != "EUR" {
		t.Fatalf("expected default currency EUR, got %s", caps.Currency)
	}
	if caps.Localization.TaxIDPlaceholder != "B12345678" {
		t.Fatalf("expected default ES placeholder, got %s", caps.Localization.TaxIDPlaceholder)
	}
}

func TestResolveCapabilities_PlaceholdersAndStatuses(t *testing.T) {
	countries := []struct {
		code        string
		status      string
		expectedPh  string
		expectedAct bool
	}{
		{"CO", "ACTIVE_DIRECT", "900123456-1", true},
		{"PE", "ACTIVE_PARTNER", "20123456789", true},
		{"CL", "ACTIVE_DIRECT", "76123456-7", true},
		{"AR", "ACTIVE_DIRECT", "30712345678", true},
		{"BO", "INTERNAL_ONLY", "TAX-ID-123", false},
	}

	for _, c := range countries {
		cfg := &store.RegionalFiscalConfig{
			CountryCode:      c.code,
			ComplianceStatus: c.status,
		}
		res := fiscal.ResolveCapabilities("t", cfg, nil)
		if res.Localization.TaxIDPlaceholder != c.expectedPh {
			t.Errorf("country %s: expected placeholder %s, got %s", c.code, c.expectedPh, res.Localization.TaxIDPlaceholder)
		}
		if res.Features.ElectronicInvoicing.Enabled != c.expectedAct {
			t.Errorf("country %s: expected enabled %v, got %v", c.code, c.expectedAct, res.Features.ElectronicInvoicing.Enabled)
		}
	}
}
