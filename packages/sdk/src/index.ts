export type FeatureMap = Record<string, boolean>;

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_platform_admin: boolean;
}

export interface Membership {
  tenant_id: string;
  tenant_name: string;
  subdomain: string;
  role: string;
  tenant_status: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  billing_country_code?: string;
  billing_currency?: string;
  tax_id?: string;
  trial_ends_at?: string;
}

export interface Feature {
  key: string;
  name: string;
  description: string;
}

export interface Entitlements {
  tenant_status: string;
  subscription_status: string;
  plan_key: string;
  features: FeatureMap;
  blocked_reason?: string;
}

export interface Subscription {
  tenant_id: string;
  plan_key: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  trial_ends_at?: string;
}

export interface MeResponse {
  user: User;
  memberships: Membership[];
  active_tenant: Tenant;
  role: string;
  permissions: string[];
  features: FeatureMap;
  feature_catalog: Feature[];
  entitlements: Entitlements;
  billing: Subscription | null;
}

export interface Plan {
  key: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  currency: string;
  stripe_price_id?: string;
  is_active: boolean;
  features: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user: User;
  memberships: Membership[];
  active_tenant?: Tenant;
  checkout_url?: string;
  hostname?: string;
}

export interface OnboardingInput {
  clinic_name: string;
  subdomain?: string;
  full_name: string;
  email: string;
  password: string;
  cabinets_count?: number;
  locale?: string;
  country_code?: string;
  billing_country_code?: string;
  currency?: string;
  billing_currency?: string;
  tax_id?: string;
  plan_key?: string;
}

export interface FiscalCapabilitiesResponse {
  tenant_id: string;
  country_code: string;
  currency: string;
  localization: {
    tax_id_label: string;
    tax_id_placeholder: string;
    fiscal_authority: string;
    document_label: string;
  };
  features: {
    electronic_invoicing: {
      status: string;
      enabled: boolean;
      waitlist_joined: boolean;
      fallback_mode: string;
      ui_notice?: string;
    };
    internal_cash_register: {
      status: string;
      enabled: boolean;
    };
  };
}

export interface RegionalFiscalConfig {
  country_code: string;
  country_name: string;
  currency_code: string;
  tax_authority_name: string;
  fiscal_document_name: string;
  tax_id_label: string;
  tax_id_regex: string;
  compliance_status: string;
  requires_partner: boolean;
  partner_provider_key?: string;
  adapter_class: string;
  default_vat_rate: number;
  retention_years: number;
}

export interface OnboardingResponse extends AuthResponse {
  checkout_url: string;
  hostname?: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dni_nie?: string;
  birth_date: string;
  gender?: string;
  phone: string;
  email?: string;
  whatsapp_opt_in: boolean;
  high_risk: boolean;
  created_at: string;
}

export interface MedicalAlerts {
  allergies?: Array<{ name: string; severity?: "HIGH" | "MEDIUM" | "LOW"; reaction?: string } | string>;
  conditions?: Array<{ code?: string; name: string; active?: boolean } | string>;
  medications?: Array<{ name: string; dosage?: string } | string>;
  high_risk?: boolean;
  requires_antibiotic_prophylaxis?: boolean;
  notes?: string;
  summary?: string;
}

export interface PatientDetail extends Patient {
  address: Record<string, unknown>;
  medical_alerts: MedicalAlerts;
}

export interface ClinicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  entry_type: "NOTE" | "DIAGNOSIS" | "PROCEDURE" | "PRESCRIPTION";
  content: string;
  amends_entry_id?: string;
  created_at: string;
}

