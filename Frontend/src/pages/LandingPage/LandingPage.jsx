import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext"; // Adegua il percorso se serve
import "./LandingPage.css";
import logoImg from "../../components/logo.png";

export default function LandingPage() {
    const navigate = useNavigate();
    const { themeName, currentTheme, cycleTheme } = useTheme();

    const cssVars = {
        "--bg": currentTheme.bg,
        "--bgCard": currentTheme.bgCard,
        "--bgInput": currentTheme.bgInput,
        "--border": currentTheme.border,
        "--text": currentTheme.text,
        "--textMuted": currentTheme.textMuted,
        "--textSub": currentTheme.textSub,
        "--accent": currentTheme.accent,
        "--accentHover": currentTheme.accentHover,
        "--glow": currentTheme.glow,
    };

    return (
        <div className="landing-page" style={cssVars}>
            {/* Theme switcher anche sulla landing! */}
            <button className="lp-theme-btn" onClick={cycleTheme} style={{position: 'absolute', top: 24, right: 24, zIndex: 10}}>
                <span className="lp-theme-dot" />
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </button>

            <div className="lp-ambient" />

            <div className="logo-wrap">
                <div className="logo-mark-landing" style={{ background: "transparent", border: "none" }}>
                    <img
                        src={logoImg}
                        alt="Logo Gestionale"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                </div>
                <span className="logo-name">Gestionale</span>
            </div>

            <div className="actions">
                <button className="btn-login" onClick={() => navigate("/login")}>
                    Accedi al sistema
                </button>
                <button className="btn-info" onClick={() => navigate("/info")}>
                    Come funziona?
                </button>
            </div>

            <span className="version">v2.0 · © 2026</span>
        </div>
    );
}