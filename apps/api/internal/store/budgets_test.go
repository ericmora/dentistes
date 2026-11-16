package store

import (
	"testing"
	"time"
)

func TestComputeBudgetTotalsAndOptions(t *testing.T) {
	blocks := []BudgetFindingBlock{
		{
			FindingID:   "find-26",
			ToothNumber: "26",
			Surfaces:    []string{"mesial", "occlusal", "distal"},
			Diagnosis:   "Pieza 26 en muy mal estado (caries destructiva)",
			Options: []BudgetTreatmentOption{
				{
					ID:            "opt-26-a",
					OptionLabel:   "Opción A",
					Name:          "Extracción simple",
					Description:   "Exodoncia conservadora de la pieza 26",
					IsRecommended: false,
					Items: []BudgetProcedureItem{
						{
							ID:             "it-1",
							TreatmentCode:  "EXTRACCION_SIMPLE",
							Description:    "Extracción simple pieza 26",
							ToothNumber:    "26",
							Quantity:       1,
							UnitPriceCents: 5000,
						},
					},
					PatientResponse: "PENDING",
				},
				{
					ID:            "opt-26-b",
					OptionLabel:   "Opción B",
					Name:          "Tratamiento de reconstrucción",
					Description:   "Endodoncia multirradicular + Reconstrucción compleja",
					IsRecommended: false,
					Items: []BudgetProcedureItem{
						{
							ID:             "it-2",
							TreatmentCode:  "ENDODONCIA_MULTIRRADICULAR",
							Description:    "Endodoncia multirradicular pieza 26",
							ToothNumber:    "26",
							Quantity:       1,
							UnitPriceCents: 21000,
						},
						{
							ID:             "it-3",
							TreatmentCode:  "OBTURACION_COMPLEJA",
							Description:    "Reconstrucción compleja pieza 26",
							ToothNumber:    "26",
							Quantity:       1,
							UnitPriceCents: 8500,
						},
					},
					PatientResponse: "PENDING",
				},
				{
					ID:            "opt-26-c",
					OptionLabel:   "Opción C",
					Name:          "Extracción y después Implante",
					Description:   "Exodoncia + Colocación de implante + Corona sobre implante",
					IsRecommended: true,
					Items: []BudgetProcedureItem{
						{
							ID:             "it-4",
							TreatmentCode:  "EXTRACCION_SIMPLE",
							Description:    "Extracción simple pieza 26",
							ToothNumber:    "26",
							Quantity:       1,
							UnitPriceCents: 5000,
						},
						{
							ID:             "it-5",
							TreatmentCode:  "IMPLANTE",
							Description:    "Colocación de implante pieza 26",
							ToothNumber:    "26",
							Quantity:       1,
							UnitPriceCents: 75000,
						},
						{
							ID:             "it-6",
							TreatmentCode:  "CORONA",
							Description:    "Corona sobre implante pieza 26",
							ToothNumber:    "26",
							Quantity:       1,
							UnitPriceCents: 32000,
						},
					},
					PatientResponse: "PENDING",
				},
			},
		},
	}

	normalized, minEst, maxEst, accepted := NormalizeAndComputeBudgetBlocks(blocks)
	if len(normalized) != 1 || len(normalized[0].Options) != 3 {
		t.Fatalf("expected 1 finding block with 3 options, got %+v", normalized)
	}
	if normalized[0].Options[0].TotalCents != 5000 {
		t.Errorf("expected Option A total 5000 cents, got %d", normalized[0].Options[0].TotalCents)
	}
	if normalized[0].Options[1].TotalCents != 29500 {
		t.Errorf("expected Option B total 29500 cents, got %d", normalized[0].Options[1].TotalCents)
	}
	if normalized[0].Options[2].TotalCents != 112000 {
		t.Errorf("expected Option C total 112000 cents, got %d", normalized[0].Options[2].TotalCents)
	}
	if minEst != 50.00 {
		t.Errorf("expected min estimate 50.00, got %.2f", minEst)
	}
	if maxEst != 1120.00 {
		t.Errorf("expected max estimate 1120.00, got %.2f", maxEst)
	}
	if accepted != 0.00 {
		t.Errorf("expected initial accepted amount 0.00, got %.2f", accepted)
	}

	// Patient returns from home and accepts Option C (Extracción + Implante)
	now := time.Date(2026, 11, 20, 11, 0, 0, 0, time.UTC)
	updatedBlocks, nextStatus, err := ApplyBudgetOptionResponse(normalized, "find-26", "opt-26-c", "ACCEPTED", "Paciente elige rehabilitación con implante", now)
	if err != nil {
		t.Fatalf("unexpected error applying option response: %v", err)
	}
	if nextStatus != "ACCEPTED" {
		t.Errorf("expected budget status ACCEPTED when all findings have an accepted option, got %s", nextStatus)
	}
	if updatedBlocks[0].Options[2].PatientResponse != "ACCEPTED" {
		t.Errorf("expected Option C to be ACCEPTED, got %s", updatedBlocks[0].Options[2].PatientResponse)
	}
	if updatedBlocks[0].Options[0].PatientResponse != "REJECTED" || updatedBlocks[0].Options[1].PatientResponse != "REJECTED" {
		t.Errorf("expected sibling Options A and B to be automatically REJECTED when Option C is ACCEPTED, got A=%s B=%s",
			updatedBlocks[0].Options[0].PatientResponse, updatedBlocks[0].Options[1].PatientResponse)
	}

	_, _, _, acceptedAfter := NormalizeAndComputeBudgetBlocks(updatedBlocks)
	if acceptedAfter != 1120.00 {
		t.Errorf("expected accepted amount 1120.00 after accepting Option C, got %.2f", acceptedAfter)
	}

	// Extract invoice items from accepted options
	invItems := ExtractAcceptedInvoiceItems(updatedBlocks)
	if len(invItems) != 3 {
		t.Fatalf("expected 3 invoice items from Option C, got %d", len(invItems))
	}
	if invItems[1].UnitPriceCents != 75000 {
		t.Errorf("expected implant price 75000 cents, got %d", invItems[1].UnitPriceCents)
	}
}

