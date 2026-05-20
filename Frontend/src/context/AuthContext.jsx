import { createContext, useContext, useState } from "react";
import { login as apiLogin } from "../api/authApi";

const AuthContext = createContext(null);

// Legge l'utente dal localStorage in modo sicuro
// Se i dati sono corrotti non crasha l'app
function leggiUtenteSalvato() {
  try {
    const salvato = localStorage.getItem("utente");
    return salvato ? JSON.parse(salvato) : null;
  } catch {
    localStorage.removeItem("utente");
    localStorage.removeItem("token");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(leggiUtenteSalvato);

  const login = async (username, password) => {
    const { data } = await apiLogin(username, password);
    // IMPORTANTE: salviamo solo i dati non sensibili per la UI
    // Il ruolo e boutiqueId qui servono solo per mostrare info nell'interfaccia,
    // NON per decidere i permessi (quello lo fa sempre il backend via JWT)
    localStorage.setItem("token", data.token);
    localStorage.setItem("utente", JSON.stringify({
      username: data.username,
      ruolo: data.ruolo,
      boutiqueId: data.boutiqueId,
    }));
    setUtente({ username: data.username, ruolo: data.ruolo, boutiqueId: data.boutiqueId });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    setUtente(null);
  };

  // isAdmin controlla il ruolo solo per mostrare/nascondere UI,
  // NON per decidere accesso reale alle API (quello lo fa Spring Security)
  const isAdmin = utente?.ruolo === "ADMIN";

  return (
    <AuthContext.Provider value={{ utente, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
