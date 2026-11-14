package store

import (
	"testing"
	"time"
)

func TestComputeVerificationHash(t *testing.T) {
	tenantID := "ten-123"
	series := "FAC"
	invoiceNumber := 42
	total := 150.50
	date := time.Date(2026, 11, 13, 10, 0, 0, 0, time.UTC)

	hash1 := ComputeVerificationHash(tenantID, series, invoiceNumber, total, date)
	if len(hash1) != 64 {
		t.Fatalf("expected 64 char sha256 hex, got %d (%s)", len(hash1), hash1)
	}

	// Deterministic check
	hash2 := ComputeVerificationHash(tenantID, series, invoiceNumber, total, date)
	if hash1 != hash2 {
		t.Errorf("expected deterministic hash: %s != %s", hash1, hash2)
	}

	// Different total should produce different hash
	hash3 := ComputeVerificationHash(tenantID, series, invoiceNumber, 150.51, date)
	if hash1 == hash3 {
		t.Errorf("expected different hash for different amount")
	}
}
