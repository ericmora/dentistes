import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Badge, Button, cn } from "@dentistes/ui";
import { can } from "@dentistes/sdk";
import { useSession } from "../lib/session";

const baseLinks = [
  { to: "/", label: "Resumen" },
  { to: "/agenda", label: "Agenda" },
  { to: "/patients", label: "Pacientes" },
  { to: "/waiting-list", label: "Espera" },
  { to: "/design-system", label: "UI / DS" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { me, logout } = useSession();
  if (!me) return null;
  const isClinicAdmin = me.role === "OWNER" || me.role === "ADMIN" || can(me, "users:manage") || can(me, "billing:manage");
  const links = isClinicAdmin ? [...baseLinks, { to: "/settings", label: "Administración" }] : baseLinks;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-semibold tracking-tight text-brand-700">Dentistes</p>
              <p className="text-xs text-slate-500">{me.active_tenant.name}</p>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium",
                      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{me.user.full_name}</p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <Badge tone="info">{me.role}</Badge>
                {me.entitlements.blocked_reason ? <Badge tone="danger">Pago pendiente</Badge> : null}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Salir
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 border-t border-slate-100 px-4 py-2 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex-1 rounded-md px-3 py-2 text-center text-sm font-medium",
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
