import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Blocca l'accesso se l'utente non è autenticato.
 * Se `ruoli` è valorizzato, blocca anche chi non ha il ruolo corretto.
 */
export default function ProtectedRoute({ ruoli }) {
  const { utente } = useAuth();

  if (!utente) return <Navigate to="/login" replace />;

  if (ruoli && !ruoli.includes(utente.ruolo)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
