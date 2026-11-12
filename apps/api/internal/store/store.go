package store

import (
	"errors"
	"time"
)

var ErrNotFound = errors.New("not found")

type Store struct{}

func New() *Store { return &Store{} }

type User struct {
	ID              string
	Email           string
	PasswordHash    string
	FullName        string
	IsPlatformAdmin bool
	IsActive        bool
}

type Membership struct {
	ID           string
	TenantID     string
	UserID       string
	Role         string
	TenantName   string
	Subdomain    string
	TenantStatus string
}

type Tenant struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Subdomain   string     `json:"subdomain"`
	Status      string     `json:"status"`
	TrialEndsAt *time.Time `json:"trial_ends_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Plan struct {
	Key               string   `json:"key"`
	Name              string   `json:"name"`
	Description       string   `json:"description"`
	PriceMonthlyCents int      `json:"price_monthly_cents"`
	Currency          string   `json:"currency"`
	StripeProductID   string   `json:"stripe_product_id,omitempty"`
	StripePriceID     string   `json:"stripe_price_id,omitempty"`
	IsActive          bool     `json:"is_active"`
	Features          []string `json:"features"`
}

type Subscription struct {
	TenantID             string     `json:"tenant_id"`
	PlanKey              string     `json:"plan_key"`
	Status               string     `json:"status"`
	StripeCustomerID     string     `json:"-"`
	StripeSubscriptionID string     `json:"-"`
	CurrentPeriodEnd     *time.Time `json:"current_period_end,omitempty"`
	CancelAtPeriodEnd    bool       `json:"cancel_at_period_end"`
	TrialEndsAt          *time.Time `json:"trial_ends_at,omitempty"`
}

type Feature struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Patient struct {
	ID            string    `json:"id"`
	FirstName     string    `json:"first_name"`
	LastName      string    `json:"last_name"`
	DNINIE        *string   `json:"dni_nie,omitempty"`
	BirthDate     string    `json:"birth_date"`
	Gender        *string   `json:"gender,omitempty"`
	Phone         string    `json:"phone"`
	Email         *string   `json:"email,omitempty"`
	WhatsappOptIn bool      `json:"whatsapp_opt_in"`
	HighRisk      bool      `json:"high_risk"`
	CreatedAt     time.Time `json:"created_at"`
}

type TenantSummary struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	Subdomain          string     `json:"subdomain"`
	Status             string     `json:"status"`
	TrialEndsAt        *time.Time `json:"trial_ends_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	SubscriptionStatus string     `json:"subscription_status"`
	PlanKey            string     `json:"plan_key"`
	CurrentPeriodEnd   *time.Time `json:"current_period_end,omitempty"`
	StripeCustomerID   string     `json:"-"`
}

type Lead struct {
	ID          string    `json:"id"`
	ContactName string    `json:"contact_name"`
	ClinicName  string    `json:"clinic_name"`
	Email       string    `json:"email"`
	Phone       string    `json:"phone"`
	Interest    string    `json:"interest"`
	Lang        string    `json:"lang"`
	Notes       string    `json:"notes"`
	Source      string    `json:"source"`
	UTMSource   string    `json:"utm_source,omitempty"`
	UTMMedium   string    `json:"utm_medium,omitempty"`
	UTMCampaign string    `json:"utm_campaign,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
