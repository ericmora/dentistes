package store

import (
	"testing"
)

func TestDentalChairLogic(t *testing.T) {
	t.Run("Cabinet matches Chair physical capabilities", func(t *testing.T) {
		chair := DentalChair{
			ID:                "chair-surg",
			Name:              "Butaca 1 · Quirófano",
			ColorCode:         "#0D9488",
			Equipment:         "Motor quirúrgico, lámpara scialítica, Rx",
			AllowedCategories: []string{"CIRUGIA", "IMPLANTES"},
			IsActive:          true,
		}

		cab := Cabinet{
			ID:                "cab-1",
			Name:              "Gabinete Quirúrgico",
			ChairID:           &chair.ID,
			ChairName:         &chair.Name,
			Equipment:         chair.Equipment,
			AllowedCategories: chair.AllowedCategories,
			IsActive:          true,
		}

		if *cab.ChairID != chair.ID {
			t.Errorf("expected cabinet chair id to match chair ID")
		}
		if *cab.ChairName != "Butaca 1 · Quirófano" {
			t.Errorf("expected cabinet chair name to match")
		}
		if len(cab.AllowedCategories) != 2 {
			t.Errorf("expected 2 allowed categories, got %d", len(cab.AllowedCategories))
		}
	})
}
