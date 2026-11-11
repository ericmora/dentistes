import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "@dentistes/ui";
import { useSession } from "./lib/session";
import { Layout } from "./ui/Layout";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { DashboardPage } from "./pages/Dashboard";
import { PatientsPage } from "./pages/Patients";
import { BillingPage } from "./pages/Billing";
import { UsersPage } from "./pages/Users";

export function App() {
  const { me, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={me ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={me ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route
          path="/*"
          element={
            me ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/users" element={<UsersPage />} />
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
