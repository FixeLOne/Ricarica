import axios from "axios";

// In produzione cambia solo questa variabile d'ambiente nel file .env
// VITE_API_URL=https://tuo-server.com/api/v2
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v2",
});

// Guard: evita redirect multipli quando più richieste falliscono con 401 simultaneamente
let redirectingToLogin = false;

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se è 401 MA la chiamata NON era verso /auth/login, allora scollega l'utente
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
            if (!redirectingToLogin) {
                redirectingToLogin = true;
                localStorage.removeItem("token");
                localStorage.removeItem("utente");
                sessionStorage.setItem("sessione-scaduta", "1");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
