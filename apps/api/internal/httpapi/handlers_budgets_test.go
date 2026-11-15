package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleFindingsAndBudgetsValidation(t *testing.T) {
	srv := &Server{}

	// 1. Create finding validation: missing diagnosis
	reqFinding := httptest.NewRequest(http.MethodPost, "/v1/patients/p1/findings", bytes.NewBufferString(`{"tooth_number":"26","diagnosis":""}`))
	recFinding := httptest.NewRecorder()
	srv.handleCreatePatientFinding(recFinding, reqFinding)
	if recFinding.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty diagnosis, got %d", recFinding.Code)
	}

	// 2. Create budget validation: empty findings_blocks
	reqBudget := httptest.NewRequest(http.MethodPost, "/v1/patients/p1/budgets", bytes.NewBufferString(`{"title":"Plan A","findings_blocks":[]}`))
	recBudget := httptest.NewRecorder()
	srv.handleCreatePatientBudget(recBudget, reqBudget)
	if recBudget.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty findings_blocks, got %d", recBudget.Code)
	}

	// 3. Option response validation: invalid response status
	reqResp := httptest.NewRequest(http.MethodPatch, "/v1/budgets/b1/options-response", bytes.NewBufferString(`{"finding_id":"f1","option_id":"o1","patient_response":"INVALID"}`))
	recResp := httptest.NewRecorder()
	srv.handleUpdateBudgetOptionResponse(recResp, reqResp)
	if recResp.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid patient_response, got %d", recResp.Code)
	}

	// 4. Cancel finding validation: status=DISCARDED requires a clinical note
	reqCancelNoNote := httptest.NewRequest(http.MethodPatch, "/v1/findings/f1/status", bytes.NewBufferString(`{"status":"DISCARDED","notes":""}`))
	recCancelNoNote := httptest.NewRecorder()
	srv.handleUpdateFindingStatus(recCancelNoNote, reqCancelNoNote)
	if recCancelNoNote.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 when cancelling finding without clinical note, got %d", recCancelNoNote.Code)
	}
}
