import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { InvoiceLineEditor, QRVerifierBlock } from "@dentistes/ui";

describe("Patient Clinical Invoicing Components (F6)", () => {
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
});
