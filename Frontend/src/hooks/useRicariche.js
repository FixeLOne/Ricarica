import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getRicariche, creaRicarica, modificaRicarica,
  eliminaRicarica, countOggi,
} from "@/api/ricaricheApi";
import { getTariffe }                      from "@/api/tariffaApi";
import { getBoutique, getTutteLeBoutique } from "@/api/boutiqueApi";

export const MANUALE_VALUE = "MANUALE";
export const BOUTIQUE_KEY  = "ricariche-boutique-id";

export function buildBody(data, tariffe, ruolo, boutiqueIdJwt) {
  const isManuale = data.gigaValore === MANUALE_VALUE;
  const body = {
    numero:  data.numero,
    giga:    isManuale ? parseFloat(data.gigaManuale) : parseFloat(data.gigaValore),
    manuale: isManuale,
    note:    data.note?.trim() || undefined,
  };
  if (isManuale) {
    body.costoEffettivo = parseFloat(data.costoEffettivo);
    body.costoCliente   = parseFloat(data.costoCliente);
  }
  body.boutiqueId = ruolo !== "DIPENDENTE"
    ? (data.boutiqueId ? Number(data.boutiqueId) : undefined)
    : (boutiqueIdJwt ?? undefined);
  return body;
}

export default function useRicariche() {
  const { utente, setBoutiqueName: setAuthBoutiqueName } = useAuth();
  const ruolo   = utente?.ruolo ?? "DIPENDENTE";
  const isAdmin = ruolo !== "DIPENDENTE";

  const [ricariche,    setRicariche]    = useState([]);
  const [totalPages,   setTotalPages]   = useState(0);
  const [page,         setPage]         = useState(0);
  const [countN,       setCountN]       = useState(null);
  const [tariffe,      setTariffe]      = useState([]);
  const [boutiques,    setBoutiques]    = useState([]);
  const [boutiqueName, setBoutiqueName] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState(null);
  const [flashId,      setFlashId]      = useState(null);
  const [editedIds,    setEditedIds]    = useState(new Set());
  const [deletedIds,   setDeletedIds]   = useState(new Set());
  const [submitting,   setSubmitting]   = useState(false);
  const [submitMod,    setSubmitMod]    = useState(false);
  const [formKey,      setFormKey]      = useState(0);

  useEffect(() => {
    if (!apiError) return;
    const t = setTimeout(() => setApiError(null), 4000);
    return () => clearTimeout(t);
  }, [apiError]);

  const caricaRicariche = useCallback(async (p = 0) => {
    try {
      const { data } = await getRicariche(p);
      setRicariche(data.content);
      // Spring Boot 4 annida i metadati sotto data.page, Boot 3 li mette in radice
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setPage(data.page?.number ?? data.number ?? p);
    } catch {
      setApiError("Errore nel caricamento delle ricariche.");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [tarP, rigP, cntP, bouP] = await Promise.allSettled([
          getTariffe(),
          getRicariche(0),
          countOggi(),
          isAdmin
            ? (ruolo === "SUPER_ADMIN" ? getTutteLeBoutique() : getBoutique())
            : Promise.resolve(null),
        ]);
        if (tarP.status === "fulfilled") setTariffe(tarP.value.data);
        if (rigP.status === "fulfilled") {
          setRicariche(rigP.value.data.content);
          setTotalPages(rigP.value.data.page?.totalPages ?? rigP.value.data.totalPages ?? 0);
        }
        if (cntP.status === "fulfilled") setCountN(cntP.value.data);
        if (bouP.status === "fulfilled" && bouP.value?.data) {
          const lista = Array.isArray(bouP.value.data) ? bouP.value.data : [];
          setBoutiques(lista);
          if (!isAdmin && utente?.boutiqueId) {
            const found = lista.find(b => b.id === utente.boutiqueId);
            if (found) { setBoutiqueName(found.nome); setAuthBoutiqueName(found.nome); }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isAdmin, ruolo]);

  const handleCrea = async (formData) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const body = buildBody(formData, tariffe, ruolo, utente?.boutiqueId);
      const { data } = await creaRicarica(body);
      setFlashId(data.id);
      setCountN(n => (n ?? 0) + 1);
      setFormKey(k => k + 1);
      await caricaRicariche(0);
      setTimeout(() => setFlashId(null), 1500);
    } catch (err) {
      setApiError(err?.response?.data?.errore ?? "Errore nel salvataggio.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModifica = async (formData, rigaId) => {
    setSubmitMod(true);
    try {
      const body = buildBody(formData, tariffe, ruolo, utente?.boutiqueId);
      const { data } = await modificaRicarica(rigaId, body);
      setRicariche(prev => prev.map(r => r.id === data.id ? data : r));
      setEditedIds(prev => new Set([...prev, data.id]));
      return true;
    } catch (err) {
      setApiError(err?.response?.data?.errore ?? "Errore nella modifica.");
      return false;
    } finally {
      setSubmitMod(false);
    }
  };

  const handleElimina = async (rigaId) => {
    try {
      await eliminaRicarica(rigaId);
      setDeletedIds(prev => new Set([...prev, rigaId]));
      setCountN(n => Math.max(0, (n ?? 1) - 1));
    } catch (err) {
      setApiError(err?.response?.data?.errore ?? "Errore nell'eliminazione.");
    }
  };

  return {
    ruolo, isAdmin, utente,
    ricariche, totalPages, page,
    countN, tariffe, boutiques, boutiqueName,
    loading, apiError, setApiError,
    flashId, editedIds, deletedIds,
    submitting, submitMod, formKey,
    caricaRicariche, handleCrea, handleModifica, handleElimina,
  };
}
