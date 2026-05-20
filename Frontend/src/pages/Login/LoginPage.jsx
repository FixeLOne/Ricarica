import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./LoginPage.css";

// Colori degli orb per ogni tema — separati dal ThemeContext
// per non inquinare il sistema di design con valori di sfondo specifici
const ORB_COLORS = {
  dark:     { orbColor1: "rgba(254,240,138,0.07)", orbColor2: "rgba(254,240,138,0.04)" },
  light:    { orbColor1: "rgba(234,179,8,0.10)",   orbColor2: "rgba(234,179,8,0.06)"  },
  midnight: { orbColor1: "rgba(254,240,138,0.06)", orbColor2: "rgba(100,120,255,0.05)" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { themeName, currentTheme, cycleTheme } = useTheme();

  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [errore, setErrore]       = useState("");
  const [caricamento, setCaricamento] = useState(false);

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

  // Tutte le CSS variables del tema + colori orb → unico oggetto style
  const cssVars = {
    "--bg":           currentTheme.bg,
    "--bgCard":       currentTheme.bgCard,
    "--bgInput":      currentTheme.bgInput,
    "--border":       currentTheme.border,
    "--borderFocus":  currentTheme.borderFocus,
    "--text":         currentTheme.text,
    "--textMuted":    currentTheme.textMuted,
    "--textSub":      currentTheme.textSub,
    "--accent":       currentTheme.accent,
    "--accentHover":  currentTheme.accentHover,
    "--glow":         currentTheme.glow,
    "--shadow":       currentTheme.shadow,
    "--errorBg":      currentTheme.errorBg,
    "--errorBorder":  currentTheme.errorBorder,
    "--orbColor1":    ORB_COLORS[themeName]?.orbColor1 ?? ORB_COLORS.dark.orbColor1,
    "--orbColor2":    ORB_COLORS[themeName]?.orbColor2 ?? ORB_COLORS.dark.orbColor2,
  };

  return (
      <div className="lp-page" style={cssVars}>

        {/* Sfondo dinamico */}
        <div className="lp-orb-1" />
        <div className="lp-orb-2" />

        {/* Theme switcher */}
        <button className="lp-theme-btn" onClick={cycleTheme} type="button">
          <span className="lp-theme-dot" />
          {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
        </button>

        <div className="lp-card">
          <div className="lp-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="var(--accent)" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="var(--textMuted)" opacity="0.3" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="var(--textMuted)" opacity="0.3" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="var(--accent)" />
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
  );
}