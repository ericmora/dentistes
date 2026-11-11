package k8s

import "testing"

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
}
