import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // Aggiunto import
import LoginPage from "./pages/Login/LoginPage";

// Protegge le rotte interne: se NON loggato → redirect a /login
function RoutaProtetta({ children }) {
    const { utente } = useAuth();
    return utente ? children : <Navigate to="/login" replace />;
}

// Protegge la rotta di login: se GIÀ loggato → redirect a /dashboard
function RoutaOspite({ children }) {
    const { utente } = useAuth();
    return !utente ? children : <Navigate to="/dashboard" replace />;
}

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
                <ThemeProvider> {/* Aggiunto wrapper per evitare il crash di useTheme */}
                    <Routes>
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
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}