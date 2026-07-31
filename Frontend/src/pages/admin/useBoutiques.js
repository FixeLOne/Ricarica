import { useCallback, useEffect, useState } from "react";

import { getApiError } from "@/api/apiError";
import {
  creaBoutique,
  getBoutique,
  getTutteLeBoutique,
  modificaBoutique,
  modificaServizioBoutique,
  modificaStatoBoutique,
} from "@/api/boutiqueApi";

import { getServiceToggleKey, normalizeBoutique } from "./boutiqueHelpers";

/**
 * Dati e mutazioni della pagina boutique: caricamento lista, salvataggio
 * (crea/modifica), toggle servizi con aggiornamento ottimistico e cambio
 * stato attiva/disattivata.
 */
export function useBoutiques({ isSuperAdmin }) {
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);

  const loadBoutiques = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = isSuperAdmin ? await getTutteLeBoutique() : await getBoutique();
      setBoutiques((response.data ?? []).map(normalizeBoutique));
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    void Promise.resolve().then(loadBoutiques);
  }, [loadBoutiques]);

  const aggiornaInLista = (updated) => {
    setBoutiques((current) => current.map((item) => (
      item.id === updated.id ? updated : item
    )));
  };

  /** Crea o modifica una boutique. Ritorna null se ok, il messaggio di errore altrimenti. */
  const salvaBoutique = async (boutiqueEsistente, values) => {
    try {
      if (boutiqueEsistente) {
        const response = await modificaBoutique(boutiqueEsistente.id, values);
        aggiornaInLista(normalizeBoutique(response.data));
      } else {
        await creaBoutique(values);
        await loadBoutiques();
      }
      return null;
    } catch (error) {
      return getApiError(error);
    }
  };

  /** Attiva/disattiva un servizio con aggiornamento ottimistico e rollback in caso di errore. */
  const toggleServizio = async (boutique, servizioConfig, checked) => {
    const previous = boutique[servizioConfig.field];
    const applica = (valore) => (item) => (
      item.id === boutique.id
        ? normalizeBoutique({
          ...item,
          [servizioConfig.field]: valore,
          servizi: {
            ...item.servizi,
            [servizioConfig.serviziKey]: valore,
          },
        })
        : item
    );

    setTogglingKey(getServiceToggleKey(boutique.id, servizioConfig.servizio));
    setApiError(null);
    setBoutiques((current) => current.map(applica(checked)));

    try {
      const response = await modificaServizioBoutique(boutique.id, servizioConfig.servizio, checked);
      aggiornaInLista(normalizeBoutique(response.data));
    } catch (error) {
      setBoutiques((current) => current.map(applica(previous)));
      setApiError(getApiError(error));
    } finally {
      setTogglingKey(null);
    }
  };

  /** Cambia lo stato attiva/disattivata. Ritorna true se ok (con rollback in caso di errore). */
  const cambiaStato = async (boutique) => {
    const nextAttiva = !boutique.attiva;
    const previous = boutique.attiva;
    setApiError(null);
    setBoutiques((current) => current.map((item) => (
      item.id === boutique.id ? { ...item, attiva: nextAttiva } : item
    )));

    try {
      const response = await modificaStatoBoutique(boutique.id, nextAttiva);
      aggiornaInLista(normalizeBoutique(response.data));
      return true;
    } catch (error) {
      setBoutiques((current) => current.map((item) => (
        item.id === boutique.id ? { ...item, attiva: previous } : item
      )));
      setApiError(getApiError(error));
      return false;
    }
  };

  return {
    boutiques,
    loading,
    apiError,
    togglingKey,
    loadBoutiques,
    salvaBoutique,
    toggleServizio,
    cambiaStato,
  };
}
