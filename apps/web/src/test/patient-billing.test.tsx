import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  InvoiceLineEditor,
  QRVerifierBlock,
  PatientBudgetCard,
  BudgetPrintFormatDocument,
  ClinicBrandingAndBudgetSettingsCard,
  AppointmentOpenFindingsAndBudgetsSummary,
  ClinicalHistoryTimeline,
  buildSampleClinicalAttachment,
} from "@dentistes/ui";

describe("Patient Clinical Invoicing & Multi-Option Budgets Components (F6/F7)", () => {
  it("renders InvoiceLineEditor and adds/updates dental treatment line items", () => {
    const handleChange = vi.fn();
    const lines = [
      {
        id: "line-1",
        description: "Obturación simple pieza 16",
        toothNumber: "16",
        quantity: 1,
        unitPriceCents: 6000,
        taxRatePercent: 0,
      },
    ];

    render(
      <InvoiceLineEditor
        lines={lines}
        currency="USD"
        onChange={handleChange}
      />
    );

    expect(screen.getByDisplayValue("Obturación simple pieza 16")).toBeInTheDocument();
    expect(screen.getByDisplayValue("16")).toBeInTheDocument();
    expect(screen.getByText("Añadir partida")).toBeInTheDocument();

    // Add new line
    fireEvent.click(screen.getByText("Añadir partida"));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].length).toBe(2);
  });

  it("renders QRVerifierBlock with document series, hash and print action", () => {
    const handleDownload = vi.fn();

    render(
      <QRVerifierBlock
        documentNumber="FAC-102"
        verificationHash="a3f8c9b2e104d5e6..."
        onDownloadPdf={handleDownload}
      />
    );

    expect(screen.getByText("Documento FAC-102")).toBeInTheDocument();
    expect(screen.getByText(/a3f8c9b2e104d5e6/)).toBeInTheDocument();
    expect(screen.getByText("Descargar PDF")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Descargar PDF"));
    expect(handleDownload).toHaveBeenCalledTimes(1);
  });

  it("renders PatientBudgetCard structured by finding and 3 treatment alternatives with explicit customer response actions", () => {
    const onRespondOption = vi.fn();
    const onConvertToInvoice = vi.fn();
    const onPrintFormat = vi.fn();

    const budget = {
      id: "bud-26",
      patient_id: "pat-1",
      doctor_id: "doc-1",
      doctor_name: "Dr. Jordi Martí",
      series: "PRE",
      budget_number: 1,
      title: "Plan Pieza 26 (3 Alternativas)",
      issue_date: "2026-11-14",
      validity_days: 30,
      valid_until: "2026-12-14",
      status: "PRESENTED" as const,
      min_estimate_amount: 50,
      max_estimate_amount: 1120,
      accepted_amount: 0,
      notes: "Vigencia de 30 días naturales.",
      created_at: "2026-11-14T10:00:00Z",
      updated_at: "2026-11-14T10:00:00Z",
      findings_blocks: [
        {
          finding_id: "find-26",
          tooth_number: "26",
          surfaces: ["mesial", "occlusal", "distal"],
          diagnosis: "Pieza 26 en muy mal estado",
          options: [
            {
              id: "opt-1",
              option_label: "Opción 1",
              name: "Extracción simple",
              is_recommended: false,
              total_cents: 5000,
              patient_response: "PENDING" as const,
              items: [
                {
                  id: "it-1",
                  description: "Extracción simple pieza 26",
                  tooth_number: "26",
                  quantity: 1,
                  unit_price_cents: 5000,
                },
              ],
            },
            {
              id: "opt-2",
              option_label: "Opción 2",
              name: "Tratamiento de reconstrucción",
              is_recommended: false,
              total_cents: 29500,
              patient_response: "PENDING" as const,
              items: [
                {
                  id: "it-2",
                  description: "Endodoncia + Reconstrucción compleja",
                  tooth_number: "26",
                  quantity: 1,
                  unit_price_cents: 29500,
                },
              ],
            },
            {
              id: "opt-3",
              option_label: "Opción 3",
              name: "Extracción y después Implante",
              is_recommended: true,
              total_cents: 112000,
              patient_response: "PENDING" as const,
              items: [
                {
                  id: "it-3",
                  description: "Extracción + Implante + Corona",
                  tooth_number: "26",
                  quantity: 1,
                  unit_price_cents: 112000,
                },
              ],
            },
          ],
        },
      ],
    };

    render(
      <PatientBudgetCard
        budget={budget}
        currency="EUR"
        canWrite={true}
        onRespondOption={onRespondOption}
        onConvertToInvoice={onConvertToInvoice}
        onPrintFormat={onPrintFormat}
      />
    );

    expect(screen.getByText(/PRE-1/)).toBeInTheDocument();
    expect(screen.getByText(/Pieza 26 en muy mal estado/)).toBeInTheDocument();
    expect(screen.getByText("Extracción simple")).toBeInTheDocument();
    expect(screen.getByText("Tratamiento de reconstrucción")).toBeInTheDocument();
    expect(screen.getByText("Extracción y después Implante")).toBeInTheDocument();

    // Customer accepts Option 3 (Extracción y después Implante)
    const acceptButtons = screen.getAllByRole("button", { name: /Aceptar opción/i });
    expect(acceptButtons.length).toBe(3);
    fireEvent.click(acceptButtons[2]);

    expect(onRespondOption).toHaveBeenCalledWith("bud-26", "find-26", "opt-3", "ACCEPTED");
  });

  it("renders AppointmentOpenFindingsAndBudgetsSummary with open findings and active budgets for the appointment view", () => {
    render(
      <AppointmentOpenFindingsAndBudgetsSummary
        currency="EUR"
        findings={[
          {
            id: "f-26",
            patient_id: "p-1",
            doctor_id: "d-1",
            tooth_number: "26",
            surfaces: ["occlusal"],
            pathology_code: "SEVERE_DAMAGE",
            diagnosis: "Pieza 26 en muy mal estado",
            severity: "HIGH",
            status: "IN_BUDGET",
            notes: "",
            created_at: "2026-11-14T10:00:00Z",
            updated_at: "2026-11-14T10:00:00Z",
          },
          {
            id: "f-closed",
            patient_id: "p-1",
            doctor_id: "d-1",
            tooth_number: "11",
            surfaces: [],
            pathology_code: "CARIES",
            diagnosis: "Hallazgo ya facturado",
            severity: "LOW",
            status: "INVOICED",
            notes: "",
            created_at: "2026-11-14T10:00:00Z",
            updated_at: "2026-11-14T10:00:00Z",
          },
        ]}
        budgets={[
          {
            id: "b-1",
            patient_id: "p-1",
            doctor_id: "d-1",
            series: "PRE",
            budget_number: 1,
            title: "Rehabilitación Pieza 26",
            issue_date: "2026-11-14",
            validity_days: 30,
            valid_until: "2026-12-14",
            status: "ACCEPTED",
            min_estimate_amount: 50,
            max_estimate_amount: 1120,
            accepted_amount: 1120,
            notes: "",
            created_at: "2026-11-14T10:00:00Z",
            updated_at: "2026-11-14T10:00:00Z",
            findings_blocks: [
              {
                finding_id: "f-26",
                tooth_number: "26",
                diagnosis: "Pieza 26 en muy mal estado",
                options: [
                  {
                    id: "opt-3",
                    option_label: "Opción 3",
                    name: "Extracción y después Implante",
                    is_recommended: true,
                    total_cents: 112000,
                    patient_response: "ACCEPTED",
                    items: [],
                  },
                ],
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText(/Pieza 26 en muy mal estado/)).toBeInTheDocument();
    expect(screen.queryByText(/Hallazgo ya facturado/)).not.toBeInTheDocument();
    expect(screen.getByText(/PRE-1 · Rehabilitación Pieza 26/)).toBeInTheDocument();
    expect(screen.getByText(/Extracción y después Implante/)).toBeInTheDocument();
  });

  it("keeps the finding open when a budget/treatment is rejected and allows creating a new budget for the same finding", () => {
    const onCreateNewBudgetForFinding = vi.fn();

    const rejectedBudget = {
      id: "bud-rejected-1",
      patient_id: "pat-1",
      doctor_id: "doc-1",
      series: "PRE",
      budget_number: 1,
      title: "Primer Presupuesto Descartado",
      issue_date: "2026-11-14",
      validity_days: 30,
      valid_until: "2026-12-14",
      status: "REJECTED" as const,
      min_estimate_amount: 650,
      max_estimate_amount: 650,
      accepted_amount: 0,
      notes: "",
      created_at: "2026-11-14T10:00:00Z",
      updated_at: "2026-11-14T10:00:00Z",
      findings_blocks: [
        {
          finding_id: "find-same-26",
          tooth_number: "26",
          surfaces: ["mesial", "occlusal"],
          diagnosis: "Caries profunda en pieza 26",
          options: [
            {
              id: "opt-1",
              option_label: "Opción 1",
              name: "Endodoncia + Corona",
              is_recommended: true,
              total_cents: 65000,
              patient_response: "REJECTED" as const,
              items: [],
            },
          ],
        },
      ],
    };

    render(
      <PatientBudgetCard
        budget={rejectedBudget}
        currency="EUR"
        canWrite={true}
        onCreateNewBudgetForFinding={onCreateNewBudgetForFinding}
      />
    );

    expect(screen.getByText(/Tratamiento descartado · Hallazgo sigue abierto/i)).toBeInTheDocument();
    const rebudgetBtn = screen.getByRole("button", { name: /\+ Nuevo presupuesto para este hallazgo/i });
    fireEvent.click(rebudgetBtn);

    expect(onCreateNewBudgetForFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "find-same-26",
        tooth_number: "26",
        diagnosis: "Caries profunda en pieza 26",
      })
    );
  });

  it("renders ClinicalHistoryTimeline with findings, cancellation clinical notes, and attached radiographs, photos and documents", () => {
    const onPreviewAttachment = vi.fn();
    const rxAttachment = buildSampleClinicalAttachment("XRAY", 26);
    const photoAttachment = buildSampleClinicalAttachment("PHOTO", 26);
    const docAttachment = buildSampleClinicalAttachment("DOCUMENT", 26);

    render(
      <ClinicalHistoryTimeline
        compact={true}
        selectedTooth={26}
        onPreviewAttachment={onPreviewAttachment}
        entries={[
          {
            id: "rec-finding-1",
            entryType: "DIAGNOSIS",
            content: "[Pieza 26] Hallazgo clínico registrado: Caries profunda en pieza 26 (Caras: mesial, occlusal)",
            doctorName: "Dr. Jordi Martí",
            createdAt: "14/11/2026 10:00",
            attachments: [rxAttachment, photoAttachment, docAttachment],
          },
          {
            id: "rec-cancel-1",
            entryType: "NOTE",
            content: "[Pieza 18] Hallazgo clínico cancelado (Posible fisura). Nota clínica: Se descarta tras exploración con transiluminación",
            doctorName: "Dr. Jordi Martí",
            createdAt: "14/11/2026 10:15",
          },
        ]}
      />
    );

    expect(screen.getByText(/Hallazgo clínico registrado: Caries profunda en pieza 26/)).toBeInTheDocument();
    expect(screen.getByText(/Hallazgo clínico cancelado/)).toBeInTheDocument();
    expect(screen.getByText("3 adjunto(s)")).toBeInTheDocument();
    expect(screen.getByText("Radiografía")).toBeInTheDocument();
    expect(screen.getByText("Fotografía")).toBeInTheDocument();
    expect(screen.getByText("Documento")).toBeInTheDocument();

    const previewButtons = screen.getAllByRole("button", { name: /Ver \/ Ampliar/i });
    expect(previewButtons.length).toBe(3);
    fireEvent.click(previewButtons[0]);
    expect(onPreviewAttachment).toHaveBeenCalledWith(rxAttachment);
  });

  it("renders BudgetPrintFormatDocument with print-ready A4 styling, custom clinic logo, validity parameters and print action", () => {
    const onPrint = vi.fn();
    const budget = {
      id: "bud-print-1",
      patient_id: "pat-1",
      doctor_id: "doc-1",
      doctor_name: "Dr. Jordi Martí",
      series: "PRE",
      budget_number: 42,
      title: "Rehabilitación Protésica e Implantología",
      issue_date: "2026-11-14",
      validity_days: 60,
      valid_until: "2027-01-13",
      status: "PRESENTED" as const,
      min_estimate_amount: 295,
      max_estimate_amount: 1120,
      accepted_amount: 1120,
      notes: "Incluye revisiones postoperatorias durante 6 meses.",
      created_at: "2026-11-14T10:00:00Z",
      updated_at: "2026-11-14T10:00:00Z",
      findings_blocks: [
        {
          finding_id: "find-26",
          tooth_number: "26",
          surfaces: ["mesial", "occlusal", "distal"],
          diagnosis: "Fractura coronaria subgingival pieza 26",
          options: [
            {
              id: "opt-1",
              option_label: "Opción 1",
              name: "Implante osteointegrado + Corona zirconio",
              is_recommended: true,
              total_cents: 112000,
              patient_response: "ACCEPTED" as const,
              items: [
                {
                  id: "it-1",
                  description: "Exodoncia atraumática + Implante + Corona",
                  tooth_number: "26",
                  quantity: 1,
                  unit_price_cents: 112000,
                },
              ],
            },
          ],
        },
      ],
    };

    const { container } = render(
      <BudgetPrintFormatDocument
        budget={budget}
        patientName="Marta Rius"
        patientDni="47891234X"
        clinicName="Clínica Dental Barcelona"
        clinicLogoUrl="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>"
        clinicTaxId="B-12345678"
        clinicContactLine="Av. Diagonal 450, Barcelona · Tel. 932 00 11 22"
        validityTerms="Este presupuesto tiene una vigencia garantizada de 60 días naturales desde su fecha de emisión."
        currency="EUR"
        onPrint={onPrint}
      />,
    );

    const printRoot = container.querySelector('[data-print-budget="true"]');
    expect(printRoot).not.toBeNull();
    expect(printRoot).toHaveClass("print-budget-sheet");

    // Verify custom clinic logo is rendered
    const logoImg = screen.getByRole("img", { name: /Logo de Clínica Dental Barcelona/i });
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute(
      "src",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
    );

    // Verify clinic header metadata & validity parameters
    expect(screen.getByText(/B-12345678/)).toBeInTheDocument();
    expect(screen.getByText(/Av\. Diagonal 450, Barcelona/i)).toBeInTheDocument();
    expect(screen.getAllByText(/60 días/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Este presupuesto tiene una vigencia garantizada de 60 días naturales/i),
    ).toBeInTheDocument();

    const printBtn = screen.getByRole("button", { name: /Imprimir \/ Guardar PDF/i });
    expect(printBtn.closest(".no-print")).not.toBeNull();
    fireEvent.click(printBtn);
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("renders ClinicBrandingAndBudgetSettingsCard and allows configuring clinic logo and budget validity parameters", () => {
    const onSave = vi.fn();

    render(
      <ClinicBrandingAndBudgetSettingsCard
        clinicName="Clínica Dental Barcelona"
        clinicTaxId="B-12345678"
        initialSettings={{
          logo_url: "https://clinica.example.com/logo.svg",
          clinic_contact_line: "Calle Mayor 12, Madrid",
          budget_default_validity_days: 30,
          budget_default_series: "PRE",
          budget_warning_days_before_expiry: 7,
          budget_validity_terms: "Validez inicial de 30 días.",
          budget_auto_expire: true,
        }}
        onSave={onSave}
      />,
    );

    // Verify sample logo button is removed and preview is rendered
    expect(screen.queryByText(/Usar logo dental de muestra/i)).toBeNull();
    expect(screen.getByRole("img", { name: /Vista previa logo Clínica Dental Barcelona/i })).toBeInTheDocument();

    const preset60Btn = screen.getByRole("button", { name: "60 días" });
    fireEvent.click(preset60Btn);

    const seriesInput = screen.getByLabelText(/Serie por defecto de presupuestos/i);
    fireEvent.change(seriesInput, { target: { value: "PTO" } });

    const termsInput = screen.getByLabelText(/Condiciones legales y texto de vigencia/i);
    fireEvent.change(termsInput, {
      target: { value: "Presupuesto garantizado durante 60 días naturales." },
    });

    const saveBtn = screen.getByRole("button", { name: /Guardar logo y parámetros de vigencia/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        logo_url: "https://clinica.example.com/logo.svg",
        budget_default_validity_days: 60,
        budget_default_series: "PTO",
        budget_validity_terms: "Presupuesto garantizado durante 60 días naturales.",
        custom_margins_enabled: false,
      }),
    );
  });

  it("renders ClinicBrandingAndBudgetSettingsCard with customizable print margins for pre-printed paper", () => {
    const onSave = vi.fn();

    render(
      <ClinicBrandingAndBudgetSettingsCard
        clinicName="Clínica Dental Preimpresos"
        initialSettings={{
          logo_url: "https://clinica.example.com/logo.svg",
          custom_margins_enabled: false,
        }}
        onSave={onSave}
      />,
    );

    // Toggle custom margins
    const toggle = screen.getByLabelText(/Activar personalización de márgenes de página/i);
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    // Configure margin top, bottom, left and right
    const topInput = screen.getByLabelText(/Margen Superior/i);
    fireEvent.change(topInput, { target: { value: "35" } });

    const bottomInput = screen.getByLabelText(/Margen Inferior/i);
    fireEvent.change(bottomInput, { target: { value: "25" } });

    const leftInput = screen.getByLabelText(/Margen Izquierdo/i);
    fireEvent.change(leftInput, { target: { value: "20" } });

    const rightInput = screen.getByLabelText(/Margen Derecho/i);
    fireEvent.change(rightInput, { target: { value: "18" } });

    // Toggle hide header logo for preprinted letterhead
    const hideHeaderToggle = screen.getByLabelText(/Ocultar logotipo y cabecera digital en la hoja impresa/i);
    fireEvent.click(hideHeaderToggle);
    expect(hideHeaderToggle).toBeChecked();

    // Verify preprinted notice appears in live preview
    expect(screen.getByText(/Espacio reservado para el membrete preimpreso/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: /Guardar logo y parámetros de vigencia/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_margins_enabled: true,
        margin_top_mm: 35,
        margin_bottom_mm: 25,
        margin_left_mm: 20,
        margin_right_mm: 18,
        hide_header_logo_on_print: true,
      }),
    );
  });

  it("renders BudgetPrintFormatDocument with custom margins and pre-printed sheet mode", () => {
    const budget = {
      id: "bud-margins-1",
      patient_id: "pat-1",
      doctor_id: "doc-1",
      doctor_name: "Dr. Jordi Martí",
      series: "PRE",
      budget_number: 101,
      title: "Tratamiento Integral",
      issue_date: "2026-11-16",
      validity_days: 30,
      valid_until: "2026-12-16",
      status: "PRESENTED" as const,
      min_estimate_amount: 500,
      max_estimate_amount: 500,
      accepted_amount: 500,
      notes: "",
      created_at: "2026-11-16T10:00:00Z",
      updated_at: "2026-11-16T10:00:00Z",
      findings_blocks: [],
    };

    render(
      <BudgetPrintFormatDocument
        budget={budget}
        patientName="Carlos Soto"
        clinicName="Clínica Membretada"
        customMarginsEnabled={true}
        marginTopMm={40}
        marginBottomMm={30}
        marginLeftMm={25}
        marginRightMm={25}
        hideHeaderLogoOnPrint={true}
      />,
    );

    expect(screen.getByText(/Modo Hoja Preimpresa Activo/i)).toBeInTheDocument();
  });
});