func TestBudgetValidityAndOpenStatus(t *testing.T) {
	issue := time.Date(2026, 11, 14, 0, 0, 0, 0, time.UTC)
	validUntil := ComputeValidUntil(issue, 30)
	expected := time.Date(2026, 12, 14, 0, 0, 0, 0, time.UTC)
	if !validUntil.Equal(expected) {
		t.Errorf("expected validUntil %v, got %v", expected, validUntil)
	}

	if !IsFindingOpen("OPEN") || !IsFindingOpen("IN_BUDGET") || !IsFindingOpen("ACCEPTED") {
		t.Errorf("expected OPEN, IN_BUDGET, ACCEPTED findings to be open")
	}
	if IsFindingOpen("INVOICED") || IsFindingOpen("DISCARDED") {
		t.Errorf("expected INVOICED and DISCARDED findings to be closed")
	}

	if !IsBudgetOpen("DRAFT") || !IsBudgetOpen("PRESENTED") || !IsBudgetOpen("ACCEPTED") || !IsBudgetOpen("PARTIAL") {
		t.Errorf("expected DRAFT, PRESENTED, ACCEPTED, PARTIAL budgets to be open")
	}
	if IsBudgetOpen("INVOICED") || IsBudgetOpen("REJECTED") {
		t.Errorf("expected INVOICED and REJECTED budgets to be closed")
	}
}

