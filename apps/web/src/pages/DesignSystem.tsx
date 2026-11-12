import { useState } from "react";
import {
  Alert,
  AppointmentCard,
  Badge,
  Button,
  Card,
  Checkbox,
  ClinicalHistoryTimeline,
  Combobox,
  CriticalAlertBanner,
  CurrencyInput,
  DropdownMenu,
  Input,
  InvoiceLineEditor,
  Modal,
  MultiCabinetTimeline,
  OdontogramGrid,
  PageHeader,
  QRVerifierBlock,
  RadioGroup,
  Select,
  Sheet,
  Skeleton,
  Stat,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  WaitingListCandidateCard,
  useToast,
  type InvoiceLineItem,
  type ToothState,
} from "@dentistes/ui";

export function DesignSystemPage() {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(false);
  const [comboVal, setComboVal] = useState("1");
  const [radioVal, setRadioVal] = useState("morning");
  const [tab, setTab] = useState("primitives");
  const [teeth, setTeeth] = useState<Record<number, ToothState>>({});
  const [tool, setTool] = useState<"healthy" | "caries" | "restored" | "planned" | "missing">("caries");
  const [lines, setLines] = useState<InvoiceLineItem[]>([
    { id: "1", description: "Obturación composite", toothNumber: "16", quantity: 1, unitPriceCents: 6500, taxRatePercent: 0 },
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design System · @dentistes/ui"
        description="Catálogo vivo de tokens, primitivas accesibles, overlays y módulos clínicos"
        actions={
          <Button onClick={() => notify({ tone: "success", title: "Toast activo", description: "Notificación no invasiva" })}>
            Probar Toast
          </Button>
        }
      />

      <Tabs
        activeId={tab}
        onChange={setTab}
        items={[
          {
            id: "primitives",
            label: "Primitivas i Overlays",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Botones, Badges i Estadísticas">
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button loading>Loading</Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>Neutral</Badge>
                    <Badge tone="success">Confirmada</Badge>
                    <Badge tone="warning">Pendiente</Badge>
                    <Badge tone="danger">Crítico</Badge>
                    <Badge tone="info">En box</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Stat label="Cites avui" value="18" hint="3 gabinets" />
                    <Stat label="Confirmació" value="94%" />
                  </div>
                </Card>

                <Card title="Inputs, Select, Combobox i Controls">
                  <div className="space-y-3">
                    <Input label="Nom del pacient" placeholder="Anna Martí" />
                    <CurrencyInput label="Import del pressupost" currency="USD" defaultValue="18.50" />
                    <Combobox
                      label="Selector cercable (Combobox)"
                      value={comboVal}
                      onChange={setComboVal}
                      options={[
                        { value: "1", label: "Anna Martí", hint: "Tel. 600 111 222" },
                        { value: "2", label: "Marc Puig", hint: "Tel. 600 333 444" },
                      ]}
                    />
                    <Select
                      label="Tipus de visita"
                      value="revision"
                      onChange={() => undefined}
                      options={[{ value: "revision", label: "Revisió" }, { value: "neteja", label: "Neteja" }]}
                    />
                    <Textarea label="Notes d'evolució" placeholder="Auto-creixement vertical…" />
                    <Checkbox label="Consentiment signat" checked={checked} onChange={setChecked} />
                    <Switch label="Recordatoris WhatsApp" checked={switched} onChange={setSwitched} />
                    <RadioGroup
                      label="Franja preferida"
                      name="slot-demo"
                      value={radioVal}
                      onChange={setRadioVal}
                      options={[
                        { value: "morning", label: "Matins" },
                        { value: "afternoon", label: "Tardes" },
                      ]}
                    />
                  </div>
                </Card>

                <Card title="Overlays i Feedback" className="lg:col-span-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={() => setModalOpen(true)}>Abrir Modal</Button>
                    <Button variant="outline" onClick={() => setSheetOpen(true)}>Abrir Drawer / Sheet</Button>
                    <Tooltip label="Tooltip accesible con foco/hover">
                      <Button variant="ghost">Hover o Focus aquí</Button>
                    </Tooltip>
                    <DropdownMenu
                      trigger={<Button variant="secondary">Menú contextual</Button>}
                      items={[
                        { id: "1", label: "Confirmar cita", onSelect: () => notify({ title: "Cita confirmada", tone: "success" }) },
                        { id: "2", label: "Cancelar cita", danger: true, onSelect: () => notify({ title: "Cita cancelada", tone: "warning" }) },
                      ]}
                    />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <div className="mt-4">
                    <Alert tone="info" title="Accessibilitat WCAG 2.1 AA">
                      Touch targets mínims de 44px per a tauletes en gabinet i suport complet de teclat.
                    </Alert>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            id: "clinical",
            label: "Components Clínics (F1–F6)",
            content: (
              <div className="space-y-6">
                <CriticalAlertBanner
                  alerts={{
                    high_risk: true,
                    requires_antibiotic_prophylaxis: true,
                    allergies: [{ name: "Penicil·lina", reaction: "Anafilaxi" }],
                    conditions: [{ name: "Tractament anticoagulant" }],
                    medications: [{ name: "Sintrom", dosage: "4mg" }],
                  }}
                />

                <Card title="OdontogramGrid (F1)">
                  <OdontogramGrid
                    teeth={teeth}
                    activeTool={tool}
                    onToolChange={setTool}
                    onToggleSurface={(toothNum, surface, next) =>
                      setTeeth((prev) => ({
                        ...prev,
                        [toothNum]: {
                          tooth_number: toothNum,
                          surfaces: {
                            occlusal: prev[toothNum]?.surfaces.occlusal ?? "healthy",
                            mesial: prev[toothNum]?.surfaces.mesial ?? "healthy",
                            distal: prev[toothNum]?.surfaces.distal ?? "healthy",
                            vestibular: prev[toothNum]?.surfaces.vestibular ?? "healthy",
                            lingual: prev[toothNum]?.surfaces.lingual ?? "healthy",
                            [surface]: next,
                          },
                        },
                      }))
                    }
                  />
                </Card>

                <Card title="MultiCabinetTimeline & AppointmentCard (F2)">
                  <MultiCabinetTimeline
                    cabinets={[
                      { id: "c1", name: "Box 1", colorCode: "#0D9488" },
                      { id: "c2", name: "Box 2", colorCode: "#2563EB" },
                    ]}
                    slots={["09:00", "09:30", "10:00"]}
                    appointmentsByCabinet={{
                      c1: [
                        {
                          id: "a1",
                          patientName: "Anna Martí",
                          doctorName: "Dr. Puig",
                          treatmentType: "Neteja",
                          startTime: "09:00",
                          endTime: "09:30",
                          status: "CONFIRMED",
                          highRisk: true,
                        },
                      ],
                      c2: [
                        {
                          id: "a2",
                          patientName: "Marc Soler",
                          doctorName: "Dra. Serra",
                          treatmentType: "Endodòncia",
                          startTime: "09:30",
                          endTime: "10:30",
                          status: "IN_CABINET",
                        },
                      ],
                    }}
                  />
                  <div className="mt-4 max-w-xs">
                    <AppointmentCard
                      appointment={{
                        id: "demo",
                        patientName: "Laia Vidal",
                        doctorName: "Dra. Serra",
                        treatmentType: "Revisió",
                        startTime: "11:00",
                        endTime: "11:30",
                        status: "SCHEDULED",
                      }}
                    />
                  </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card title="ClinicalHistoryTimeline (F3)">
                    <ClinicalHistoryTimeline
                      entries={[
                        {
                          id: "1",
                          entryType: "PROCEDURE",
                          content: "Obturació peça 16 oclusal amb anestèsia sense vasoconstrictor.",
                          doctorName: "Dra. Laia Serra",
                          licenseNumber: "08004512",
                          createdAt: "2026-11-11 10:15",
                        },
                      ]}
                    />
                  </Card>
                  <Card title="WaitingListCandidateCard (F5)">
                    <WaitingListCandidateCard
                      patientName="Jordi Pons"
                      phone="+34 600 444 555"
                      treatmentType="Endodòncia"
                      durationMinutes={45}
                      urgencyLevel="HIGH"
                      matchScore={96}
                      onOfferWhatsApp={() => notify({ title: "Oferta enviada per WhatsApp", tone: "success" })}
                    />
                  </Card>
                </div>

                <Card title="InvoiceLineEditor & QRVerifierBlock (F6)">
                  <div className="space-y-4">
                    <InvoiceLineEditor lines={lines} onChange={setLines} />
                    <QRVerifierBlock
                      documentNumber="FAC-2026-0042"
                      verificationHash="sha256:9f84b3e2...a10c"
                      verificationUrl="https://dentistes.2mes4.com/verify/9f84b3e2"
                      onDownloadPdf={() => notify({ title: "PDF generat", tone: "info" })}
                    />
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ejemplo de Modal" description="Bloqueo de foco y cierre con Esc">
        <p className="text-sm text-slate-600">Contenido accesible del modal.</p>
      </Modal>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Panel lateral (Sheet)">
        <p className="text-sm text-slate-600">Ideal para revisar la ficha del paciente sin perder el contexto de la agenda.</p>
      </Sheet>
    </div>
  );
}
