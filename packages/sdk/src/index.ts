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
  plan_key?: string;
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

export interface DentistesClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  mode?: "browser" | "native";
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
}

export class DentistesClient {
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly mode: "browser" | "native";
  private readonly getAccessToken?: () => string | null;
  private readonly onAccessToken?: (token: string | null) => void;
  private readonly getRefreshToken?: () => string | null;
  private readonly onRefreshToken?: (token: string | null) => void;
  private accessToken: string | null = null;

  constructor(options: DentistesClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.mode = options.mode ?? "browser";
    this.getAccessToken = options.getAccessToken;
    this.onAccessToken = options.onAccessToken;
    this.getRefreshToken = options.getRefreshToken;
    this.onRefreshToken = options.onRefreshToken;
  }

  private token(): string | null {
    return this.getAccessToken?.() ?? this.accessToken;
  }

  private setToken(token: string | null): void {
    this.accessToken = token;
    this.onAccessToken?.(token);
  }

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const token = this.token();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
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
    return this.token();
  }

  async login(email: string, password: string, opts: { tenantId?: string; subdomain?: string } = {}): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/v1/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password, tenant_id: opts.tenantId, subdomain: opts.subdomain },
    });
    this.setToken(res.access_token);
    if (res.refresh_token) this.onRefreshToken?.(res.refresh_token);
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
    this.setToken(res.access_token);
    if (res.refresh_token) this.onRefreshToken?.(res.refresh_token);
    return res;
  }

  async onboarding(input: OnboardingInput): Promise<OnboardingResponse> {
    const res = await this.request<OnboardingResponse>("/v1/public/onboarding", {
      method: "POST",
      auth: false,
      body: input,
    });
    this.setToken(res.access_token);
    if (res.refresh_token) this.onRefreshToken?.(res.refresh_token);
    return res;
  }

  async refreshSession(): Promise<AuthResponse | null> {
    const refreshToken = this.getRefreshToken?.() ?? null;
    if (this.mode === "native" && !refreshToken) return null;
    try {
      const res = await this.request<AuthResponse>("/v1/auth/refresh", {
        method: "POST",
        auth: false,
        body: this.mode === "native" ? { refresh_token: refreshToken } : {},
      });
      this.setToken(res.access_token);
      if (res.refresh_token) this.onRefreshToken?.(res.refresh_token);
      return res;
    } catch {
      this.setToken(null);
      return null;
    }
  }

  async refresh(): Promise<boolean> {
    return (await this.refreshSession()) !== null;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken?.() ?? null;
    await this.request<void>("/v1/auth/logout", {
      method: "POST",
      auth: false,
      body: this.mode === "native" && refreshToken ? { refresh_token: refreshToken } : {},
    }).catch(() => undefined);
    this.setToken(null);
    this.onRefreshToken?.(null);
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
    checkout: (planKey: string): Promise<{ url: string }> =>
      this.request("/v1/billing/checkout", { method: "POST", body: { plan_key: planKey } }),
    confirmCheckout: (sessionId: string): Promise<{ subscription: Subscription | null; entitlements: Entitlements }> =>
      this.request("/v1/billing/confirm-checkout", { method: "POST", body: { session_id: sessionId } }),
    portal: (): Promise<{ url: string }> =>
      this.request("/v1/billing/portal", { method: "POST", body: {} }),
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
