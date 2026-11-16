package store

import (
	"testing"
)

func TestNormalizeFindingCode(t *testing.T) {
	tests := []struct {
		code     string
		name     string
		expected string
	}{
		{"CARIES_ESMALTE", "Caries esmalte", "CARIES_ESMALTE"},
		{"", "Caries de esmalte / oclusal", "CARIES_DE_ESMALTE___OCLUSAL"},
		{"", "  Diente Incluido (Cordal)  ", "DIENTE_INCLUIDO_CORDAL"},
		{"", "Infección periapical", "INFECCION_PERIAPICAL"},
		{"", "", "FINDING"},
	}

	for _, tc := range tests {
		got := NormalizeFindingCode(tc.code, tc.name)
		if got != tc.expected {
			t.Errorf("NormalizeFindingCode(%q, %q) = %q; expected %q", tc.code, tc.name, got, tc.expected)
		}
	}
}

func TestDefaultStandardFindings(t *testing.T) {
	if len(DefaultStandardFindings) == 0 {
		t.Fatal("expected DefaultStandardFindings to be populated")
	}

	for _, f := range DefaultStandardFindings {
		if f.Code == "" {
			t.Errorf("finding %q missing code", f.Name)
		}
		if f.Name == "" {
			t.Errorf("finding with code %q missing name", f.Code)
		}
		if len(f.DefaultTreatmentCodes) == 0 {
			t.Errorf("finding %q should have at least 1 default treatment protocol", f.Code)
		}
	}
}
