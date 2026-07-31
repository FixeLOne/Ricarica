import { useCallback, useEffect, useState } from "react";

import { getApiError } from "@/api/apiError";
import { getDatiAzienda } from "@/api/aziendaApi";
import { getBoutique, getTutteLeBoutique } from "@/api/boutiqueApi";
import {
  creaAvoir,
  eliminaFattura,
  emettiFattura,
  getFatture,
} from "@/api/fattureApi";

import { normalizeBoutique, PAGE_SIZE } from "./fattureListHelpers";

/**
 * Dati e azioni della lista fatture: caricamento paginato con debounce sui
 * filtri, boutique per il filtro, dati azienda per l'anteprima e le azioni
 * emetti / avoir / elimina.
 */
export function useFatture({ filters, ruolo, canFilterBoutique }) {
  const [fatture, setFatture] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [boutiques, setBoutiques] = useState([]);
  const [azienda, setAzienda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadFatture = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await getFatture(targetPage, PAGE_SIZE, filters);
      const data = response.data ?? {};
      // Spring Boot 4 annida i metadati di paginazione sotto "page"
      const pageMeta = data.page ?? data;
      setFatture(data.content ?? []);
      setPageInfo({
        number: pageMeta.number ?? targetPage,
        totalPages: pageMeta.totalPages ?? 0,
        totalElements: pageMeta.totalElements ?? 0,
      });
    } catch (error) {
      setApiError(getApiError(error));
      setFatture([]);
      setPageInfo({ number: 0, totalPages: 0, totalElements: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFatture(0);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [loadFatture]);

  useEffect(() => {
    let ignore = false;

    if (!canFilterBoutique) return undefined;

    const loadBoutiques = async () => {
      try {
        const response = ruolo === "SUPER_ADMIN" ? await getTutteLeBoutique() : await getBoutique();
        if (!ignore) {
          setBoutiques((response.data ?? []).map(normalizeBoutique));
        }
      } catch {
        if (!ignore) setBoutiques([]);
      }
    };

    void loadBoutiques();
    return () => {
      ignore = true;
    };
  }, [canFilterBoutique, ruolo]);

  useEffect(() => {
    let ignore = false;

    const loadAzienda = async () => {
      try {
        const response = await getDatiAzienda();
        if (!ignore) setAzienda(response.data ?? null);
      } catch {
        if (!ignore) setAzienda(null);
      }
    };

    void loadAzienda();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  /**
   * Esegue emetti / avoir / elimina e ricarica la pagina corrente.
   * Ritorna { ok, preview }: preview e la fattura da mostrare in anteprima
   * dopo l'azione (l'avoir appena creato, o la fattura emessa se
   * mantieniAnteprima e true), altrimenti null.
   */
  const eseguiAzione = async (type, fattura, { mantieniAnteprima = false } = {}) => {
    setWorkingId(fattura.id);
    setApiError(null);
    try {
      let preview = null;

      if (type === "emit") {
        const response = await emettiFattura(fattura.id);
        if (mantieniAnteprima) preview = response.data;
        setFeedback("Documento emesso correttamente.");
      }
      if (type === "avoir") {
        const response = await creaAvoir(fattura.id);
        preview = response.data;
        setFeedback("Avoir creato. La fattura originale e stata annullata.");
      }
      if (type === "delete") {
        await eliminaFattura(fattura.id);
        setFeedback("Bozza eliminata.");
      }
      await loadFatture(pageInfo.number);
      return { ok: true, preview };
    } catch (error) {
      setApiError(getApiError(error));
      return { ok: false, preview: null };
    } finally {
      setWorkingId(null);
    }
  };

  return {
    fatture,
    pageInfo,
    boutiques,
    azienda,
    loading,
    workingId,
    apiError,
    feedback,
    loadFatture,
    eseguiAzione,
  };
}
