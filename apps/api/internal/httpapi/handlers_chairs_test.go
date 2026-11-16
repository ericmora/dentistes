package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCreateChairValidation(t *testing.T) {
	srv := &Server{}

	// Missing name
	req := httptest.NewRequest("POST", "/v1/chairs", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateChair(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty chair name, got %d", rec.Code)
	}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("POST", "/v1/chairs", bytes.NewBufferString(`{bad json`))
	recInvalid := httptest.NewRecorder()
	srv.handleCreateChair(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for invalid JSON, got %d", recInvalid.Code)
	}
}

func TestHandleUpdateChairValidation(t *testing.T) {
	srv := &Server{}

	req := httptest.NewRequest("PUT", "/v1/chairs/c-1", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleUpdateChair(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty name, got %d", rec.Code)
	}
}
