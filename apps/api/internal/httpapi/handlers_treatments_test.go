package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCreateTreatmentValidation(t *testing.T) {
	srv := &Server{}

	// Missing name
	req := httptest.NewRequest("POST", "/v1/treatments", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateTreatment(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty name, got %d", rec.Code)
	}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("POST", "/v1/treatments", bytes.NewBufferString(`{invalid json`))
	recInvalid := httptest.NewRecorder()
	srv.handleCreateTreatment(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad json, got %d", recInvalid.Code)
	}
}
