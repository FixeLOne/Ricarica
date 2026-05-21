import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/Login/LoginPage";
import LandingPage from "./pages/LandingPage/LandingPage";
import Dashboard from "./pages/Dashboard/Dashboard";

// Protegge le rotte interne: se NON loggato → redirect a /login
function RoutaProtetta({ children }) {
    const { utente } = useAuth();
    return utente ? children : <Navigate to="/login" replace />;
}

// Protegge le rotte pubbliche (Landing/Login): se GIÀ loggato → redirect a /dashboard
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
                        {/* 1. Rotta Principale: Landing Page */}
                        <Route
                            path="/"
                            element={
                                <RoutaOspite>
                                    <LandingPage />
                                </RoutaOspite>
                            }
                        />

                        {/* 2. Rotta di Accesso: Login Page */}
                        <Route
                            path="/login"
                            element={
                                <RoutaOspite>
                                    <LoginPage />
                                </RoutaOspite>
                            }
                        />

                        {/* 3. Rotte Interne: Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                <RoutaProtetta>
                                    <Dashboard />
                                </RoutaProtetta>
                            }
                        />

                        {/* 4. Fallback: Se l'utente digita una URL inesistente, torna alla Home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}