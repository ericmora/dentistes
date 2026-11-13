import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Card, Badge, Button } from "@dentistes/ui";
import type { FiscalCapabilitiesResponse } from "@dentistes/sdk";

describe("Fiscal Capabilities UI Component", () => {
  it("renders active direct fiscal authority correctly", () => {
    const caps: FiscalCapabilitiesResponse = {
      tenant_id: "t1",
      country_code: "ES",
      currency: "EUR",
      localization: {
        tax_id_label: "NIF",
        tax_id_placeholder: "B12345678",
        fiscal_authority: "AEAT",
        document_label: "VeriFactu / TicketBAI",
      },
      features: {
        electronic_invoicing: {
          status: "ACTIVE",
          enabled: true,
          waitlist_joined: false,
          fallback_mode: "INTERNAL_RECEIPT_PDF",
        },
        internal_cash_register: {
          status: "ACTIVE",
          enabled: true,
        },
      },
    };

    render(
      <Card title="Compliment Fiscal i Facturació Regional" description={`Jurisdicció: ${caps.country_code} · Divisa: ${caps.currency}`}>
        <p data-testid="authority">{caps.localization.fiscal_authority} ({caps.localization.document_label})</p>
        <Badge tone="success">Actiu ({caps.features.electronic_invoicing.status})</Badge>
      </Card>
    );

    expect(screen.getByTestId("authority")).toHaveTextContent("AEAT (VeriFactu / TicketBAI)");
    expect(screen.getByText("Actiu (ACTIVE)")).toBeInTheDocument();
  });

  it("renders coming soon waitlist button when electronic invoicing is in development", () => {
    const caps: FiscalCapabilitiesResponse = {
      tenant_id: "t2",
      country_code: "MX",
      currency: "MXN",
      localization: {
        tax_id_label: "RFC",
        tax_id_placeholder: "XAXX010101000",
        fiscal_authority: "SAT",
        document_label: "CFDI 4.0",
      },
      features: {
        electronic_invoicing: {
          status: "COMING_SOON",
          enabled: false,
          waitlist_joined: false,
          fallback_mode: "INTERNAL_RECEIPT_PDF",
          ui_notice: "La facturació electrònica CFDI 4.0 està en fase d'integració.",
        },
        internal_cash_register: {
          status: "ACTIVE",
          enabled: true,
        },
      },
    };

    render(
      <Card title="Compliment Fiscal i Facturació Regional">
        <p data-testid="notice">{caps.features.electronic_invoicing.ui_notice}</p>
        <Button size="sm" variant="outline">
          Sol·licitar activació prioritària ({caps.localization.fiscal_authority})
        </Button>
      </Card>
    );

    expect(screen.getByTestId("notice")).toHaveTextContent("La facturació electrònica CFDI 4.0 està en fase d'integració.");
    expect(screen.getByRole("button", { name: /Sol·licitar activació prioritària \(SAT\)/i })).toBeInTheDocument();
  });
});
