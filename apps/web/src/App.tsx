import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "@dentistes/ui";
import { useSession } from "./lib/session";
import { Layout } from "./ui/Layout";
import { LoginPage } from "./pages/Login";
import { OnboardingPage } from "./pages/Onboarding";
import { OnboardingCompletePage } from "./pages/OnboardingComplete";
import { DashboardPage } from "./pages/Dashboard";
import { AgendaPage } from "./pages/Agenda";
import { WaitingListPage } from "./pages/WaitingList";
import { PatientsPage } from "./pages/Patients";
import { PatientDetailPage } from "./pages/PatientDetail";
import { BillingPage } from "./pages/Billing";
import { UsersPage } from "./pages/Users";
import { ClinicAdminPage } from "./pages/ClinicAdmin";
import { DesignSystemPage } from "./pages/DesignSystem";

export function App() {
  const { me, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const needsStripe = Boolean(me && me.billing?.status === "INCOMPLETE");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={me ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/signup"
          element={me && !needsStripe ? <Navigate to="/" replace /> : <OnboardingPage />}
        />
        <Route
          path="/onboarding"
          element={me && !needsStripe ? <Navigate to="/" replace /> : <OnboardingPage />}
        />
        <Route
          path="/onboarding/complete"
          element={me ? <OnboardingCompletePage /> : <Navigate to="/login" replace />}
        />
        <Route path="/design-system" element={<DesignSystemPage />} />
        <Route
          path="/*"
          element={
            me ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/agenda" element={<AgendaPage />} />
                  <Route path="/waiting-list" element={<WaitingListPage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/patients/:id" element={<PatientDetailPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/settings" element={<ClinicAdminPage />} />
                  <Route path="/design-system" element={<DesignSystemPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
