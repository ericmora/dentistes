package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCreateFindingMasterValidation(t *testing.T) {
	srv := &Server{}

	// Missing name
	req := httptest.NewRequest("POST", "/v1/findings/catalog", bytes.NewBufferString(`{"name": ""}`))
	rec := httptest.NewRecorder()
	srv.handleCreateFindingMaster(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty name, got %d", rec.Code)
	}

	// Invalid JSON
	reqInvalid := httptest.NewRequest("POST", "/v1/findings/catalog", bytes.NewBufferString(`{bad json`))
	recInvalid := httptest.NewRecorder()
	srv.handleCreateFindingMaster(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad json, got %d", recInvalid.Code)
	}
}

func TestHandleFindingMasterParamsValidation(t *testing.T) {
	srv := &Server{}

	// Update without ID
	reqUpdate := httptest.NewRequest("PUT", "/v1/findings/catalog/", bytes.NewBufferString(`{"name": "Caries"}`))
	recUpdate := httptest.NewRecorder()
	srv.handleUpdateFindingMaster(recUpdate, reqUpdate)

	if recUpdate.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 when missing id parameter in update, got %d", recUpdate.Code)
	}

	// Delete without ID
	reqDelete := httptest.NewRequest("DELETE", "/v1/findings/catalog/", nil)
	recDelete := httptest.NewRecorder()
	srv.handleDeleteFindingMaster(recDelete, reqDelete)

	if recDelete.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 when missing id parameter in delete, got %d", recDelete.Code)
	}
}
