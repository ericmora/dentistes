package store

import (
	"testing"
)

func TestNormalizeSpecialtyCode(t *testing.T) {
	tests := []struct {
		code string
		name string
		want string
	}{
		{"", "Ortodoncia", "ORTODONCIA"},
		{"", "Cirugía e Implantes", "CIRUGIA_E_IMPLANTES"},
		{"", "Odontopediatría!", "ODONTOPEDIATRIA"},
		{"ortho_1", "", "ORTHO_1"},
		{"  custom-code  ", "", "CUSTOM_CODE"},
		{"", "", "SPECIALTY"},
	}

	for _, tt := range tests {
		got := NormalizeSpecialtyCode(tt.code, tt.name)
		if got != tt.want {
			t.Errorf("NormalizeSpecialtyCode(%q, %q) = %q, want %q", tt.code, tt.name, got, tt.want)
		}
	}
}

func TestDefaultStandardSpecialties(t *testing.T) {
	if len(DefaultStandardSpecialties) == 0 {
		t.Fatalf("DefaultStandardSpecialties should not be empty")
	}

	codes := make(map[string]bool)
	names := make(map[string]bool)
	for _, spec := range DefaultStandardSpecialties {
		if spec.Code == "" {
			t.Errorf("Specialty %+v has empty Code", spec)
		}
		if spec.Name == "" {
			t.Errorf("Specialty %+v has empty Name", spec)
		}
		if spec.ColorCode == "" {
			t.Errorf("Specialty %+v has empty ColorCode", spec)
		}
		if codes[spec.Code] {
			t.Errorf("Duplicate specialty code found: %s", spec.Code)
		}
		if names[spec.Name] {
			t.Errorf("Duplicate specialty name found: %s", spec.Name)
		}
		codes[spec.Code] = true
		names[spec.Name] = true
	}

	// Verify standard categories present
	expected := []string{"PREVENCION", "CONSERVADORA", "ENDODONCIA", "CIRUGIA", "IMPLANTES", "PERIODONCIA", "PROTESIS", "ORTODONCIA", "ESTETICA", "ODONTOPEDIATRIA", "HIGIENE", "GENERAL"}
	for _, code := range expected {
		if !codes[code] {
			t.Errorf("Expected standard code %s not found in DefaultStandardSpecialties", code)
		}
	}
}
