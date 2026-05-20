import axiosClient from "./axiosClient";

// Corrisponde a POST /api/v2/auth/login nel tuo AuthController
// Manda { username, password } — riceve { token, username, ruolo, boutiqueId }
export const login = (username, password) =>
  axiosClient.post("/auth/login", { username, password });
