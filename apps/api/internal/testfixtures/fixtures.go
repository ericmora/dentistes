package testfixtures

import (
	"encoding/json"
	"time"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
)

// Deterministic test dataset for critical paths and unit tests.

type TenantFixture struct {
	ID        string
	Name      string
	Subdomain string
	PlanKey   string
	Status    string
}

type UserFixture struct {
	ID       string
	TenantID string
	Email    string
	Password string
	Role     string
	FullName string
}

type CabinetFixture struct {
	ID       string
	TenantID string
	Name     string
	Color    string
}

type DoctorFixture struct {
	ID            string
	TenantID      string
	UserID        string
	FullName      string
	LicenseNumber string
	Color         string
}

type AppointmentFixture struct {
	ID        string
	TenantID  string
	CabinetID string
	DoctorID  string
	PatientID string
	Title     string
	StartTime time.Time
	EndTime   time.Time
	Status    string
	Version   int32
}

var (
	TenantGarraf = TenantFixture{
		ID:        "019325c8-1111-7000-8000-000000000001",
		Name:      "Clínica Dental Garraf",
		Subdomain: "garraf-dental",
		PlanKey:   "base",
		Status:    "ACTIVE",
	}

	TenantPenedes = TenantFixture{
		ID:        "019325c8-2222-7000-8000-000000000002",
		Name:      "Centre Dental Penedès",
		Subdomain: "centre-penedes",
		PlanKey:   "base",
		Status:    "ACTIVE",
	}

	OwnerUser = UserFixture{
		ID:       "019325c8-aaaa-7000-8000-000000000001",
		TenantID: TenantGarraf.ID,
		Email:    "owner@garraf-dental.cat",
		Password: "Password123!",
		Role:     auth.RoleOwner,
		FullName: "Dra. Maria Soler (Owner)",
	}

	AdminUser = UserFixture{
		ID:       "019325c8-bbbb-7000-8000-000000000002",
		TenantID: TenantGarraf.ID,
		Email:    "admin@garraf-dental.cat",
		Password: "Password123!",
		Role:     auth.RoleAdmin,
		FullName: "Marc Vidal (Admin)",
	}

	DoctorUser = UserFixture{
		ID:       "019325c8-cccc-7000-8000-000000000003",
		TenantID: TenantGarraf.ID,
		Email:    "doctor@garraf-dental.cat",
		Password: "Password123!",
		Role:     auth.RoleDoctor,
		FullName: "Dr. Jordi Martí",
	}

	ReceptionistUser = UserFixture{
		ID:       "019325c8-dddd-7000-8000-000000000004",
		TenantID: TenantGarraf.ID,
		Email:    "recepcio@garraf-dental.cat",
		Password: "Password123!",
		Role:     auth.RoleReceptionist,
		FullName: "Laura Bosch (Recepció)",
	}

	Cabinet1 = CabinetFixture{
		ID:       "019325c8-c001-7000-8000-000000000001",
		TenantID: TenantGarraf.ID,
		Name:     "Gabinet 1 - Cirurgia",
		Color:    "#0F766E",
	}

	Cabinet2 = CabinetFixture{
		ID:       "019325c8-c002-7000-8000-000000000002",
		TenantID: TenantGarraf.ID,
		Name:     "Gabinet 2 - Higiene",
		Color:    "#D97706",
	}

	Doctor1 = DoctorFixture{
		ID:            "019325c8-d001-7000-8000-000000000001",
		TenantID:      TenantGarraf.ID,
		UserID:        DoctorUser.ID,
		FullName:      DoctorUser.FullName,
		LicenseNumber: "COL-08081234",
		Color:         "#0F766E",
	}
)

// BaseMondayMorning returns Monday 09:00 UTC for consistent agenda test slots.
func BaseMondayMorning() (time.Time, time.Time) {
	start := time.Date(2026, 11, 16, 9, 0, 0, 0, time.UTC)
	end := start.Add(1 * time.Hour)
	return start, end
}

// BuildMockStripePayload serializes a Stripe event object into JSON bytes.
func BuildMockStripePayload(eventType string, object map[string]any) []byte {
	evt := map[string]any{
		"id":   "evt_test_" + eventType,
		"type": eventType,
		"data": map[string]any{
			"object": object,
		},
	}
	bytes, _ := json.Marshal(evt)
	return bytes
}
