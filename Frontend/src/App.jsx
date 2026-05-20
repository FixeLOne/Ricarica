import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

// Componente che protegge le rotte: se non loggato → redirect a /login
function RoutaProtetta({ children }) {
  const { utente } = useAuth();
  return utente ? children : <Navigate to="/login" replace />;
}

// Placeholder dashboard — sostituiscila con la tua pagina vera
function Dashboard() {
  const { utente, logout } = useAuth();
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Benvenuto, {utente?.username}!</h2>
      <p>Ruolo: {utente?.ruolo}</p>
      <p>Boutique ID: {utente?.boutiqueId}</p>
      <button onClick={logout} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Logout
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <RoutaProtetta>
                <Dashboard />
              </RoutaProtetta>
            }
          />
          {/* Redirect di default → dashboard (o login se non autenticato) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
