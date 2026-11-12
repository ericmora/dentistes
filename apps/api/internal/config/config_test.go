package config

import (
	"os"
	"testing"
	"time"
)

func TestConfigLoadDefaultsAndValidation(t *testing.T) {
	os.Clearenv()

	// Missing DATABASE_URL
	_, err := Load()
	if err == nil || err.Error() != "DATABASE_URL is required" {
		t.Fatalf("expected DATABASE_URL error, got %v", err)
	}

	// Missing/short JWT_SECRET
	os.Setenv("DATABASE_URL", "postgres://localhost/dentistes")
	os.Setenv("JWT_SECRET", "short")
	_, err = Load()
	if err == nil || err.Error() != "JWT_SECRET must be at least 16 characters" {
		t.Fatalf("expected JWT_SECRET error, got %v", err)
	}

	// Empty TENANT_BASE_DOMAIN
	os.Setenv("JWT_SECRET", "super-secret-key-16-bytes-min!")
	os.Setenv("TENANT_BASE_DOMAIN", ".")
	_, err = Load()
	if err == nil || err.Error() != "TENANT_BASE_DOMAIN is required" {
		t.Fatalf("expected TENANT_BASE_DOMAIN error, got %v", err)
	}

	// Valid load with defaults
	os.Setenv("TENANT_BASE_DOMAIN", "dentistes.2mes4.com")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected load error: %v", err)
	}
	if cfg.Port != "8080" || cfg.TrialDays != 30 || cfg.WebServicePort != 8080 {
		t.Fatalf("unexpected defaults: %#v", cfg)
	}
	if cfg.AccessTTL != 15*time.Minute || cfg.RefreshTTL != 720*time.Hour || cfg.ProvisionInterval != 30*time.Second {
		t.Fatalf("unexpected duration defaults: %#v", cfg)
	}
}

func TestConfigEnvParsers(t *testing.T) {
	os.Clearenv()
	os.Setenv("DATABASE_URL", "postgres://localhost/dentistes")
	os.Setenv("JWT_SECRET", "super-secret-key-16-bytes-min!")
	os.Setenv("TENANT_BASE_DOMAIN", "dentistes.2mes4.com")

	// Custom valid values
	os.Setenv("COOKIE_SECURE", "true")
	os.Setenv("TRIAL_DAYS", "45")
	os.Setenv("ACCESS_TOKEN_TTL", "30m")
	os.Setenv("REFRESH_TOKEN_TTL", "100h")
	os.Setenv("PROVISION_INTERVAL", "1m")
	os.Setenv("WEB_SERVICE_PORT", "9090")
	os.Setenv("CORS_ORIGINS", "http://localhost:3000, http://localhost:3001 , ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("failed to load custom env: %v", err)
	}
	if !cfg.CookieSecure || cfg.TrialDays != 45 || cfg.WebServicePort != 9090 {
		t.Fatalf("mismatched values: %#v", cfg)
	}
	if len(cfg.CORSOrigins) != 2 || cfg.CORSOrigins[0] != "http://localhost:3000" || cfg.CORSOrigins[1] != "http://localhost:3001" {
		t.Fatalf("mismatched cors origins: %#v", cfg.CORSOrigins)
	}

	// Fallback branches on invalid parsing
	os.Setenv("COOKIE_SECURE", "not-a-bool")
	os.Setenv("TRIAL_DAYS", "not-an-int")
	os.Setenv("ACCESS_TOKEN_TTL", "invalid-duration")
	os.Setenv("WEB_SERVICE_PORT", "9999999") // out of bounds
	os.Setenv("PROVISION_INTERVAL", "not-a-duration")

	cfg2, err := Load()
	if err != nil {
		t.Fatalf("unexpected error with invalid fallback env: %v", err)
	}
	if cfg2.CookieSecure != false || cfg2.TrialDays != 30 || cfg2.WebServicePort != 8080 {
		t.Fatalf("fallback values failed: %#v", cfg2)
	}

	// Test boundary branches
	os.Setenv("ACCESS_TOKEN_TTL", "-5m")
	os.Setenv("REFRESH_TOKEN_TTL", "-10h")
	os.Setenv("TRIAL_DAYS", "-1")
	os.Setenv("PROVISION_INTERVAL", "-1s")
	cfg3, _ := Load()
	if cfg3.AccessTTL != 15*time.Minute || cfg3.RefreshTTL != 720*time.Hour || cfg3.TrialDays != 30 || cfg3.ProvisionInterval != 30*time.Second {
		t.Fatalf("expected negative duration/trial fallbacks, got %#v", cfg3)
	}

	if env("NON_EXISTENT", "default_val") != "default_val" {
		t.Fatal("env fallback failed")
	}
	if boolEnv("NON_EXISTENT", true) != true {
		t.Fatal("boolEnv fallback failed")
	}
	if intEnv("NON_EXISTENT", 42) != 42 {
		t.Fatal("intEnv fallback failed")
	}
	if duration("NON_EXISTENT", 5*time.Second) != 5*time.Second {
		t.Fatal("duration fallback failed")
	}
	if listEnv("EMPTY_KEY") != nil {
		t.Fatal("listEnv empty failed")
	}
}
