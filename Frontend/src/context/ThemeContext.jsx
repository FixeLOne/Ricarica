import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const BRAND_PALETTES = [
  { id: "honey", label: "Miele", swatch: "#e5ad45" },
  { id: "sage", label: "Salvia", swatch: "#7fb796" },
  { id: "petrol", label: "Petrolio", swatch: "#78aabb" },
  { id: "copper", label: "Rame", swatch: "#d58b6f" },
];

function getSavedBrand() {
  const saved = localStorage.getItem("brand-palette");
  if (saved === "clay") return "copper";
  return BRAND_PALETTES.some((palette) => palette.id === saved) ? saved : "honey";
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("theme") ?? "light"
  );
  const [brandName, setBrandNameState] = useState(getSavedBrand);

  useEffect(() => {
    const root = document.documentElement;
    if (themeName === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", themeName);
  }, [themeName]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = brandName;
    localStorage.setItem("brand-palette", brandName);
  }, [brandName]);

  const toggleTheme = () =>
    setThemeName((prev) => (prev === "light" ? "dark" : "light"));

  const setBrandName = (nextBrand) => {
    if (BRAND_PALETTES.some((palette) => palette.id === nextBrand)) {
      setBrandNameState(nextBrand);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        toggleTheme,
        brandName,
        setBrandName,
        brandPalettes: BRAND_PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
