import { createContext, useContext, useState } from "react";
import { login as apiLogin } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Al refresh della pagina, ricarica l'utente dal localStorage
  const [utente, setUtente] = useState(() => {
    const salvato = localStorage.getItem("utente");
    return salvato ? JSON.parse(salvato) : null;
  });

  const login = async (username, password) => {
    const { data } = await apiLogin(username, password);
    // data = { token, username, ruolo, boutiqueId }
    localStorage.setItem("token", data.token);
    localStorage.setItem("utente", JSON.stringify(data));
    setUtente(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    setUtente(null);
  };

  return (
    <AuthContext.Provider value={{ utente, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usa così nei componenti:
// const { utente, login, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);
