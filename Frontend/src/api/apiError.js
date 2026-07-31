// Estrae il messaggio di errore dalle risposte del backend
// (il GlobalExceptionHandler risponde sempre { errore: "..." }).
export function getApiError(error) {
  return (
    error?.response?.data?.errore ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === "string" ? error.response.data : null) ||
    "Operazione non riuscita"
  );
}
