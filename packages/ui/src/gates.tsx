import type { ReactNode } from "react";
import { can, hasFeature, type MeResponse } from "@dentistes/sdk";

export function FeatureGate({
  me,
  feature,
  children,
  fallback,
}: {
  me: MeResponse | null;
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!hasFeature(me, feature)) {
    return <>{fallback ?? <LockedFeature feature={feature} reason={me?.entitlements.blocked_reason} />}</>;
  }
  return <>{children}</>;
}

export function PermissionGate({
  me,
  permission,
  children,
  fallback = null,
}: {
  me: MeResponse | null;
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!can(me, permission)) return <>{fallback}</>;
  return <>{children}</>;
}

export function RoleGuard({
  me,
  roles,
  permission,
  children,
  fallback = null,
}: {
  me: MeResponse | null;
  roles?: string[];
  permission?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!me) return <>{fallback}</>;
  if (roles && roles.length > 0 && !roles.includes(me.role)) {
    return <>{fallback}</>;
  }
  if (permission && !can(me, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

export function LockedFeature({ feature, reason }: { feature: string; reason?: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Función no disponible: {feature}</p>
      <p className="mt-1">
        {reason === "subscription_inactive"
          ? "La suscripción no está activa. Regulariza el pago para desbloquear esta funcionalidad."
          : "Esta funcionalidad no está incluida en el plan actual."}
      </p>
    </div>
  );
}
