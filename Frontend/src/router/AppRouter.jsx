import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/Login/LoginPage";

// Dashboard per ruolo
import DashboardDipendente from "@/pages/dipendente/DashboardDipendente";
import DashboardAdmin from "@/pages/admin/DashboardAdmin";
import DashboardSuperAdmin from "@/pages/superadmin/DashboardSuperAdmin";

// Pagine comuni
import RicarichePage from "@/pages/ricariche/RicarichePage";
import FattureListPage from "@/pages/fatture/FattureListPage";
import FatturaEditorPage from "@/pages/fatture/FatturaEditorPage";

// Pagine ADMIN + SUPER_ADMIN
import TariffePage from "@/pages/admin/TariffePage";
import BoutiquePage from "@/pages/admin/BoutiquePage";
import ExportPage from "@/pages/admin/ExportPage";

// Pagine ADMIN only
import AziendaPage from "@/pages/admin/AziendaPage";

// Pagine SUPER_ADMIN only
import AdminListPage from "@/pages/superadmin/AdminListPage";
import BoutiqueTuttePage from "@/pages/superadmin/BoutiqueTuttePage";

/** Componente ponte: smista /dashboard al componente corretto per ruolo */
function DashboardRouter() {
  const { utente } = useAuth();
  if (utente?.ruolo === "SUPER_ADMIN") return <DashboardSuperAdmin />;
  if (utente?.ruolo === "ADMIN") return <DashboardAdmin />;
  return <DashboardDipendente />;
}

/** Rotta ospite: se già loggato → /dashboard */
function GuestRoute({ children }) {
  const { utente } = useAuth();
  return !utente ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Redirect radice */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login — solo per non autenticati */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* Tutte le rotte protette condividono AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>

          {/* Accessibili a tutti i ruoli */}
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/ricariche" element={<RicarichePage />} />
          <Route path="/fatture" element={<FattureListPage />} />
          <Route path="/fatture/nuova" element={<FatturaEditorPage />} />
          <Route path="/fatture/:id" element={<FatturaEditorPage />} />

          {/* ADMIN + SUPER_ADMIN */}
          <Route element={<ProtectedRoute ruoli={["ADMIN", "SUPER_ADMIN"]} />}>
            <Route path="/tariffe" element={<TariffePage />} />
            <Route path="/boutique" element={<BoutiquePage />} />
            <Route path="/export" element={<ExportPage />} />
          </Route>

          {/* ADMIN only */}
          <Route element={<ProtectedRoute ruoli={["ADMIN"]} />}>
            <Route path="/azienda" element={<AziendaPage />} />
          </Route>

          {/* SUPER_ADMIN only */}
          <Route element={<ProtectedRoute ruoli={["SUPER_ADMIN"]} />}>
            <Route path="/admin-list" element={<AdminListPage />} />
            <Route path="/boutique/tutte" element={<BoutiqueTuttePage />} />
          </Route>

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
