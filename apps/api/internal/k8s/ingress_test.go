package k8s

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestBuildIngress(t *testing.T) {
	obj := buildIngress(
		"tenant-clinica-a",
		"dentistes",
		"clinica-a.dentistes.2mes4.com",
		"tenant-clinica-a-tls",
		"web",
		8080,
		"letsencrypt-prod",
	)
	if obj["apiVersion"] != "networking.k8s.io/v1" || obj["kind"] != "Ingress" {
		t.Fatalf("unexpected object: %#v", obj)
	}
	metadata := obj["metadata"].(map[string]any)
	if metadata["name"] != "tenant-clinica-a" || metadata["namespace"] != "dentistes" {
		t.Fatalf("unexpected metadata: %#v", metadata)
	}
	annotations := metadata["annotations"].(map[string]string)
	if annotations["cert-manager.io/cluster-issuer"] != "letsencrypt-prod" {
		t.Fatalf("missing issuer annotation: %#v", annotations)
	}
	spec := obj["spec"].(map[string]any)
	rules := spec["rules"].([]any)
	rule := rules[0].(map[string]any)
	if rule["host"] != "clinica-a.dentistes.2mes4.com" {
		t.Fatalf("unexpected host: %#v", rule)
	}
	tls := spec["tls"].([]any)
	tlsEntry := tls[0].(map[string]any)
	if tlsEntry["secretName"] != "tenant-clinica-a-tls" {
		t.Fatalf("unexpected tls secret: %#v", tlsEntry)
	}
}

func TestTenantIngressName(t *testing.T) {
	if got := TenantIngressName("clinica-a.dentistes.2mes4.com"); got != "tenant-clinica-a" {
		t.Fatalf("unexpected name %q", got)
	}
	longHost := "very-long-subdomain-that-exceeds-fifty-characters-limit-check.dentistes.cat"
	if len(TenantIngressName(longHost)) > 57 { // "tenant-" + 50
		t.Fatalf("name too long: %s", TenantIngressName(longHost))
	}
}

func TestEnsureTenantIngress(t *testing.T) {
	tmpDir := t.TempDir()
	tokenFile := filepath.Join(tmpDir, "token")
	_ = os.WriteFile(tokenFile, []byte("fake-token-123"), 0600)

	created := false
	updated := false

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer fake-token-123" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/apis/networking.k8s.io/v1/namespaces/test-ns/ingresses/tenant-new":
			w.WriteHeader(http.StatusNotFound)
		case r.Method == http.MethodPost && r.URL.Path == "/apis/networking.k8s.io/v1/namespaces/test-ns/ingresses":
			created = true
			w.WriteHeader(http.StatusCreated)
			_, _ = w.Write([]byte(`{"status":"created"}`))
		case r.Method == http.MethodGet && r.URL.Path == "/apis/networking.k8s.io/v1/namespaces/test-ns/ingresses/tenant-existing":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"metadata":{"resourceVersion":"12345"}}`))
		case r.Method == http.MethodPut && r.URL.Path == "/apis/networking.k8s.io/v1/namespaces/test-ns/ingresses/tenant-existing":
			updated = true
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"updated"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	client, err := New(ts.URL, tokenFile, "", "test-ns")
	if err != nil {
		t.Fatalf("failed to create client: %v", err)
	}

	ctx := context.Background()

	// Invalid hostname
	if err := client.EnsureTenantIngress(ctx, "invalid_hostname_with_underscores", "sec", "web", 8080, "issuer"); err == nil {
		t.Fatal("expected error on invalid hostname")
	}

	// Create new ingress (404 -> 201)
	if err := client.EnsureTenantIngress(ctx, "new.dentistes.cat", "sec-new", "web", 8080, "issuer"); err != nil {
		t.Fatalf("failed to ensure new ingress: %v", err)
	}
	if !created {
		t.Fatal("expected ingress to be created")
	}

	// Update existing ingress (200 -> 200)
	if err := client.EnsureTenantIngress(ctx, "existing.dentistes.cat", "sec-existing", "web", 8080, "issuer"); err != nil {
		t.Fatalf("failed to update existing ingress: %v", err)
	}
	if !updated {
		t.Fatal("expected ingress to be updated")
	}

	// Validation helpers
	if envOr("TEST_ENV_VAR_DEF", "default") != "default" {
		t.Fatal("envOr failed")
	}
	if truncate([]byte("short")) != "short" {
		t.Fatal("truncate short failed")
	}
}
