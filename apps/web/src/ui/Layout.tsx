import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  LayoutDashboard,
  Settings,
  Users,
  Building2,
  Plus,
  ChevronDown,
  LogOut,
  CreditCard,
} from "lucide-react";
import { Badge, BrandLogo, Button, DropdownMenu, cn } from "@dentistes/ui";
import { can } from "@dentistes/sdk";
import { useSession } from "../lib/session";

function getRoleLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "Director / Titular";
    case "ADMIN":
      return "Administrador";
    case "DENTIST":
      return "Odontólogo";
    case "HYGIENIST":
      return "Higienista";
    case "RECEPTIONIST":
      return "Recepción";
    default:
      return role;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Layout({ children }: { children: ReactNode }) {
  const { me, logout } = useSession();
  const navigate = useNavigate();

  if (!me) return null;

  const isClinicAdmin =
    me.role === "OWNER" ||
    me.role === "ADMIN" ||
    can(me, "users:manage") ||
    can(me, "billing:manage");

  const navItems = [
    { to: "/", label: "Resumen", icon: LayoutDashboard },
    { to: "/agenda", label: "Agenda", icon: Calendar },
    { to: "/patients", label: "Pacientes", icon: Users },
    { to: "/waiting-list", label: "Lista de espera", icon: Clock },
    ...(isClinicAdmin ? [{ to: "/settings", label: "Administración", icon: Settings }] : []),
  ];

  const roleLabel = getRoleLabel(me.role);
  const initials = getInitials(me.user.full_name);

  const userMenuItems = [
    {
      id: "clinic",
      label: `Clínica: ${me.active_tenant.name}`,
      disabled: true,
      onSelect: () => {},
    },
    ...(isClinicAdmin
      ? [
          {
            id: "settings",
            label: "Administración de la clínica",
            onSelect: () => navigate("/settings"),
          },
        ]
      : []),
    {
      id: "billing",
      label: "Facturación y suscripción",
      onSelect: () => navigate("/billing"),
    },
    {
      id: "logout",
      label: "Cerrar sesión",
      danger: true,
      onSelect: () => void logout(),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased selection:bg-brand-100 selection:text-brand-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Brand logo & Clinic Pill */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
              title="Dentistes — Inicio"
            >
              <BrandLogo size="md" />
            </Link>

            <div className="hidden h-5 w-px bg-slate-200 md:block" />

            <div className="hidden items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs md:flex">
              <Building2 className="h-3.5 w-3.5 text-brand-700 shrink-0" />
              <span className="max-w-[140px] truncate font-semibold text-slate-800">
                {me.active_tenant.name}
              </span>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Center: Desktop Segmented Pill Dock Navigation */}
          <nav className="hidden items-center rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 md:flex shadow-2xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-white text-brand-950 font-semibold shadow-xs ring-1 ring-slate-900/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Quick Action & User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/agenda">
              <Button size="sm" className="hidden sm:inline-flex items-center gap-1.5 shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Nueva cita</span>
              </Button>
            </Link>

            {me.entitlements.blocked_reason ? (
              <Badge tone="danger">Pago pendiente</Badge>
            ) : null}

            {/* User Profile Pill Menu */}
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  aria-label="Menú de usuario"
                  className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white p-1 pl-1 pr-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#0F3F34] to-teal-600 text-[11px] font-bold text-white shadow-xs">
                    {initials}
                  </span>
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-xs font-semibold leading-tight text-slate-800">
                      {me.user.full_name}
                    </p>
                    <p className="text-[10px] font-medium leading-tight text-brand-700">
                      {roleLabel}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              }
              items={userMenuItems}
            />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 md:pb-12">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navegación inferior"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-3 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-brand-700 font-semibold"
                    : "text-slate-500 hover:text-slate-800",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