export interface Odontogram {
  id: string;
  patient_id: string;
  doctor_id: string;
  type: "INITIAL" | "CURRENT" | "HISTORICAL";
  teeth_data: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CabinetDayAvailability {
  day_of_week: number; // 1 = Lunes .. 7 = Domingo
  day_name?: string;
  is_open: boolean;
  start_time: string; // "09:00"
  end_time: string;   // "20:00"
  break_start?: string; // "14:00"
  break_end?: string;   // "15:00"
}

export function defaultCabinetAvailability(): CabinetDayAvailability[] {
  return [
    { day_of_week: 1, day_name: "Lunes", is_open: true, start_time: "09:00", end_time: "20:00", break_start: "14:00", break_end: "15:00" },
    { day_of_week: 2, day_name: "Martes", is_open: true, start_time: "09:00", end_time: "20:00", break_start: "14:00", break_end: "15:00" },
    { day_of_week: 3, day_name: "Miércoles", is_open: true, start_time: "09:00", end_time: "20:00", break_start: "14:00", break_end: "15:00" },
    { day_of_week: 4, day_name: "Jueves", is_open: true, start_time: "09:00", end_time: "20:00", break_start: "14:00", break_end: "15:00" },
    { day_of_week: 5, day_name: "Viernes", is_open: true, start_time: "09:00", end_time: "20:00", break_start: "14:00", break_end: "15:00" },
    { day_of_week: 6, day_name: "Sábado", is_open: true, start_time: "09:00", end_time: "14:00" },
    { day_of_week: 7, day_name: "Domingo", is_open: false, start_time: "09:00", end_time: "14:00" },
  ];
}

export interface Cabinet {
  id: string;
  name: string;
  color_code: string;
  is_active: boolean;
  availability?: CabinetDayAvailability[];
  created_at: string;
}

export interface PatientInvoiceItem {
  id: string;
  description: string;
  tooth_number?: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate_percent: number;
}

export interface PatientPayment {
  id: string;
  tenant_id?: string;
  invoice_id: string;
  amount: number;
  payment_method: "CASH" | "CARD" | "TRANSFER" | "FINANCING";
  transaction_reference?: string;
  created_at: string;
}

export interface PatientInvoice {
  id: string;
  tenant_id?: string;
  patient_id: string;
  series: string;
  invoice_number: number;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: "DRAFT" | "ISSUED" | "PAID" | "PARTIAL" | "CANCELLED";
  verification_hash: string;
  items: PatientInvoiceItem[];
  payments?: PatientPayment[];
  created_at: string;
}

export interface CreatePatientInvoiceInput {
  series?: string;
  issue_date?: string;
  due_date?: string;
  status?: "DRAFT" | "ISSUED";
  items: PatientInvoiceItem[];
}

export interface Doctor {
  id: string;
  full_name: string;
  role: string;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "WHATSAPP_SENT"
  | "CONFIRMED"
  | "WAITING_ROOM"
  | "IN_CABINET"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_high_risk: boolean;
  doctor_id: string;
  doctor_name: string;
  cabinet_id: string;
  cabinet_name: string;
  start_time: string;
  end_time: string;
  treatment_type: string;
  status: AppointmentStatus;
  cancellation_reason?: string;
  is_forced?: boolean;
  notes?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MasterTreatment {
  code: string;
  name: string;
  category: "PREVENCION" | "CONSERVADORA" | "ENDODONCIA" | "CIRUGIA" | "PROTESIS" | "ORTODONCIA" | "ESTETICA" | "PERIODONCIA";
  category_label: string;
  default_duration_minutes: number;
  color: string;
}

export interface Treatment {
  id: string;
  tenant_id?: string;
  code?: string;
  name: string;
  category: string;
  category_label?: string;
  default_price: number;
  estimated_minutes: number;
  color?: string;
  is_active: boolean;
  created_at?: string;
}

export const DENTAL_TREATMENTS_MASTER: MasterTreatment[] = [
  // Diagnóstico y Prevención
  { code: "REVISION", name: "Revisión y Diagnóstico", category: "PREVENCION", category_label: "Diagnóstico y Prevención", default_duration_minutes: 30, color: "#0EA5E9" },
  { code: "LIMPIEZA", name: "Limpieza dental (Tartrectomía)", category: "PREVENCION", category_label: "Diagnóstico y Prevención", default_duration_minutes: 30, color: "#06B6D4" },
  { code: "RADIOGRAFIA", name: "Radiografía / Ortopantomografía", category: "PREVENCION", category_label: "Diagnóstico y Prevención", default_duration_minutes: 15, color: "#64748B" },
  { code: "URGENCIA", name: "Urgencia dental", category: "PREVENCION", category_label: "Diagnóstico y Prevención", default_duration_minutes: 30, color: "#EF4444" },

  // Odontología Conservadora
  { code: "OBTURACION_SIMPLE", name: "Obturación / Empaste simple", category: "CONSERVADORA", category_label: "Conservadora", default_duration_minutes: 30, color: "#3B82F6" },
  { code: "OBTURACION_COMPLEJA", name: "Reconstrucción compleja", category: "CONSERVADORA", category_label: "Conservadora", default_duration_minutes: 45, color: "#2563EB" },
  { code: "SELLADOR", name: "Sellador de fisuras", category: "CONSERVADORA", category_label: "Conservadora", default_duration_minutes: 20, color: "#60A5FA" },

  // Endodoncia
  { code: "ENDODONCIA_UNIRRADICULAR", name: "Endodoncia unirradicular", category: "ENDODONCIA", category_label: "Endodoncia", default_duration_minutes: 45, color: "#8B5CF6" },
  { code: "ENDODONCIA_MULTIRRADICULAR", name: "Endodoncia multirradicular", category: "ENDODONCIA", category_label: "Endodoncia", default_duration_minutes: 60, color: "#7C3AED" },
  { code: "REENDODONCIA", name: "Reendodoncia", category: "ENDODONCIA", category_label: "Endodoncia", default_duration_minutes: 60, color: "#6D28D9" },

  // Cirugía e Implantes
  { code: "EXTRACCION_SIMPLE", name: "Extracción simple", category: "CIRUGIA", category_label: "Cirugía e Implantes", default_duration_minutes: 30, color: "#F97316" },
  { code: "EXTRACCION_QUIRURGICA", name: "Extracción quirúrgica / Cordal", category: "CIRUGIA", category_label: "Cirugía e Implantes", default_duration_minutes: 45, color: "#EA580C" },
  { code: "IMPLANTE", name: "Colocación de implante", category: "CIRUGIA", category_label: "Cirugía e Implantes", default_duration_minutes: 60, color: "#0F172A" },

  // Periodoncia
  { code: "CURETAJE_CUADRANTE", name: "Curetaje / Raspado por cuadrante", category: "PERIODONCIA", category_label: "Periodoncia", default_duration_minutes: 45, color: "#10B981" },
  { code: "MANTENIMIENTO_PERIODONTAL", name: "Mantenimiento periodontal", category: "PERIODONCIA", category_label: "Periodoncia", default_duration_minutes: 30, color: "#059669" },

  // Prótesis
  { code: "CORONA", name: "Corona / Funda", category: "PROTESIS", category_label: "Prótesis", default_duration_minutes: 45, color: "#D97706" },
  { code: "PUENTE", name: "Puente fijo", category: "PROTESIS", category_label: "Prótesis", default_duration_minutes: 45, color: "#B45309" },
  { code: "PROTESIS_REMOVIBLE", name: "Prótesis removible", category: "PROTESIS", category_label: "Prótesis", default_duration_minutes: 30, color: "#92400E" },

  // Ortodoncia y Estética
  { code: "ORTODONCIA_REVISION", name: "Ortodoncia (Ajuste mensual)", category: "ORTODONCIA", category_label: "Ortodoncia", default_duration_minutes: 15, color: "#EC4899" },
  { code: "ORTODONCIA_COLOCACION", name: "Colocación brackets / Alineadores", category: "ORTODONCIA", category_label: "Ortodoncia", default_duration_minutes: 60, color: "#DB2777" },
  { code: "BLANQUEAMIENTO", name: "Blanqueamiento dental", category: "ESTETICA", category_label: "Estética dental", default_duration_minutes: 45, color: "#F59E0B" },
  { code: "FERULA_DESCARGA", name: "Férula de descarga (Bruxismo)", category: "ESTETICA", category_label: "Estética dental", default_duration_minutes: 30, color: "#6366F1" },
];

export function findMasterTreatment(codeOrName: string): MasterTreatment | undefined {
  const norm = codeOrName.trim().toLowerCase();
  return DENTAL_TREATMENTS_MASTER.find((t) => t.code.toLowerCase() === norm || t.name.toLowerCase() === norm);
}

export interface WaitingListEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  doctor_id?: string;
  doctor_name?: string;
  treatment_type: string;
  estimated_duration_minutes: number;
  preferred_time_slot: "ANY" | "MORNING" | "AFTERNOON";
  preferred_days: number[];
  urgency_level: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "WAITING" | "OFFERED" | "SCHEDULED" | "EXPIRED" | "CANCELLED";
  hold_expires_at?: string;
  notes?: string;
  created_at: string;
}

export interface WaitingCandidateMatch {
  entry: WaitingListEntry;
  match_score: number;
}

export interface StripeInvoice {
  id: string;
  number: string;
  status: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  created: number;
  hosted_invoice_url: string;
  invoice_pdf: string;
}

export interface PublicTenant {
  tenant_id: string;
  name: string;
  subdomain: string;
  tenant_status: string;
  hostname: string;
  domain_status: string;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  hostname: string;
  is_primary: boolean;
  tls_secret_name: string;
  status: string;
  last_error?: string;
  attempts: number;
  next_attempt_at?: string;
  provisioned_at?: string;
  created_at: string;
}

export interface TenantUser {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  trial_ends_at?: string;
  created_at: string;
  subscription_status: string;
  plan_key: string;
  current_period_end?: string;
}

export type LeadInterest = "DEMO" | "TRIAL" | "MIGRATION" | "OTHER";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "ARCHIVED";

export interface Lead {
  id: string;
  contact_name: string;
  clinic_name: string;
  email: string;
  phone: string;
  interest: LeadInterest;
  lang: string;
  notes: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  contact_name: string;
  clinic_name: string;
  email: string;
  phone?: string;
  interest?: LeadInterest;
  lang?: string;
  notes?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class DentistesError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody | undefined) {
    super(body?.message ?? `HTTP ${status}`);
    this.name = "DentistesError";
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.details = body?.details;
  }
}

