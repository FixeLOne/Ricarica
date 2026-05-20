import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const THEMES = {
  dark: {
    name: "dark",
    bg: "#08080a",
    bgCard: "#0d0d11",
    bgInput: "#141419",
    border: "#1f1f29",
    borderFocus: "#fde047", // Giallo limone/pastello chiaro e morbido
    text: "#f4f4f5",
    textMuted: "#71717a",   // Più leggibile
    textSub: "#a1a1aa",
    accent: "#fde047",
    accentHover: "#fef08a",
    glow: "rgba(254, 240, 138, 0.04)", // Glow giallo pastello ultra-morbido
    shadow: "rgba(0,0,0,0.6)",
    toggle: "#18181b",
    errorBg: "rgba(239, 68, 68, 0.06)",
    errorBorder: "rgba(239, 68, 68, 0.2)",
  },
  light: {
    name: "light",
    bg: "#faf9f5",
    bgCard: "#ffffff",
    bgInput: "#f5f4f0",
    border: "#e4e2db",
    borderFocus: "#eab308", // Giallo leggermente più saturo per il light mode
    text: "#09090b",
    textMuted: "#71717a",   // Accessibile
    textSub: "#52525b",
    accent: "#eab308",
    accentHover: "#ca8a04",
    glow: "rgba(234, 179, 8, 0.06)",
    shadow: "rgba(28, 25, 23, 0.05)",
    toggle: "#f1f0ea",
    errorBg: "#fef2f2",
    errorBorder: "#fca5a5",
  },
  midnight: {
    name: "midnight",
    bg: "#05070f",
    bgCard: "#0b0e1a",
    bgInput: "#111428",
    border: "#1e2238",
    borderFocus: "#fde047",
    text: "#f1f3f9",
    textMuted: "#4b526d",
    textSub: "#7882a4",
    accent: "#fde047",
    accentHover: "#fef08a",
    glow: "rgba(254, 240, 138, 0.04)",
    shadow: "rgba(0,0,0,0.7)",
    toggle: "#141830",
    errorBg: "rgba(239, 68, 68, 0.06)",
    errorBorder: "rgba(239, 68, 68, 0.2)",
  },
};

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
      <style>{`
        /* Unificato su Plus Jakarta Sans: pulito, geometrico e moderno */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pulseAccent {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .lp-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${t.bg};
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 24px;
          transition: background 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        /* Spostato l'interruttore fuori dalla card, in alto a destra dello schermo */
        .lp-theme-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: ${t.bgCard};
          border: 1px solid ${t.border};
          border-radius: 99px;
          padding: 8px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: ${t.textSub};
          letter-spacing: 0.02em;
          box-shadow: 0 4px 12px ${t.shadow};
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 10;
        }
        .lp-theme-btn:hover {
          border-color: ${t.borderFocus};
          color: ${t.text};
        }
        .lp-theme-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${t.accent};
        }

        /* Gli orb ora sono più grandi e fluidi per simulare una luce soffusa naturale */
        .lp-orb {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, ${t.glow} 0%, transparent 70%);
          top: -200px;
          right: -150px;
          pointer-events: none;
          animation: pulseAccent 10s ease-in-out infinite;
          transition: background 0.4s ease;
        }
        .lp-orb2 {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, ${t.glow} 0%, transparent 70%);
          bottom: -150px;
          left: -100px;
          pointer-events: none;
          animation: pulseAccent 12s ease-in-out infinite reverse;
          transition: background 0.4s ease;
        }

        .lp-card {
          width: 100%;
          max-width: 390px;
          background: ${t.bgCard};
          border: 1px solid ${t.border};
          border-radius: 16px;
          padding: 44px 36px;
          box-shadow: 0 40px 80px -20px ${t.shadow};
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }

        .lp-mark {
          width: 36px;
          height: 36px;
          border: 1px solid ${t.border};
          background: ${t.bgInput};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          transition: all 0.4s ease;
        }

        .lp-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: ${t.text};
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 6px;
          transition: color 0.4s ease;
        }
        .lp-sub {
          font-size: 0.85rem;
          font-weight: 400;
          color: ${t.textSub};
          margin-bottom: 32px;
          transition: color 0.4s ease;
        }

        .lp-field { margin-bottom: 18px; }

        .lp-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: ${t.textMuted};
          letter-spacing: 0.02em;
          margin-bottom: 8px;
          transition: color 0.4s ease;
        }

        .lp-input {
          width: 100%;
          padding: 11px 14px;
          background: ${t.bgInput};
          border: 1px solid ${t.border};
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          color: ${t.text};
          outline: none;
          transition: all 0.15s ease;
        }
        .lp-input::placeholder { color: ${t.textMuted}; opacity: 0.6; }
        .lp-input:focus {
          border-color: ${t.borderFocus};
          box-sizing: border-box;
        }

        /* Scatola di errore rivista in stile SaaS minimale */
        .lp-error {
          font-size: 0.8rem;
          color: #ef4444;
          background: ${t.errorBg};
          border: 1px solid ${t.errorBorder};
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
          animation: fadeUp 0.3s ease;
        }

        .lp-btn {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: ${t.accent};
          color: #0d0d11; /* Testo scuro sul pulsante chiaro */
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .lp-btn:hover:not(:disabled) {
          background: ${t.accentHover};
          transform: translateY(-1px);
        }
        .lp-btn:disabled {
          background: ${t.border};
          color: ${t.textMuted};
          cursor: not-allowed;
        }

        .lp-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(13,13,17,0.2);
          border-top-color: #0d0d11;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .lp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 0;
        }
        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: ${t.border};
        }
        .lp-divider-text {
          font-size: 0.68rem;
          font-weight: 500;
          color: ${t.textMuted};
          letter-spacing: 0.04em;
        }
      `}</style>

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