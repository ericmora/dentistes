package httpapi

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestValidateLeadRequestValid(t *testing.T) {
	in, errMsg := validateLeadRequest(leadRequest{
		ContactName: "  Laia Serra ",
		ClinicName:  " Clínica Garraf ",
		Email:       "LAIA@CLINICA.CAT ",
		Phone:       " +34 600 111 222 ",
		Interest:    "demo",
		Lang:        "ca",
		UTMSource:   "google",
	}, "127.0.0.1")
	if errMsg != "" {
		t.Fatalf("expected valid lead, got error %q", errMsg)
	}
	if in.Email != "laia@clinica.cat" || in.Interest != "DEMO" || in.Lang != "ca" || in.Source != "landing" {
		t.Fatalf("unexpected normalized lead: %#v", in)
	}
}

func TestValidateLeadRequestRejectsInvalidFields(t *testing.T) {
	cases := []struct {
		name string
		req  leadRequest
	}{
		{"missing contact", leadRequest{ContactName: "A", ClinicName: "Clínica", Email: "a@b.com"}},
		{"missing clinic", leadRequest{ContactName: "Laia", ClinicName: "", Email: "a@b.com"}},
		{"invalid email", leadRequest{ContactName: "Laia", ClinicName: "Clínica", Email: "not-an-email"}},
		{"invalid interest", leadRequest{ContactName: "Laia", ClinicName: "Clínica", Email: "a@b.com", Interest: "SPAM"}},
	}
	for _, tc := range cases {
		if _, errMsg := validateLeadRequest(tc.req, "127.0.0.1"); errMsg == "" {
			t.Fatalf("%s: expected validation error", tc.name)
		}
	}
}

func TestHandleCreateLeadRejectsBadPayload(t *testing.T) {
	srv := &Server{}
	req := httptest.NewRequest(http.MethodPost, "/v1/public/leads", bytes.NewBufferString(`{"contact_name":"L","clinic_name":"C","email":"bad"}`))
	rec := httptest.NewRecorder()
	srv.handleCreateLead(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}