export interface TokenStorage {
  getAccessToken(): string | null | Promise<string | null>;
  setAccessToken(token: string | null): void | Promise<void>;
  getRefreshToken(): string | null | Promise<string | null>;
  setRefreshToken(token: string | null): void | Promise<void>;
}

export class MemoryTokenStorage implements TokenStorage {
  private access: string | null = null;
  private refresh: string | null = null;

  constructor(initialAccess: string | null = null, initialRefresh: string | null = null) {
    this.access = initialAccess;
    this.refresh = initialRefresh;
  }

  getAccessToken(): string | null {
    return this.access;
  }
  setAccessToken(token: string | null): void {
    this.access = token;
  }
  getRefreshToken(): string | null {
    return this.refresh;
  }
  setRefreshToken(token: string | null): void {
    this.refresh = token;
  }
}

export interface DentistesClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  mode?: "browser" | "native";
  tenantId?: string;
  storage?: TokenStorage;
  getAccessToken?: () => string | null;
  onAccessToken?: (token: string | null) => void;
  getRefreshToken?: () => string | null;
  onRefreshToken?: (token: string | null) => void;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
  headers?: Record<string, string>;
}

export class DentistesClient {
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly mode: "browser" | "native";
  private readonly storage?: TokenStorage;
  private readonly getAccessToken?: () => string | null;
  private readonly onAccessToken?: (token: string | null) => void;
  private readonly getRefreshToken?: () => string | null;
  private readonly onRefreshToken?: (token: string | null) => void;
  private accessToken: string | null = null;
  private activeTenantId: string | null = null;

