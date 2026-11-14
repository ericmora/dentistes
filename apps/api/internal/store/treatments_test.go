package store

import (
	"testing"
)

func TestCategoryLabel(t *testing.T) {
	tests := []struct {
		cat  string
		want string
	}{
		{"PREVENCION", "Diagnóstico y Prevención"},
		{"CONSERVADORA", "Conservadora"},
		{"ENDODONCIA", "Endodoncia"},
		{"CIRUGIA", "Cirugía e Implantes"},
		{"PERIODONCIA", "Periodoncia"},
		{"PROTESIS", "Prótesis"},
		{"ORTODONCIA", "Ortodoncia"},
		{"ESTETICA", "Estética dental"},
		{"UNKNOWN", "General"},
	}

	for _, tt := range tests {
		got := CategoryLabel(tt.cat)
		if got != tt.want {
			t.Errorf("CategoryLabel(%q) = %q, want %q", tt.cat, got, tt.want)
		}
	}
}

func TestDefaultStandardTreatments(t *testing.T) {
	if len(DefaultStandardTreatments) == 0 {
		t.Fatalf("DefaultStandardTreatments should not be empty")
	}

	codes := make(map[string]bool)
	for _, tr := range DefaultStandardTreatments {
		if tr.Code == "" {
			t.Errorf("Treatment %+v has empty Code", tr)
		}
		if tr.Name == "" {
			t.Errorf("Treatment %+v has empty Name", tr)
		}
		if tr.EstimatedMinutes <= 0 {
			t.Errorf("Treatment %+v has invalid EstimatedMinutes: %d", tr, tr.EstimatedMinutes)
		}
		if tr.DefaultPrice < 0 {
			t.Errorf("Treatment %+v has negative DefaultPrice: %f", tr, tr.DefaultPrice)
		}
		if codes[tr.Code] {
			t.Errorf("Duplicate treatment code found: %s", tr.Code)
		}
		codes[tr.Code] = true
	}
}
