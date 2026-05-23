import { createContext, useContext, useState } from "react";

export const THEMES = {
  light: {
    name: "light",
    bg:            "#e8eaf3",          // sfondo lavanda chiaro
    bgCard:        "#eef0f8",          // card leggermente più chiara
    bgInput:       "#e2e4ef",
    border:        "transparent",      // soft UI: niente bordi
    text:          "#1e1f3b",
    textSub:       "#7b7d9e",
    accent:        "#6366f1",
    accentLight:   "rgba(99,102,241,0.12)",
    // ombre neumorfiche light
    shadowCard:    "8px 8px 20px rgba(163,177,210,0.55), -5px -5px 14px rgba(255,255,255,0.85)",
    shadowInset:   "inset 4px 4px 10px rgba(163,177,210,0.45), inset -3px -3px 8px rgba(255,255,255,0.8)",
    shadowSm:      "4px 4px 10px rgba(163,177,210,0.45), -3px -3px 8px rgba(255,255,255,0.8)",
    shadowAccent:  "0 6px 20px rgba(99,102,241,0.32)",
  },
  dark: {
    name: "dark",
    bg:            "#13142a",          // navy scuro
    bgCard:        "#1a1c35",          // card navy
    bgInput:       "#20223e",
    border:        "transparent",
    text:          "#e8eaf6",
    textSub:       "#5e6194",
    accent:        "#818cf8",
    accentLight:   "rgba(129,140,248,0.14)",
    // ombre neumorfiche dark
    shadowCard:    "6px 6px 16px rgba(0,0,0,0.5), -3px -3px 10px rgba(255,255,255,0.04)",
    shadowInset:   "inset 4px 4px 10px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.04)",
    shadowSm:      "3px 3px 10px rgba(0,0,0,0.45), -2px -2px 6px rgba(255,255,255,0.03)",
    shadowAccent:  "0 6px 22px rgba(129,140,248,0.3)",
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState("light");

  const toggleTheme = () =>
    setThemeName((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ themeName, currentTheme: THEMES[themeName], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