  constructor(options: DentistesClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.mode = options.mode ?? "browser";
    this.storage = options.storage;
    this.activeTenantId = options.tenantId ?? null;
    this.getAccessToken = options.getAccessToken;
    this.onAccessToken = options.onAccessToken;
    this.getRefreshToken = options.getRefreshToken;
    this.onRefreshToken = options.onRefreshToken;
  }

  setTenantId(tenantId: string | null): void {
    this.activeTenantId = tenantId;
  }

  getTenantId(): string | null {
    return this.activeTenantId;
  }

  private async token(): Promise<string | null> {
    if (this.storage) {
      return (await this.storage.getAccessToken()) ?? this.accessToken;
    }
    return this.getAccessToken?.() ?? this.accessToken;
  }

  private async setToken(token: string | null): Promise<void> {
    this.accessToken = token;
    if (this.storage) {
      await this.storage.setAccessToken(token);
    }
    this.onAccessToken?.(token);
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    if (this.storage) {
      return await this.storage.getRefreshToken();
    }
    return this.getRefreshToken?.() ?? null;
  }

  private async setStoredRefreshToken(token: string | null): Promise<void> {
    if (this.storage) {
      await this.storage.setRefreshToken(token);
    }
    this.onRefreshToken?.(token);
  }

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const token = await this.token();
    const headers: Record<string, string> = { "Content-Type": "application/json", ...opts.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (this.activeTenantId) headers["X-Tenant-ID"] = this.activeTenantId;
    if (this.mode === "native") headers["X-Client"] = "native";

    const res = await this.fetchImpl(this.baseUrl + path, {
      method: opts.method ?? "GET",
      headers,
      credentials: this.mode === "browser" ? "include" : "omit",
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });

    if (res.status === 401 && opts.auth !== false && opts.retry !== false) {
      const refreshed = await this.refresh().catch(() => false);
      if (refreshed) {
        return this.request<T>(path, { ...opts, retry: false });
      }
    }

    if (res.status === 204) return undefined as T;
    const payload = (await res.json().catch(() => null)) as
      | { error?: ApiErrorBody }
      | null;
    if (!res.ok) {
      throw new DentistesError(res.status, payload?.error);
    }
    return payload as T;
  }

