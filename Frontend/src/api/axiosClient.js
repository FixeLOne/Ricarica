import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api/v2",
});

// Aggiunge automaticamente il token JWT a ogni richiesta
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se il backend risponde 401 (token scaduto), fa logout automatico
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
