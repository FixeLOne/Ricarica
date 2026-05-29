import axios from "axios";

// In produzione cambia solo questa variabile d'ambiente nel file .env
// VITE_API_URL=https://tuo-server.com/api/v2
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v2",
});

let redirectingToLogin = false;

function decodeJwtPayload(token) {
  const payload = token?.split(".")?.[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
}

function isTokenScaduto(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function isLoginRequest(config) {
  return config?.url?.includes("/auth/login");
}

function terminaSessioneScaduta() {
  if (redirectingToLogin) return;

  redirectingToLogin = true;
  localStorage.removeItem("token");
  localStorage.removeItem("utente");
  localStorage.removeItem("boutique-nome");
  sessionStorage.setItem("sessione-scaduta", "1");
  window.location.replace("/login");
}

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    if (isTokenScaduto(token)) {
      terminaSessioneScaduta();
      return Promise.reject(new axios.CanceledError("Sessione scaduta"));
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem("token");
    const utenteSalvato = localStorage.getItem("utente");
    const sessioneNonValida =
      status === 401 ||
      (status === 403 && ((!token && utenteSalvato) || (token && isTokenScaduto(token))));

    if (sessioneNonValida && !isLoginRequest(error.config)) {
      terminaSessioneScaduta();
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
