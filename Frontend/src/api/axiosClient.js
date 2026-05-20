import axios from "axios";

// In produzione cambia solo questa variabile d'ambiente nel file .env
// VITE_API_URL=https://tuo-server.com/api/v2
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v2",
});

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
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("utente");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
