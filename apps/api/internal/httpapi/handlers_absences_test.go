package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCreateAbsenceValidation(t *testing.T) {
	srv := &Server{}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("POST", "/v1/absences", bytes.NewBufferString(`{bad json`))
	recInvalid := httptest.NewRecorder()
	srv.handleCreateStaffAbsence(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad json, got %d", recInvalid.Code)
	}
}

func TestHandleUpdateAbsenceStatusValidation(t *testing.T) {
	srv := &Server{}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("PUT", "/v1/absences/abs-1/status", bytes.NewBufferString(`{bad json`))
	recInvalid := httptest.NewRecorder()
	srv.handleUpdateStaffAbsenceStatus(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad json, got %d", recInvalid.Code)
	}
}
