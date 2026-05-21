import { createContext, useContext, useState } from "react";

/**
 * Palette ispirata a: Linear, Vercel, Raycast, Basement Studio
 * Famiglia cromatica: Indigo / Violet / Slate
 * — toni morbidi, contrasti bilanciati, pronto per componenti UX complessi —
 */
export const THEMES = {

    /* ─── DARK ──────────────────────────────────────────────────────────
       Slate profondo con accenti indigo brillanti.
       Sfondo quasi-nero caldo, card con leggerissima tinta viola.        */
    dark: {
        name: "dark",

        bg:        "#0d0d12",   // near-black con lieve tinta viola
        bgCard:    "#13131a",   // card leggermente più chiara
        bgInput:   "#1a1a24",   // input: un gradino in più

        border:      "#252535", // bordi quasi invisibili, solo struttura
        borderFocus: "#818cf8", // indigo-400 — focus vivace e riconoscibile

        text:      "#eeeef5",   // bianco freddo molto morbido
        textMuted: "#52526b",   // grigio-viola per placeholder/label
        textSub:   "#8888a8",   // testi secondari, meta, caption

        accent:      "#818cf8", // indigo-400 — CTA, link, highlights
        accentHover: "#a5b4fc", // indigo-300 — hover più luminoso

        glow:   "rgba(129, 140, 248, 0.10)", // halo sui focus ring
        shadow: "rgba(0, 0, 0, 0.55)",

        toggle:      "#1c1c28",
        errorBg:     "rgba(248, 113, 113, 0.06)",
        errorBorder: "rgba(248, 113, 113, 0.22)",
    },

    /* ─── LIGHT ─────────────────────────────────────────────────────────
       Bianco luminoso ma non abbagliante, sfondo leggermente lavanda.
       Accento indigo scuro, ombre quasi assenti.                         */
    light: {
        name: "light",

        bg:        "#f5f5fa",   // lavanda ghiaccio — meno stridente del bianco puro
        bgCard:    "#ffffff",   // card bianche, pop sul bg
        bgInput:   "#eeeef5",   // input incassati, leggibile la distinzione

        border:      "#dddde8", // bordi softissimi
        borderFocus: "#6366f1", // indigo-500 — focus ben visibile in chiaro

        text:      "#16161f",   // quasi-nero caldo, mai puro black
        textMuted: "#6b6b80",   // grigio medio-scuro per muted
        textSub:   "#44445a",   // sub-label, breadcrumb, caption

        accent:      "#6366f1", // indigo-500 — più saturo in light per leggibilità
        accentHover: "#4f46e5", // indigo-600 — hover più deciso

        glow:   "rgba(99, 102, 241, 0.08)",
        shadow: "rgba(99, 102, 241, 0.05)", // ombra leggermente tintata, non piatta

        toggle:      "#e8e8f2",
        errorBg:     "#fff5f5",
        errorBorder: "#fecaca",
    },

    /* ─── MIDNIGHT ───────────────────────────────────────────────────────
       Blu notte profondissimo — spazio cosmico, accento violet più caldo.
       Perfetto per modalità "focus" / editor-style.                      */
    midnight: {
        name: "midnight",

        bg:        "#060611",   // blu-notte quasi puro
        bgCard:    "#0b0b1c",   // card appena distinguibili
        bgInput:   "#10102a",   // input con tinta blu più intensa

        border:      "#1c1c38", // bordi appena percepibili
        borderFocus: "#a78bfa", // violet-400 — si distingue meglio dall'indigo sul blu notte

        text:      "#ecebf8",   // bianco leggermente viola-freddo
        textMuted: "#3d3d60",   // viola scuro per placeholder
        textSub:   "#7070a0",   // grigio-viola per meta

        accent:      "#a78bfa", // violet-400 — accent più caldo rispetto all'indigo puro
        accentHover: "#c4b5fd", // violet-300 — hover luminoso

        glow:   "rgba(167, 139, 250, 0.10)",
        shadow: "rgba(0, 0, 0, 0.70)",

        toggle:      "#0f0f28",
        errorBg:     "rgba(248, 113, 113, 0.06)",
        errorBorder: "rgba(248, 113, 113, 0.22)",
    },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [themeName, setThemeName] = useState("dark");
    const themeKeys = Object.keys(THEMES);

    const cycleTheme = () => {
        const idx = themeKeys.indexOf(themeName);
        setThemeName(themeKeys[(idx + 1) % themeKeys.length]);
    };

    const currentTheme = THEMES[themeName];

    return (
        <ThemeContext.Provider value={{ themeName, currentTheme, cycleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);