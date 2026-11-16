package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTrackingPixel(t *testing.T) {
	srv := &Server{}
	req := httptest.NewRequest("GET", "/v1/tracking/pixel/sampletoken123.png", nil)
	rec := httptest.NewRecorder()

	srv.handleTrackingPixel(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "image/png" {
		t.Fatalf("expected Content-Type image/png, got %s", ct)
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "no-cache, no-store, must-revalidate" {
		t.Fatalf("expected no-store Cache-Control, got %s", cc)
	}
	if !bytes.Equal(rec.Body.Bytes(), transparent1x1PNG) {
		t.Fatalf("expected transparent 1x1 png bytes, got length %d", rec.Body.Len())
	}
}

func TestTrackingClickRedirect(t *testing.T) {
	srv := &Server{}
	req := httptest.NewRequest("GET", "/v1/tracking/click/sampletoken123", nil)
	rec := httptest.NewRecorder()

	srv.handleTrackingClick(rec, req)

	if rec.Code != http.StatusFound {
		t.Fatalf("expected status 302, got %d", rec.Code)
	}
	loc := rec.Header().Get("Location")
	if loc == "" {
		t.Fatalf("expected redirect location header")
	}
}

func TestAdminWinbackValidation(t *testing.T) {
	srv := &Server{}

	// Update template missing id
	reqUpdate := httptest.NewRequest("PUT", "/v1/admin/winback/templates/", bytes.NewBufferString(`{"subject":"test"}`))
	recUpdate := httptest.NewRecorder()
	srv.handleAdminUpdateWinbackTemplate(recUpdate, reqUpdate)
	if recUpdate.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing template id, got %d", recUpdate.Code)
	}

	// Test email missing recipient
	reqEmail := httptest.NewRequest("POST", "/v1/admin/winback/test-email", bytes.NewBufferString(`{"recipient_email":""}`))
	recEmail := httptest.NewRecorder()
	srv.handleAdminSendTestWinbackEmail(recEmail, reqEmail)
	if recEmail.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty recipient email, got %d", recEmail.Code)
	}
}