  get accessTokenValue(): string | null {
    return this.accessToken;
  }

  async login(email: string, password: string, opts: { tenantId?: string; subdomain?: string } = {}): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/v1/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password, tenant_id: opts.tenantId ?? this.activeTenantId, subdomain: opts.subdomain },
    });
    await this.setToken(res.access_token);
    if (res.refresh_token) await this.setStoredRefreshToken(res.refresh_token);
    return res;
  }

  async signup(input: {
    tenant_name: string;
    subdomain: string;
    email: string;
    password: string;
    full_name: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/v1/public/signup", {
      method: "POST",
      auth: false,
      body: input,
    });
    await this.setToken(res.access_token);
    if (res.refresh_token) await this.setStoredRefreshToken(res.refresh_token);
    return res;
  }

  async onboarding(input: OnboardingInput): Promise<OnboardingResponse> {
    const res = await this.request<OnboardingResponse>("/v1/public/onboarding", {
      method: "POST",
      auth: false,
      body: input,
    });
    await this.setToken(res.access_token);
    if (res.refresh_token) await this.setStoredRefreshToken(res.refresh_token);
    return res;
  }

  async refreshSession(): Promise<AuthResponse | null> {
    const refreshToken = await this.getStoredRefreshToken();
    if (this.mode === "native" && !refreshToken) return null;
    try {
      const res = await this.request<AuthResponse>("/v1/auth/refresh", {
        method: "POST",
        auth: false,
        body: this.mode === "native" ? { refresh_token: refreshToken } : {},
      });
      await this.setToken(res.access_token);
      if (res.refresh_token) await this.setStoredRefreshToken(res.refresh_token);
      return res;
    } catch {
      await this.setToken(null);
      return null;
    }
  }

  async refresh(): Promise<boolean> {
    return (await this.refreshSession()) !== null;
  }

  async logout(): Promise<void> {
    const refreshToken = await this.getStoredRefreshToken();
    await this.request<void>("/v1/auth/logout", {
      method: "POST",
      auth: false,
      body: this.mode === "native" && refreshToken ? { refresh_token: refreshToken } : {},
    }).catch(() => undefined);
    await this.setToken(null);
    await this.setStoredRefreshToken(null);
  }

  async bootstrap(): Promise<MeResponse | null> {
    if (!(await this.refresh())) return null;
    try {
      return await this.me();
    } catch {
      return null;
    }
  }

  me(): Promise<MeResponse> {
    return this.request<MeResponse>("/v1/me");
  }

  switchTenant(tenantId: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/v1/auth/switch-tenant", {
      method: "POST",
      body: { tenant_id: tenantId },
    });
  }

  async plans(): Promise<{ plans: Plan[]; feature_catalog: Feature[] }> {
    return this.request("/v1/public/plans", { auth: false });
  }

  tenant(subdomain: string): Promise<{ tenant: PublicTenant }> {
    return this.request(`/v1/public/tenant?subdomain=${encodeURIComponent(subdomain)}`, { auth: false });
  }

  createLead(input: CreateLeadInput): Promise<{ lead: Lead }> {
    return this.request("/v1/public/leads", { method: "POST", auth: false, body: input });
  }

  listPatients(params: { q?: string; limit?: number; offset?: number } = {}): Promise<{
    patients: Patient[];
    limit: number;
    offset: number;
  }> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    const suffix = query.toString() ? `?${query}` : "";
    return this.request(`/v1/patients${suffix}`);
  }

  createPatient(input: {
    first_name: string;
    last_name: string;
    birth_date: string;
    phone: string;
    email?: string;
    dni_nie?: string;
    gender?: string;
    whatsapp_opt_in?: boolean;
    medical_alerts?: Record<string, unknown>;
    address?: Record<string, unknown>;
  }): Promise<Patient> {
    return this.request("/v1/patients", { method: "POST", body: input });
  }

  getPatient(patientId: string): Promise<{ patient: PatientDetail }> {
    return this.request(`/v1/patients/${patientId}`);
  }

  updatePatient(
    patientId: string,
    input: {
      first_name: string;
      last_name: string;
      birth_date: string;
      phone: string;
      email?: string;
      dni_nie?: string;
      gender?: string;
      whatsapp_opt_in?: boolean;
      address?: Record<string, unknown>;
      medical_alerts?: MedicalAlerts;
    },
  ): Promise<{ patient: PatientDetail }> {
    return this.request(`/v1/patients/${patientId}`, { method: "PATCH", body: input });
  }

  listClinicalRecords(patientId: string): Promise<{ records: ClinicalRecord[] }> {
    return this.request(`/v1/patients/${patientId}/clinical-records`);
  }

  createClinicalRecord(
    patientId: string,
    input: {
      entry_type: ClinicalRecord["entry_type"];
      content: string;
      appointment_id?: string;
      amends_entry_id?: string;
    },
  ): Promise<{ record: ClinicalRecord }> {
    return this.request(`/v1/patients/${patientId}/clinical-records`, { method: "POST", body: input });
  }

  listOdontograms(patientId: string): Promise<{ odontograms: Odontogram[] }> {
    return this.request(`/v1/patients/${patientId}/odontograms`);
  }

  saveOdontogram(
    patientId: string,
    type: Odontogram["type"],
    input: { teeth_data: Record<string, unknown>; version?: number },
  ): Promise<{ odontogram: Odontogram }> {
    return this.request(`/v1/patients/${patientId}/odontograms/${type}`, { method: "PUT", body: input });
  }

  listPatientInvoices(patientId: string): Promise<{ invoices: PatientInvoice[] }> {
    return this.request(`/v1/patients/${encodeURIComponent(patientId)}/invoices`);
  }

  createPatientInvoice(patientId: string, input: CreatePatientInvoiceInput): Promise<{ invoice: PatientInvoice }> {
    return this.request(`/v1/patients/${encodeURIComponent(patientId)}/invoices`, { method: "POST", body: input });
  }

  recordInvoicePayment(
    invoiceId: string,
    input: { amount: number; payment_method: string; transaction_reference?: string },
  ): Promise<{ payment: PatientPayment }> {
    return this.request(`/v1/invoices/${encodeURIComponent(invoiceId)}/payments`, { method: "POST", body: input });
  }

  listCabinets(): Promise<{ cabinets: Cabinet[] }> {
    return this.request("/v1/cabinets");
  }

  createCabinet(input: {
    name: string;
    color_code?: string;
    availability?: CabinetDayAvailability[];
  }): Promise<{ cabinet: Cabinet }> {
    return this.request("/v1/cabinets", { method: "POST", body: input });
  }

  updateCabinet(
    id: string,
    input: {
      name?: string;
      color_code?: string;
      availability?: CabinetDayAvailability[];
    }
  ): Promise<{ cabinet: Cabinet }> {
    return this.request(`/v1/cabinets/${encodeURIComponent(id)}`, { method: "PUT", body: input });
  }

  deleteCabinet(id: string): Promise<{ ok: boolean }> {
    return this.request(`/v1/cabinets/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  listTreatments(params: { all?: boolean } = {}): Promise<{ treatments: Treatment[] }> {
    const q = params.all ? "?all=true" : "";
    return this.request(`/v1/treatments${q}`);
  }

  createTreatment(input: {
    code?: string;
    name: string;
    category?: string;
    default_price?: number;
    estimated_minutes?: number;
    color?: string;
  }): Promise<{ treatment: Treatment }> {
    return this.request("/v1/treatments", { method: "POST", body: input });
  }

  updateTreatment(
    id: string,
    input: {
      name?: string;
      category?: string;
      default_price?: number;
      estimated_minutes?: number;
      color?: string;
      is_active?: boolean;
    },
  ): Promise<{ treatment: Treatment }> {
    return this.request(`/v1/treatments/${encodeURIComponent(id)}`, { method: "PUT", body: input });
  }

  deleteTreatment(id: string): Promise<{ ok: boolean }> {
    return this.request(`/v1/treatments/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  listDoctors(): Promise<{ doctors: Doctor[] }> {
    return this.request("/v1/doctors");
  }

  listAppointments(params: { start?: string; end?: string; cabinet_id?: string; doctor_id?: string } = {}): Promise<{
    appointments: Appointment[];
  }> {
    const query = new URLSearchParams();
    if (params.start) query.set("start", params.start);
    if (params.end) query.set("end", params.end);
    if (params.cabinet_id) query.set("cabinet_id", params.cabinet_id);
    if (params.doctor_id) query.set("doctor_id", params.doctor_id);
    const suffix = query.toString() ? `?${query}` : "";
    return this.request(`/v1/appointments${suffix}`);
  }

  createAppointment(input: {
    patient_id: string;
    doctor_id: string;
    cabinet_id: string;
    start_time: string;
    end_time: string;
    treatment_type: string;
    is_forced?: boolean;
    notes?: string;
  }): Promise<{ appointment: Appointment }> {
    return this.request("/v1/appointments", { method: "POST", body: input });
  }

  updateAppointment(
    id: string,
    input: {
      doctor_id: string;
      cabinet_id: string;
      start_time: string;
      end_time: string;
      treatment_type: string;
      is_forced?: boolean;
      notes?: string;
      version?: number;
    },
  ): Promise<{ appointment: Appointment }> {
    return this.request(`/v1/appointments/${id}`, { method: "PUT", body: input });
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    cancellationReason?: string,
  ): Promise<{ appointment: Appointment; waiting_list_matches?: WaitingCandidateMatch[] }> {
    return this.request(`/v1/appointments/${id}/status`, {
      method: "PATCH",
      body: { status, cancellation_reason: cancellationReason },
    });
  }

  appointmentStreamUrl(): string | null {
    const token = this.accessToken ?? this.getAccessToken?.();
    if (!token) return null;
    return `${this.baseUrl}/v1/appointments/stream?access_token=${encodeURIComponent(token)}`;
  }

  listWaitingList(status?: WaitingListEntry["status"]): Promise<{ entries: WaitingListEntry[] }> {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/v1/waiting-list${suffix}`);
  }

  createWaitingListEntry(input: {
    patient_id: string;
    doctor_id?: string;
    treatment_type: string;
    estimated_duration_minutes?: number;
    preferred_time_slot?: WaitingListEntry["preferred_time_slot"];
    preferred_days?: number[];
    urgency_level?: WaitingListEntry["urgency_level"];
    notes?: string;
  }): Promise<{ entry: WaitingListEntry }> {
    return this.request("/v1/waiting-list", { method: "POST", body: input });
  }

  matchWaitingList(params: { start: string; end: string; doctor_id?: string; limit?: number }): Promise<{
    matches: WaitingCandidateMatch[];
  }> {
    const query = new URLSearchParams({ start: params.start, end: params.end });
    if (params.doctor_id) query.set("doctor_id", params.doctor_id);
    if (params.limit) query.set("limit", String(params.limit));
    return this.request(`/v1/waiting-list/matches?${query}`);
  }

  holdWaitingListEntry(id: string): Promise<{ entry: WaitingListEntry }> {
    return this.request(`/v1/waiting-list/${id}/hold`, { method: "POST", body: {} });
  }

  updateWaitingListStatus(id: string, status: WaitingListEntry["status"]): Promise<{ entry: WaitingListEntry }> {
    return this.request(`/v1/waiting-list/${id}/status`, { method: "PATCH", body: { status } });
  }

  users = {
    list: (): Promise<{ users: TenantUser[] }> => this.request("/v1/users"),
    create: (input: {
      email: string;
      full_name: string;
      password: string;
      role: string;
    }): Promise<{ membership_id: string; user_id: string; email: string; role: string; is_active: boolean }> =>
      this.request("/v1/users", { method: "POST", body: input }),
    update: (
      membershipId: string,
      input: { role?: string; is_active?: boolean },
    ): Promise<{ membership_id: string; role: string; is_active: boolean }> =>
      this.request(`/v1/users/${membershipId}`, { method: "PATCH", body: input }),
  };

  billing = {
    subscription: (): Promise<{ subscription: Subscription | null; entitlements: Entitlements }> =>
      this.request("/v1/billing/subscription"),
    invoices: (): Promise<{ invoices: StripeInvoice[] }> =>
      this.request("/v1/billing/invoices"),
    checkout: (planKey: string): Promise<{ url: string }> =>
      this.request("/v1/billing/checkout", { method: "POST", body: { plan_key: planKey } }),
    confirmCheckout: (sessionId: string): Promise<{ subscription: Subscription | null; entitlements: Entitlements }> =>
      this.request("/v1/billing/confirm-checkout", { method: "POST", body: { session_id: sessionId } }),
    cancel: (immediately = false): Promise<{ subscription: Subscription | null; entitlements: Entitlements }> =>
      this.request("/v1/billing/cancel", { method: "POST", body: { immediately } }),
    resume: (): Promise<{ subscription: Subscription | null; entitlements: Entitlements }> =>
      this.request("/v1/billing/resume", { method: "POST", body: {} }),
    portal: (): Promise<{ url: string }> =>
      this.request("/v1/billing/portal", { method: "POST", body: {} }),
  };

  clinic = {
    cancel: (confirmSubdomain: string): Promise<{ status: string }> =>
      this.request("/v1/clinic/cancel", { method: "POST", body: { confirm_subdomain: confirmSubdomain } }),
  };

  fiscal = {
    getCapabilities: async (countryCode?: string): Promise<FiscalCapabilitiesResponse> => {
      const q = countryCode ? `?country_code=${encodeURIComponent(countryCode)}` : "";
      return this.request<FiscalCapabilitiesResponse>(`/v1/tenant/fiscal-capabilities${q}`);
    },
    getPublicCapabilities: async (countryCode?: string): Promise<FiscalCapabilitiesResponse> => {
      const q = countryCode ? `?country_code=${encodeURIComponent(countryCode)}` : "";
      return this.request<FiscalCapabilitiesResponse>(`/v1/public/fiscal-capabilities${q}`);
    },
    listConfigs: async (): Promise<RegionalFiscalConfig[]> => {
      const res = await this.request<{ data: RegionalFiscalConfig[] }>("/v1/public/fiscal-configs");
      return res.data;
    },
    joinWaitlist: async (featureKey = "fiscal.electronic_invoicing", notes = ""): Promise<FiscalCapabilitiesResponse> => {
      return this.request<FiscalCapabilitiesResponse>("/v1/tenant/fiscal-capabilities/waitlist", {
        method: "POST",
        body: { feature_key: featureKey, notes },
      });
    },
  };

  admin = {
    listTenants: (): Promise<{ tenants: TenantSummary[] }> =>
      this.request("/v1/admin/tenants"),
    setTenantStatus: (tenantId: string, status: string): Promise<{ status: string }> =>
      this.request(`/v1/admin/tenants/${tenantId}/status`, { method: "POST", body: { status } }),
    listFeatures: (): Promise<{ features: Feature[] }> =>
      this.request("/v1/admin/features"),
    getTenantFeatures: (
      tenantId: string,
    ): Promise<{ features: Feature[]; effective: FeatureMap; overrides: Array<{ FeatureKey: string; Enabled: boolean; ExpiresAt?: string }> }> =>
      this.request(`/v1/admin/tenants/${tenantId}/features`),
    setTenantFeature: (
      tenantId: string,
      featureKey: string,
      enabled: boolean,
      expiresAt?: string,
    ): Promise<unknown> =>
      this.request(`/v1/admin/tenants/${tenantId}/features`, {
        method: "PUT",
        body: { feature_key: featureKey, enabled, expires_at: expiresAt },
      }),
    getTenantDomains: (tenantId: string): Promise<{ domains: TenantDomain[] }> =>
      this.request(`/v1/admin/tenants/${tenantId}/domains`),
    provisionTenant: (tenantId: string): Promise<{ status: string }> =>
      this.request(`/v1/admin/tenants/${tenantId}/provision`, { method: "POST", body: {} }),
    listPlans: (): Promise<{ plans: Plan[] }> => this.request("/v1/admin/plans"),
    updatePlan: (
      key: string,
      input: { price_monthly_cents: number; stripe_price_id: string; is_active: boolean },
    ): Promise<unknown> =>
      this.request(`/v1/admin/plans/${key}`, { method: "PUT", body: input }),
    listLeads: (params: { status?: LeadStatus; limit?: number } = {}): Promise<{ leads: Lead[] }> => {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.limit) query.set("limit", String(params.limit));
      const suffix = query.toString() ? `?${query}` : "";
      return this.request(`/v1/admin/leads${suffix}`);
    },
    updateLeadStatus: (id: string, status: LeadStatus): Promise<{ lead: Lead }> =>
      this.request(`/v1/admin/leads/${id}`, { method: "PATCH", body: { status } }),
  };
}

export function hasFeature(me: MeResponse | null, feature: string): boolean {
  return Boolean(me?.features?.[feature]);
}

export function can(me: MeResponse | null, permission: string): boolean {
  if (!me) return false;
  return me.permissions.includes("*") || me.permissions.includes(permission);
}
