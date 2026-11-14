package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCreateShiftValidation(t *testing.T) {
	srv := &Server{}

	// Missing fields
	req := httptest.NewRequest("POST", "/v1/shifts", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateShift(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty shift, got %d", rec.Code)
	}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("POST", "/v1/shifts", bytes.NewBufferString(`{bad json`))
	recInvalid := httptest.NewRecorder()
	srv.handleCreateShift(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad json, got %d", recInvalid.Code)
	}
}

func TestHandleCreateHolidayValidation(t *testing.T) {
	srv := &Server{}

	// Missing date/name
	req := httptest.NewRequest("POST", "/v1/holidays", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateHoliday(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty holiday, got %d", rec.Code)
	}
}

func TestHandleCreateShiftOverrideValidation(t *testing.T) {
	srv := &Server{}

	// Missing override_date
	req := httptest.NewRequest("POST", "/v1/shifts/overrides", bytes.NewBufferString(`{"override_date": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateShiftOverride(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty override_date, got %d", rec.Code)
	}
}
