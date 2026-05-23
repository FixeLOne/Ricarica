import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/Login/LoginPage";
import Dashboard from "./pages/Dashboard/Dashboard";

/** Rotta protetta: se non loggato → /login */
function RoutaProtetta({ children }) {
  const { utente } = useAuth();
  return utente ? children : <Navigate to="/login" replace />;
}

/** Rotta ospite: se già loggato → /dashboard */
function RoutaOspite({ children }) {
  const { utente } = useAuth();
  return !utente ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Redirect radice direttamente al login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/login"
              element={
                <RoutaOspite>
                  <LoginPage />
                </RoutaOspite>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RoutaProtetta>
                  <Dashboard />
                </RoutaProtetta>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