func TestRejectingTreatmentsDoesNotDiscardFinding_RebudgetSameFinding(t *testing.T) {
	now := time.Date(2026, 11, 21, 10, 0, 0, 0, time.UTC)

	// Budget 1 for finding "find-26" with 2 treatment options
	budget1Blocks := []BudgetFindingBlock{
		{
			FindingID:   "find-26",
			ToothNumber: "26",
			Diagnosis:   "Pieza 26 con caries profunda",
			Options: []BudgetTreatmentOption{
				{
					ID:              "b1-opt-1",
					OptionLabel:     "Opción 1",
					Name:            "Endodoncia + Corona zirconia",
					PatientResponse: "PENDING",
					Items: []BudgetProcedureItem{
						{ID: "i1", Description: "Endodoncia + Corona", UnitPriceCents: 65000, Quantity: 1},
					},
				},
			},
		},
	}

	// Patient discards the treatment in Budget 1
	updatedB1, statusB1, err := ApplyBudgetOptionResponse(budget1Blocks, "find-26", "b1-opt-1", "REJECTED", "Presupuesto inicial descartado por coste", now)
	if err != nil {
		t.Fatalf("unexpected error rejecting option: %v", err)
	}
	if statusB1 != "REJECTED" {
		t.Fatalf("expected budget 1 status REJECTED, got %s", statusB1)
	}

	// CRITICAL RULE: Discarding the treatment/budget does NOT discard the finding!
	// The finding returns to OPEN so a new budget can be made for the same finding.
	findingStatusAfterReject := ResolveFindingStatusAfterBudgetChange("IN_BUDGET", updatedB1[0])
	if findingStatusAfterReject != "OPEN" {
		t.Fatalf("expected finding status to return to OPEN (not DISCARDED) when treatment is rejected, got %s", findingStatusAfterReject)
	}
	if !IsFindingOpen(findingStatusAfterReject) {
		t.Fatalf("expected finding to remain open after treatment rejection")
	}

	// Later, Dentist creates Budget 2 for the EXACT SAME finding ("find-26") and patient accepts it
	budget2Blocks := []BudgetFindingBlock{
		{
			FindingID:   "find-26",
			ToothNumber: "26",
			Diagnosis:   "Pieza 26 con caries profunda",
			Options: []BudgetTreatmentOption{
				{
					ID:              "b2-opt-1",
					OptionLabel:     "Opción 1",
					Name:            "Reconstrucción compleja con recubrimiento pulpar",
					PatientResponse: "PENDING",
					Items: []BudgetProcedureItem{
						{ID: "i2", Description: "Reconstrucción compleja", UnitPriceCents: 12000, Quantity: 1},
					},
				},
			},
		},
	}

	updatedB2, statusB2, err := ApplyBudgetOptionResponse(budget2Blocks, "find-26", "b2-opt-1", "ACCEPTED", "Acepta segundo presupuesto", now.Add(48*time.Hour))
	if err != nil {
		t.Fatalf("unexpected error accepting budget 2 option: %v", err)
	}
	if statusB2 != "ACCEPTED" {
		t.Fatalf("expected budget 2 status ACCEPTED, got %s", statusB2)
	}
	findingStatusAfterAccept := ResolveFindingStatusAfterBudgetChange(findingStatusAfterReject, updatedB2[0])
	if findingStatusAfterAccept != "ACCEPTED" {
		t.Fatalf("expected finding status ACCEPTED after accepting second budget, got %s", findingStatusAfterAccept)
	}
}

func TestCancelFindingRequiresClinicalNoteAndFormatsHistory(t *testing.T) {
	// Cancelling a finding (DISCARDED) without a clinical note must fail validation
	if err := ValidateFindingStatusUpdate("DISCARDED", "   "); err == nil {
		t.Fatal("expected error when cancelling a finding without a clinical note")
	}

	// Cancelling a finding with a clinical note must succeed
	if err := ValidateFindingStatusUpdate("DISCARDED", "Se descarta tras radiografía periapical sin lesión activa"); err != nil {
		t.Fatalf("expected valid cancellation with clinical note, got %v", err)
	}

	// History entry formatting for new finding and cancelled finding
	createdEntry := FormatFindingCreatedHistoryContent("26", []string{"mesial", "occlusal"}, "Caries profunda en pieza 26", "Dolor al frío")
	if createdEntry == "" {
		t.Fatal("expected non-empty history content for created finding")
	}

	cancelledEntry := FormatFindingCancelledHistoryContent("26", "Caries profunda en pieza 26", "Cancelado tras radiografía de control sin hallazgo patológico")
	if cancelledEntry == "" {
		t.Fatal("expected non-empty history content for cancelled finding")
	}
}

