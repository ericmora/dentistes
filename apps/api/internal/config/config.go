package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port           string
	DatabaseURL    string
	MigrationDatabaseURL string
	JWTSecret      string
	AccessTTL              time.Duration
	RefreshTTL             time.Duration
	CookieSecure           bool
	CookieDomain           string
	CORSOrigins            []string
	AppURL                 string
	AdminURL               string
	MarketingURL           string
	StripeSecretKey        string
	StripeWebhookSecret    string
	StripePortalReturn     string
	TrialDays              int
	BootstrapAdminEmail    string
	BootstrapAdminPassword string
}

func Load() (*Config, error) {
	c := &Config{
		Port:          env("PORT", "8080"),
		DatabaseURL:   env("DATABASE_URL", ""),
		MigrationDatabaseURL: env("MIGRATION_DATABASE_URL", env("DATABASE_URL", "")),
		JWTSecret:     env("JWT_SECRET", ""),
		AccessTTL:              duration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTTL:             duration("REFRESH_TOKEN_TTL", 720*time.Hour),
		CookieSecure:           boolEnv("COOKIE_SECURE", false),
		CookieDomain:           env("COOKIE_DOMAIN", ""),
		CORSOrigins:            listEnv("CORS_ORIGINS"),
		AppURL:                 strings.TrimRight(env("APP_URL", "http://localhost:5173"), "/"),
		AdminURL:               strings.TrimRight(env("ADMIN_URL", "http://localhost:5174"), "/"),
		MarketingURL:           strings.TrimRight(env("MARKETING_URL", "http://localhost:5175"), "/"),
		StripeSecretKey:        env("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret:    env("STRIPE_WEBHOOK_SECRET", ""),
		StripePortalReturn:     strings.TrimRight(env("STRIPE_PORTAL_RETURN_URL", env("APP_URL", "http://localhost:5173")+"/settings/billing"), "/"),
		TrialDays:              intEnv("TRIAL_DAYS", 14),
		BootstrapAdminEmail:    env("BOOTSTRAP_ADMIN_EMAIL", ""),
		BootstrapAdminPassword: env("BOOTSTRAP_ADMIN_PASSWORD", ""),
	}

	if c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if len(c.JWTSecret) < 16 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 16 characters")
	}
	if c.AccessTTL <= 0 {
		c.AccessTTL = 15 * time.Minute
	}
	if c.RefreshTTL <= 0 {
		c.RefreshTTL = 720 * time.Hour
	}
	if c.TrialDays <= 0 {
		c.TrialDays = 14
	}
	return c, nil
}

func env(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func boolEnv(key string, def bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return def
	}
	return b
}

func intEnv(key string, def int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func duration(key string, def time.Duration) time.Duration {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return def
	}
	return d
}

func listEnv(key string) []string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
