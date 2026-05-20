import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);
    try {
      await login(username, password);
      navigate("/dashboard"); // redirect dopo login
    } catch (err) {
      setErrore(
        err.response?.status === 401
          ? "Username o password errati."
          : "Errore di connessione al server."
      );
    } finally {
      setCaricamento(false);
    }
  };

  return (
    <div style={styles.pagina}>
      <div style={styles.card}>
        <h2 style={styles.titolo}>Accedi al Gestionale</h2>

        {errore && <div style={styles.errore}>{errore}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.campo}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Inserisci username"
              required
              minLength={3}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci password"
              required
              minLength={8}
            />
          </div>

          <button style={styles.bottone} type="submit" disabled={caricamento}>
            {caricamento ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pagina: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    width: "100%",
    maxWidth: "400px",
  },
  titolo: {
    marginBottom: "1.5rem",
    fontSize: "1.4rem",
    fontWeight: 600,
    textAlign: "center",
    color: "#1a1a2e",
  },
  campo: { marginBottom: "1rem" },
  label: {
    display: "block",
    marginBottom: "0.4rem",
    fontSize: "0.9rem",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "0.7rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    boxSizing: "border-box",
    outline: "none",
  },
  bottone: {
    width: "100%",
    padding: "0.8rem",
    marginTop: "0.5rem",
    background: "#534AB7",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    fontWeight: 500,
  },
  errore: {
    background: "#fff0f0",
    color: "#c0392b",
    padding: "0.7rem 1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    border: "1px solid #f5c6cb",
  },
};
