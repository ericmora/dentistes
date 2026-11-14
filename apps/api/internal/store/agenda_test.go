package store

import (
	"testing"
	"time"
)

func TestCalculateAvailableSlots(t *testing.T) {
	monday := time.Date(2026, 11, 16, 0, 0, 0, 0, time.UTC) // 2026-11-16 is Monday

	cab1 := Cabinet{
		ID:        "cab-1",
		Name:      "Gabinete 1",
		ColorCode: "#0D9488",
		Availability: []CabinetDayAvailability{
			{DayOfWeek: 1, IsOpen: true, StartTime: "09:00", EndTime: "20:00", BreakStart: "14:00", BreakEnd: "15:00"},
			{DayOfWeek: 2, IsOpen: true, StartTime: "09:00", EndTime: "20:00", BreakStart: "14:00", BreakEnd: "15:00"},
			{DayOfWeek: 7, IsOpen: false, StartTime: "09:00", EndTime: "14:00"}, // Sunday closed
		},
	}
	cab2 := Cabinet{
		ID:        "cab-2",
		Name:      "Gabinete 2",
		ColorCode: "#3B82F6",
		Availability: []CabinetDayAvailability{
			{DayOfWeek: 1, IsOpen: true, StartTime: "09:00", EndTime: "14:00"}, // Only mornings
		},
	}
	cabinets := []Cabinet{cab1, cab2}

	// 1 appointment on Monday 09:00 - 10:00 in Cab 1
	appts := []Appointment{
		{
			ID:        "app-1",
			CabinetID: "cab-1",
			StartTime: monday.Add(9 * time.Hour),            // 09:00
			EndTime:   monday.Add(10 * time.Hour),           // 10:00
			Status:    "SCHEDULED",
		},
	}

	t.Run("Finds morning slots of 60 min excluding existing appt and break", func(t *testing.T) {
		slots := CalculateAvailableSlots(cabinets, appts, AvailableSlotSearchFilter{
			CabinetID:       "cab-1",
			DurationMinutes: 60,
			Shift:           "morning",
			StartDate:       monday,
			Days:            1,
			Limit:           10,
		})

		if len(slots) == 0 {
			t.Fatal("expected available morning slots in cab-1, got none")
		}

		// First slot in cab-1 must be at 10:00 because 09:00-10:00 is occupied
		if slots[0].StartTime != "10:00" || slots[0].EndTime != "11:00" {
			t.Fatalf("expected first slot 10:00-11:00, got %s-%s", slots[0].StartTime, slots[0].EndTime)
		}

		// Ensure no morning slot overlaps break (14:00-15:00) or exceeds 14:00
		for _, s := range slots {
			if s.StartTime >= "14:00" || s.EndTime > "14:00" {
				t.Fatalf("morning slot %s-%s exceeds morning boundary (14:00)", s.StartTime, s.EndTime)
			}
			if s.Shift != "morning" {
				t.Fatalf("expected shift 'morning', got %s", s.Shift)
			}
		}
	})

	t.Run("Finds afternoon slots starting from 15:00 after break", func(t *testing.T) {
		slots := CalculateAvailableSlots(cabinets, appts, AvailableSlotSearchFilter{
			CabinetID:       "cab-1",
			DurationMinutes: 45,
			Shift:           "afternoon",
			StartDate:       monday,
			Days:            1,
			Limit:           10,
		})

		if len(slots) == 0 {
			t.Fatal("expected available afternoon slots, got none")
		}

		// First afternoon slot should start at or after 15:00 (break end)
		if slots[0].StartTime < "15:00" {
			t.Fatalf("expected afternoon slot >= 15:00, got %s", slots[0].StartTime)
		}
		for _, s := range slots {
			if s.Shift != "afternoon" {
				t.Fatalf("expected shift 'afternoon', got %s", s.Shift)
			}
		}
	})

	t.Run("Cabinet 2 has no afternoon slots when only open mornings", func(t *testing.T) {
		slots := CalculateAvailableSlots(cabinets, nil, AvailableSlotSearchFilter{
			CabinetID:       "cab-2",
			DurationMinutes: 30,
			Shift:           "afternoon",
			StartDate:       monday,
			Days:            1,
			Limit:           10,
		})
		if len(slots) != 0 {
			t.Fatalf("expected 0 afternoon slots for cab-2, got %d", len(slots))
		}
	})

	t.Run("Respects limit across all cabinets", func(t *testing.T) {
		slots := CalculateAvailableSlots(cabinets, nil, AvailableSlotSearchFilter{
			DurationMinutes: 30,
			Shift:           "all",
			StartDate:       monday,
			Days:            2,
			Limit:           5,
		})
		if len(slots) != 5 {
			t.Fatalf("expected exactly 5 slots with Limit=5, got %d", len(slots))
		}
	})

	t.Run("ServiceShifts and Holidays: assigns doctor, filters category and skips holiday", func(t *testing.T) {
		shifts := []ServiceShift{
			{
				ID:         "shift-surgery",
				Name:       "Cirugía e Implantes Mañanas",
				CabinetID:  "cab-1",
				DayOfWeek:  1, // Monday
				StartTime:  "09:00",
				EndTime:    "14:00",
				DoctorIDs:  []string{"doc-1"},
				Categories: []string{"cirugia", "implantes"},
				IsActive:   true,
			},
			{
				ID:         "shift-hygiene",
				Name:       "Higiene Mañanas",
				CabinetID:  "cab-2",
				DayOfWeek:  1, // Monday
				StartTime:  "09:00",
				EndTime:    "14:00",
				DoctorIDs:  []string{"doc-2"},
				Categories: []string{"higiene", "prevencion"},
				IsActive:   true,
			},
		}

		doctorNames := map[string]string{
			"doc-1": "Dr. Fernando Cirujano",
			"doc-2": "Hig. Laura García",
		}

		// Let's test filtering by treatment category "cirugia"
		slots := CalculateAvailableSlotsWithContext(CalculateSlotsContext{
			Cabinets:     cabinets,
			Shifts:       shifts,
			Overrides:    nil,
			Holidays:     nil,
			Appointments: nil,
			DoctorNames:  doctorNames,
			Filter: AvailableSlotSearchFilter{
				TreatmentCategory: "cirugia",
				DurationMinutes:   45,
				StartDate:         monday,
				Days:              1,
			},
		})

		if len(slots) == 0 {
			t.Fatal("expected slots for cirugia in cab-1, got none")
		}
		// All slots should be in cab-1 with doc-1
		for _, s := range slots {
			if s.CabinetID != "cab-1" {
				t.Fatalf("expected slot in cab-1, got %s", s.CabinetID)
			}
			if s.DoctorID != "doc-1" || s.DoctorName != "Dr. Fernando Cirujano" {
				t.Fatalf("expected doc-1, got ID=%s Name=%s", s.DoctorID, s.DoctorName)
			}
			if s.ShiftName != "Cirugía e Implantes Mañanas" {
				t.Fatalf("expected shift name match, got %s", s.ShiftName)
			}
		}

		// When holiday is configured on that Monday, 0 slots should be returned
		slotsOnHoliday := CalculateAvailableSlotsWithContext(CalculateSlotsContext{
			Cabinets:  cabinets,
			Shifts:    shifts,
			Overrides: nil,
			Holidays: []ClinicHoliday{
				{
					Date:      "2026-11-16",
					Name:      "Fiesta Local",
					IsFullDay: true,
				},
			},
			Appointments: nil,
			DoctorNames:  doctorNames,
			Filter: AvailableSlotSearchFilter{
				TreatmentCategory: "cirugia",
				DurationMinutes:   45,
				StartDate:         monday,
				Days:              1,
			},
		})
		if len(slotsOnHoliday) != 0 {
			t.Fatalf("expected 0 slots on holiday, got %d", len(slotsOnHoliday))
		}

		// When shift has a cancellation override for that specific date
		slotsWithOverride := CalculateAvailableSlotsWithContext(CalculateSlotsContext{
			Cabinets: cabinets,
			Shifts:   shifts,
			Overrides: []ShiftOverride{
				{
					OverrideDate: "2026-11-16",
					ShiftID:      &shifts[0].ID,
					IsCancelled:  true,
				},
			},
			Holidays:     nil,
			Appointments: nil,
			DoctorNames:  doctorNames,
			Filter: AvailableSlotSearchFilter{
				TreatmentCategory: "cirugia",
				DurationMinutes:   45,
				StartDate:         monday,
				Days:              1,
			},
		})
		if len(slotsWithOverride) != 0 {
			t.Fatalf("expected 0 slots when shift cancelled by override, got %d", len(slotsWithOverride))
		}

		// Doctor overlap test: if doc-1 already has an appointment in another cabinet, they can't be scheduled
		doc1BusyAppts := []Appointment{
			{
				ID:        "app-doc1",
				DoctorID:  "doc-1",
				CabinetID: "cab-other",
				StartTime: monday.Add(9 * time.Hour),  // 09:00
				EndTime:   monday.Add(10 * time.Hour), // 10:00
				Status:    "SCHEDULED",
			},
		}
		slotsDoc1Busy := CalculateAvailableSlotsWithContext(CalculateSlotsContext{
			Cabinets:     cabinets,
			Shifts:       shifts,
			Overrides:    nil,
			Holidays:     nil,
			Appointments: doc1BusyAppts,
			DoctorNames:  doctorNames,
			Filter: AvailableSlotSearchFilter{
				TreatmentCategory: "cirugia",
				DurationMinutes:   60,
				StartDate:         monday,
				Days:              1,
			},
		})
		if len(slotsDoc1Busy) == 0 {
			t.Fatal("expected slots starting after 10:00, got none")
		}
		if slotsDoc1Busy[0].StartTime != "10:00" {
			t.Fatalf("expected first slot at 10:00 due to doc-1 overlap at 09:00-10:00, got %s", slotsDoc1Busy[0].StartTime)
		}
	})
}
