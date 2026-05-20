import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const [theme, setTheme] = useState("dark");

  const t = THEMES[theme];
  const themeKeys = Object.keys(THEMES);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setErrore(
        err.response?.status === 401
          ? "Credenziali non valide. Riprova."
          : "Errore di connessione al server."
      );
    } finally {
      setCaricamento(false);
    }
  };

  const cycleTheme = () => {
    const idx = themeKeys.indexOf(theme);
    setTheme(themeKeys[(idx + 1) % themeKeys.length]);
  };

  return (
    <>
      <div className="lp-page">
        <div className="lp-orb" />
        <div className="lp-orb2" />

        {/* Bottone del tema portato all'esterno per alleggerire la login card */}
        <button className="lp-theme-btn" onClick={cycleTheme} type="button">
          <span className="lp-theme-dot" />
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </button>

        <div className="lp-card">
          <div className="lp-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill={t.accent} />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill={t.textMuted} opacity="0.3" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill={t.textMuted} opacity="0.3" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill={t.accent} />
            </svg>
          </div>

          <h1 className="lp-title">Accedi</h1>
          <p className="lp-sub">Gestionale — area riservata</p>

          {errore && <div className="lp-error">{errore}</div>}

          <form onSubmit={handleSubmit}>
            <div className="lp-field">
              <label className="lp-label">Username</label>
              <input
                className="lp-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nome@azienda.com"
                required
                autoComplete="username"
              />
            </div>

            <div className="lp-field">
              <label className="lp-label">Password</label>
              <input
                className="lp-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button className="lp-btn" type="submit" disabled={caricamento}>
              {caricamento && <span className="lp-spinner" />}
              {caricamento ? "Accesso..." : "Accedi al sistema"}
            </button>
          </form>

          <div className="lp-divider">
            <span className="lp-divider-line" />
            <span className="lp-divider-text">v1.0</span>
            <span className="lp-divider-line" />
          </div>
        </div>
      </div>
    </>
  );
}