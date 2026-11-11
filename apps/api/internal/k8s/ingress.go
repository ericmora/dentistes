package k8s

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

var hostnameRe = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$`)

type Client struct {
	baseURL   string
	namespace string
	tokenFile string
	http      *http.Client
}

func NewInCluster() (*Client, error) {
	baseURL := strings.TrimRight(envOr("K8S_API_URL", "https://kubernetes.default.svc"), "/")
	tokenFile := envOr("K8S_TOKEN_FILE", "/var/run/secrets/kubernetes.io/serviceaccount/token")
	caFile := envOr("K8S_CA_FILE", "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt")
	namespace := os.Getenv("POD_NAMESPACE")
	if namespace == "" {
		raw, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace")
		if err != nil {
			return nil, fmt.Errorf("read namespace: %w", err)
		}
		namespace = strings.TrimSpace(string(raw))
	}
	return New(baseURL, tokenFile, caFile, namespace)
}

func New(baseURL, tokenFile, caFile, namespace string) (*Client, error) {
	if namespace == "" {
		return nil, fmt.Errorf("namespace is required")
	}
	if _, err := os.Stat(tokenFile); err != nil {
		return nil, fmt.Errorf("service account token: %w", err)
	}
	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12}
	if strings.HasPrefix(baseURL, "https://") {
		pem, err := os.ReadFile(caFile)
		if err != nil {
			return nil, fmt.Errorf("service account CA: %w", err)
		}
		pool := x509.NewCertPool()
		if !pool.AppendCertsFromPEM(pem) {
			return nil, fmt.Errorf("invalid service account CA")
		}
		tlsConfig.RootCAs = pool
	}
	transport := &http.Transport{TLSClientConfig: tlsConfig, MaxIdleConns: 10, IdleConnTimeout: 30 * time.Second}
	return &Client{
		baseURL:   strings.TrimRight(baseURL, "/"),
		namespace: namespace,
		tokenFile: tokenFile,
		http:      &http.Client{Timeout: 15 * time.Second, Transport: transport},
	}, nil
}

func (c *Client) EnsureTenantIngress(ctx context.Context, hostname, tlsSecret, service string, port int, issuer string) error {
	if !hostnameRe.MatchString(hostname) {
		return fmt.Errorf("invalid hostname %q", hostname)
	}
	name := TenantIngressName(hostname)
	desired := buildIngress(name, c.namespace, hostname, tlsSecret, service, port, issuer)
	itemPath := fmt.Sprintf("/apis/networking.k8s.io/v1/namespaces/%s/ingresses/%s", c.namespace, name)

	status, body, err := c.do(ctx, http.MethodGet, itemPath, nil)
	if err != nil {
		return err
	}
	switch status {
	case http.StatusOK:
		var existing struct {
			Metadata struct {
				ResourceVersion string `json:"resourceVersion"`
			} `json:"metadata"`
		}
		if err := json.Unmarshal(body, &existing); err != nil {
			return fmt.Errorf("decode existing ingress: %w", err)
		}
		desired["metadata"].(map[string]any)["resourceVersion"] = existing.Metadata.ResourceVersion
		status, body, err = c.do(ctx, http.MethodPut, itemPath, desired)
		if err != nil {
			return err
		}
		if status < 200 || status >= 300 {
			return fmt.Errorf("update ingress: %d %s", status, truncate(body))
		}
		return nil
	case http.StatusNotFound:
		collection := fmt.Sprintf("/apis/networking.k8s.io/v1/namespaces/%s/ingresses", c.namespace)
		status, body, err = c.do(ctx, http.MethodPost, collection, desired)
		if err != nil {
			return err
		}
		if status < 200 || status >= 300 {
			return fmt.Errorf("create ingress: %d %s", status, truncate(body))
		}
		return nil
	default:
		return fmt.Errorf("get ingress: %d %s", status, truncate(body))
	}
}

func (c *Client) do(ctx context.Context, method, path string, payload any) (int, []byte, error) {
	var body io.Reader
	if payload != nil {
		raw, err := json.Marshal(payload)
		if err != nil {
			return 0, nil, err
		}
		body = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
	if err != nil {
		return 0, nil, err
	}
	token, err := os.ReadFile(c.tokenFile)
	if err != nil {
		return 0, nil, fmt.Errorf("read service account token: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(string(token)))
	req.Header.Set("Accept", "application/json")
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := c.http.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return 0, nil, err
	}
	return res.StatusCode, raw, nil
}

func TenantIngressName(hostname string) string {
	label := strings.Split(hostname, ".")[0]
	label = strings.ToLower(label)
	label = strings.Trim(label, "-")
	if len(label) > 50 {
		label = label[:50]
	}
	return "tenant-" + label
}

func buildIngress(name, namespace, hostname, tlsSecret, service string, port int, issuer string) map[string]any {
	path := map[string]any{
		"path":     "/",
		"pathType": "Prefix",
		"backend": map[string]any{
			"service": map[string]any{
				"name": service,
				"port": map[string]any{"number": port},
			},
		},
	}
	return map[string]any{
		"apiVersion": "networking.k8s.io/v1",
		"kind":       "Ingress",
		"metadata": map[string]any{
			"name":      name,
			"namespace": namespace,
			"labels": map[string]string{
				"app.kubernetes.io/name":       "web",
				"app.kubernetes.io/managed-by": "dentistes",
				"dentistes.io/tenant":          strings.Split(hostname, ".")[0],
			},
			"annotations": map[string]string{
				"cert-manager.io/cluster-issuer":                  issuer,
				"traefik.ingress.kubernetes.io/router.entrypoints": "web,websecure",
			},
		},
		"spec": map[string]any{
			"ingressClassName": "traefik",
			"rules": []any{
				map[string]any{
					"host": hostname,
					"http": map[string]any{"paths": []any{path}},
				},
			},
			"tls": []any{
				map[string]any{"hosts": []any{hostname}, "secretName": tlsSecret},
			},
		},
	}
}

func envOr(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func truncate(raw []byte) string {
	text := strings.TrimSpace(string(raw))
	if len(text) > 300 {
		return text[:300] + "..."
	}
	return text
}
