package store

import (
	"testing"
	"time"
)

func TestStaffAbsenceLogic(t *testing.T) {
	t.Run("Validates absence dates range", func(t *testing.T) {
		valid, err := ValidateAbsenceRange("2026-11-20", "2026-11-25")
		if err != nil || !valid {
			t.Fatalf("expected valid range 2026-11-20 to 2026-11-25, got err=%v", err)
		}

		sameDay, err := ValidateAbsenceRange("2026-11-20", "2026-11-20")
		if err != nil || !sameDay {
			t.Fatalf("expected valid single day absence, got err=%v", err)
		}

		_, err = ValidateAbsenceRange("2026-11-25", "2026-11-20")
		if err == nil {
			t.Fatalf("expected error when start date is after end date")
		}

		_, err = ValidateAbsenceRange("invalid-date", "2026-11-20")
		if err == nil {
			t.Fatalf("expected error for malformed date")
		}
	})

	t.Run("IsUserAbsentOnDate returns true only if absence is approved and date within range", func(t *testing.T) {
		absences := []StaffAbsence{
			{
				ID:          "abs-1",
				UserID:      "doc-1",
				AbsenceType: "VACATION",
				StartDate:   "2026-11-20",
				EndDate:     "2026-11-25",
				Status:      "APPROVED",
			},
			{
				ID:          "abs-2",
				UserID:      "doc-2",
				AbsenceType: "SICK_LEAVE",
				StartDate:   "2026-11-22",
				EndDate:     "2026-11-23",
				Status:      "PENDING", // Not approved yet
			},
			{
				ID:          "abs-3",
				UserID:      "asst-1",
				AbsenceType: "VACATION",
				StartDate:   "2026-11-20",
				EndDate:     "2026-11-21",
				Status:      "APPROVED",
			},
		}

		// doc-1 approved vacation
		if !IsUserAbsentOnDate(absences, "doc-1", "2026-11-20") {
			t.Errorf("expected doc-1 to be absent on start date 2026-11-20")
		}
		if !IsUserAbsentOnDate(absences, "doc-1", "2026-11-23") {
			t.Errorf("expected doc-1 to be absent on middle date 2026-11-23")
		}
		if !IsUserAbsentOnDate(absences, "doc-1", "2026-11-25") {
			t.Errorf("expected doc-1 to be absent on end date 2026-11-25")
		}
		if IsUserAbsentOnDate(absences, "doc-1", "2026-11-26") {
			t.Errorf("expected doc-1 NOT to be absent on 2026-11-26")
		}

		// doc-2 pending sick leave should NOT block yet
		if IsUserAbsentOnDate(absences, "doc-2", "2026-11-22") {
			t.Errorf("expected doc-2 NOT to be absent because status is PENDING")
		}

		// asst-1 approved vacation
		if !IsUserAbsentOnDate(absences, "asst-1", "2026-11-21") {
			t.Errorf("expected asst-1 to be absent on 2026-11-21")
		}
	})

	t.Run("Doctor absence vs Assistant absence rescheduling behavior", func(t *testing.T) {
		doctorRoles := []string{"DENTIST", "HYGIENIST", "OWNER", "ADMIN"}
		for _, role := range doctorRoles {
			if !ShouldRescheduleAppointmentsForRole(role) {
				t.Errorf("expected role %s to trigger appointment rescheduling", role)
			}
		}

		assistantRoles := []string{"ASSISTANT", "RECEPTIONIST"}
		for _, role := range assistantRoles {
			if ShouldRescheduleAppointmentsForRole(role) {
				t.Errorf("expected role %s NOT to trigger appointment rescheduling", role)
			}
		}
	})
}

func TestSlotCalculationWithDoctorAbsences(t *testing.T) {
	monday := time.Date(2026, 11, 16, 0, 0, 0, 0, time.UTC)

	cab := Cabinet{
		ID:        "cab-1",
		Name:      "Gabinete 1",
		ColorCode: "#0D9488",
		DoctorID:  strPtr("doc-1"),
		Availability: []CabinetDayAvailability{
			{DayOfWeek: 1, IsOpen: true, StartTime: "09:00", EndTime: "14:00"},
			{DayOfWeek: 2, IsOpen: true, StartTime: "09:00", EndTime: "14:00"},
		},
	}

	shifts := []ServiceShift{
		{
			ID:        "shift-1",
			CabinetID: "cab-1",
			DayOfWeek: 1,
			StartTime: "09:00",
			EndTime:   "14:00",
			DoctorIDs: []string{"doc-1"},
			IsActive:  true,
		},
		{
			ID:        "shift-2",
			CabinetID: "cab-1",
			DayOfWeek: 2,
			StartTime: "09:00",
			EndTime:   "14:00",
			DoctorIDs: []string{"doc-1"},
			IsActive:  true,
		},
	}

	docAbsences := []StaffAbsence{
		{
			ID:          "abs-vacation",
			UserID:      "doc-1",
			AbsenceType: "VACATION",
			StartDate:   "2026-11-16", // Monday
			EndDate:     "2026-11-16",
			Status:      "APPROVED",
		},
	}

	slots := CalculateAvailableSlotsWithContext(CalculateSlotsContext{
		Cabinets:     []Cabinet{cab},
		Shifts:       shifts,
		Appointments: nil,
		Absences:     docAbsences,
		DoctorNames:  map[string]string{"doc-1": "Dr. Pérez"},
		Filter: AvailableSlotSearchFilter{
			StartDate:       monday,
			Days:            2,
			DurationMinutes: 30,
		},
	})

	// Monday should have NO slots for doc-1 because of approved vacation
	// Tuesday (2026-11-17) SHOULD have slots starting at 09:00
	mondaySlots := 0
	tuesdaySlots := 0
	for _, s := range slots {
		if s.Date == "2026-11-16" {
			mondaySlots++
		}
		if s.Date == "2026-11-17" {
			tuesdaySlots++
		}
	}

	if mondaySlots > 0 {
		t.Fatalf("expected 0 slots on Monday due to doctor vacation, got %d", mondaySlots)
	}
	if tuesdaySlots == 0 {
		t.Fatalf("expected available slots on Tuesday after vacation ended, got 0")
	}
}

func strPtr(s string) *string {
	return &s
}
