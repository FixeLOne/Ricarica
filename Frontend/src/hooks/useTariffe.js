import { useCallback, useEffect, useState } from "react";
import { getTariffe, creaTariffa, modificaTariffa, eliminaTariffa } from "@/api/tariffaApi";

export default function useTariffe() {
  const [tariffe,  setTariffe]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(null);

  const carica = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const { data } = await getTariffe();
      setTariffe(data);
    } catch {
      setApiError("Errore nel caricamento delle tariffe.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  const handleCrea = async (formData) => {
    try {
      const { data } = await creaTariffa(toBody(formData));
      setTariffe(prev => {
        // upsert: sostituisce se stesso operatore+giga già esiste
        const idx = prev.findIndex(t => t.id === data.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data;
          return next;
        }
        return [...prev, data];
      });
      return null;
    } catch (err) {
      return err?.response?.data?.errore ?? "Errore nel salvataggio.";
    }
  };

  const handleModifica = async (id, formData) => {
    try {
      const { data } = await modificaTariffa(id, toBody(formData));
      setTariffe(prev => prev.map(t => t.id === id ? data : t));
      return null;
    } catch (err) {
      return err?.response?.data?.errore ?? "Errore nella modifica.";
    }
  };

  const handleElimina = async (id) => {
    try {
      await eliminaTariffa(id);
      setTariffe(prev => prev.filter(t => t.id !== id));
      return null;
    } catch (err) {
      return err?.response?.data?.errore ?? "Errore nell'eliminazione.";
    }
  };

  return { tariffe, loading, apiError, handleCrea, handleModifica, handleElimina };
}

function toBody(f) {
  return {
    operatore:      f.operatore === "DEFAULT" ? null : f.operatore,
    giga:           parseFloat(f.giga),
    costoAcquisto:  parseFloat(f.costoAcquisto),
    prezzoVendita:  parseFloat(f.prezzoVendita),
  };
}