func TestNormalizeClinicalAttachments(t *testing.T) {
	raw := []ClinicalAttachment{
		{
			Kind:        "XRAY",
			Name:        "Rx_Periapical_26.png",
			MimeType:    "image/png",
			DataURL:     "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
			ToothNumber: "26",
		},
		{
			Kind:     "PHOTO",
			Name:     "Foto_Intraoral_Inicial.jpg",
			MimeType: "image/jpeg",
			DataURL:  "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
		},
		{
			Kind:     "DOCUMENT",
			Name:     "Consentimiento_Informado_Implante.pdf",
			MimeType: "application/pdf",
			DataURL:  "data:application/pdf;base64,JVBERi0xLjQK",
		},
	}

	norm, err := NormalizeClinicalAttachments(raw)
	if err != nil {
		t.Fatalf("unexpected error normalizing attachments: %v", err)
	}
	if len(norm) != 3 {
		t.Fatalf("expected 3 normalized attachments, got %d", len(norm))
	}
	if norm[0].ID == "" || norm[0].Kind != "XRAY" {
		t.Errorf("expected generated ID and kind XRAY, got %+v", norm[0])
	}
	if norm[1].Kind != "PHOTO" {
		t.Errorf("expected kind PHOTO, got %s", norm[1].Kind)
	}
	if norm[2].Kind != "DOCUMENT" {
		t.Errorf("expected kind DOCUMENT, got %s", norm[2].Kind)
	}
}

func TestNormalizeClinicBudgetSettings(t *testing.T) {
	def := DefaultClinicBudgetSettings()
	if def.BudgetDefaultValidityDays != 30 {
		t.Fatalf("expected default validity days 30, got %d", def.BudgetDefaultValidityDays)
	}
	if def.BudgetDefaultSeries != "PRE" {
		t.Fatalf("expected default series PRE, got %s", def.BudgetDefaultSeries)
	}

	custom := NormalizeClinicBudgetSettings(ClinicBudgetSettings{
		LogoURL:                       "  https://clinica.example.com/logo.png  ",
		ClinicContactLine:             "  Av. Diagonal 450, Barcelona · Tel. 932 00 11 22  ",
		BudgetDefaultValidityDays:     60,
		BudgetDefaultSeries:           " pto ",
		BudgetWarningDaysBeforeExpiry: 10,
		BudgetValidityTerms:           "  Vigencia garantizada durante 60 días naturales.  ",
		BudgetAutoExpire:              true,
		CustomMarginsEnabled:          true,
		MarginTopMm:                   35,
		MarginBottomMm:                25,
		MarginLeftMm:                  20,
		MarginRightMm:                 18,
		HideHeaderLogoOnPrint:         true,
	})
	if custom.LogoURL != "https://clinica.example.com/logo.png" {
		t.Errorf("expected trimmed logo URL, got %q", custom.LogoURL)
	}
	if custom.BudgetDefaultValidityDays != 60 {
		t.Errorf("expected validity days 60, got %d", custom.BudgetDefaultValidityDays)
	}
	if custom.BudgetDefaultSeries != "PTO" {
		t.Errorf("expected uppercase series PTO, got %s", custom.BudgetDefaultSeries)
	}
	if custom.BudgetWarningDaysBeforeExpiry != 10 {
		t.Errorf("expected warning days 10, got %d", custom.BudgetWarningDaysBeforeExpiry)
	}
	if !custom.CustomMarginsEnabled || custom.MarginTopMm != 35 || custom.MarginBottomMm != 25 || custom.MarginLeftMm != 20 || custom.MarginRightMm != 18 || !custom.HideHeaderLogoOnPrint {
		t.Errorf("expected custom margins preserved, got %+v", custom)
	}

	// Out-of-range values fall back safely
	clamped := NormalizeClinicBudgetSettings(ClinicBudgetSettings{
		BudgetDefaultValidityDays:     -5,
		BudgetDefaultSeries:           "   ",
		BudgetWarningDaysBeforeExpiry: 999,
		MarginTopMm:                   -10,
		MarginBottomMm:                200,
	})
	if clamped.BudgetDefaultValidityDays != 30 {
		t.Errorf("expected fallback validity days 30 for negative input, got %d", clamped.BudgetDefaultValidityDays)
	}
	if clamped.BudgetDefaultSeries != "PRE" {
		t.Errorf("expected fallback series PRE for empty input, got %s", clamped.BudgetDefaultSeries)
	}
	if clamped.BudgetWarningDaysBeforeExpiry != 7 {
		t.Errorf("expected fallback warning days 7 for out-of-range input, got %d", clamped.BudgetWarningDaysBeforeExpiry)
	}
	if clamped.MarginTopMm != 15 || clamped.MarginBottomMm != 15 {
		t.Errorf("expected fallback margins 15mm for out-of-range input, got top=%d bottom=%d", clamped.MarginTopMm, clamped.MarginBottomMm)
	}
}

