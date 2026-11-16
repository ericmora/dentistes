package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCreateSpecialtyValidation(t *testing.T) {
	srv := &Server{}

	// Missing name
	req := httptest.NewRequest("POST", "/v1/specialties", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateSpecialty(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty name, got %d", rec.Code)
	}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("POST", "/v1/specialties", bytes.NewBufferString(`{invalid json`))
	recInvalid := httptest.NewRecorder()
	srv.handleCreateSpecialty(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad json, got %d", recInvalid.Code)
	}
}

func TestHandleSpecialtyParamsValidation(t *testing.T) {
	srv := &Server{}

	// Update without ID
	reqUpdate := httptest.NewRequest("PUT", "/v1/specialties/", bytes.NewBufferString(`{"name": "Test"}`))
	recUpdate := httptest.NewRecorder()
	srv.handleUpdateSpecialty(recUpdate, reqUpdate)

	if recUpdate.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 when missing id parameter in update, got %d", recUpdate.Code)
	}

	// Delete without ID
	reqDelete := httptest.NewRequest("DELETE", "/v1/specialties/", nil)
	recDelete := httptest.NewRecorder()
	srv.handleDeleteSpecialty(recDelete, reqDelete)

	if recDelete.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 when missing id parameter in delete, got %d", recDelete.Code)
	}
}
