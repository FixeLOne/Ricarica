import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getRicariche, creaRicarica, modificaRicarica,
  eliminaRicarica, getStatsOggi,
} from "@/api/ricaricheApi";
import { getTariffe }                      from "@/api/tariffaApi";
import { getBoutique, getTutteLeBoutique } from "@/api/boutiqueApi";

export const MANUALE_VALUE = "MANUALE";
export const BOUTIQUE_KEY  = "ricariche-boutique-id";
export const VISTA_BOUTIQUE_KEY = "ricariche-vista-boutique-id";

function normalizeBoutique(boutique) {
  return {
    ...boutique,
    attiva: boutique.attiva !== false,
  };
}

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
  const [stats,        setStats]        = useState(null);
  const [tariffe,      setTariffe]      = useState([]);
  const [boutiques,    setBoutiques]    = useState([]);
  const [boutiqueName, setBoutiqueName] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState(null);
  const [flashId,      setFlashId]      = useState(null);
  const [editedIds,    setEditedIds]    = useState(new Set());
  const [submitting,   setSubmitting]   = useState(false);
  const [submitMod,    setSubmitMod]    = useState(false);
  const [formKey,      setFormKey]      = useState(0);
  const [vistaBoutiqueId, setVistaBoutiqueId] = useState(
    () => localStorage.getItem(VISTA_BOUTIQUE_KEY) ?? localStorage.getItem(BOUTIQUE_KEY) ?? ""
  );

  useEffect(() => {
    if (!apiError) return;
    const t = setTimeout(() => setApiError(null), 4000);
    return () => clearTimeout(t);
  }, [apiError]);

  const caricaRicariche = useCallback(async (p = 0) => {
    const bid = isAdmin
      ? (vistaBoutiqueId ? Number(vistaBoutiqueId) : null)
      : null;
    try {
      const { data } = await getRicariche(p, 11, bid);
      setRicariche(data.content);
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setPage(data.page?.number ?? data.number ?? p);
    } catch {
      setApiError("Errore nel caricamento delle ricariche.");
    }
  }, [isAdmin, vistaBoutiqueId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const savedVistaBoutiqueId = localStorage.getItem(VISTA_BOUTIQUE_KEY) ?? localStorage.getItem(BOUTIQUE_KEY) ?? "";
        const bid = isAdmin
          ? (savedVistaBoutiqueId ? Number(savedVistaBoutiqueId) : null)
          : null;
        const [tarP, rigP, stP, bouP] = await Promise.allSettled([
          getTariffe(),
          getRicariche(0, 11, bid),
          getStatsOggi(bid),
          isAdmin
            ? (ruolo === "SUPER_ADMIN" ? getTutteLeBoutique() : getBoutique())
            : Promise.resolve(null),
        ]);
        if (tarP.status === "fulfilled") setTariffe(tarP.value.data);
        if (rigP.status === "fulfilled") {
          setRicariche(rigP.value.data.content);
          setTotalPages(rigP.value.data.page?.totalPages ?? rigP.value.data.totalPages ?? 0);
        }
        if (stP.status === "fulfilled") {
          setStats(stP.value.data);
          setCountN(stP.value.data.countOggi);
        }
        if (bouP.status === "fulfilled" && bouP.value?.data) {
          const lista = Array.isArray(bouP.value.data) ? bouP.value.data.map(normalizeBoutique) : [];
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
  }, [isAdmin, ruolo, setAuthBoutiqueName, utente?.boutiqueId]);

  const handleVistaBoutiqueChange = useCallback(async (boutiqueId) => {
    localStorage.setItem(VISTA_BOUTIQUE_KEY, boutiqueId ?? "");
    setVistaBoutiqueId(boutiqueId ?? "");
    const bid = boutiqueId ? Number(boutiqueId) : null;
    try {
      const [rigP, stP] = await Promise.allSettled([
        getRicariche(0, 11, bid),
        getStatsOggi(bid),
      ]);
      if (rigP.status === "fulfilled") {
        setRicariche(rigP.value.data.content);
        setTotalPages(rigP.value.data.page?.totalPages ?? rigP.value.data.totalPages ?? 0);
        setPage(0);
      }
      if (stP.status === "fulfilled") {
        setStats(stP.value.data);
        setCountN(stP.value.data.countOggi);
      }
    } catch {
      setApiError("Errore nel caricamento.");
    }
  }, []);

  const handleCrea = async (formData) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const body = buildBody(formData, tariffe, ruolo, utente?.boutiqueId);
      const { data } = await creaRicarica(body);
      setFlashId(data.id);
      setFormKey(k => k + 1);
      const bid = isAdmin ? (vistaBoutiqueId ? Number(vistaBoutiqueId) : null) : null;
      const [, stRes] = await Promise.allSettled([caricaRicariche(0), getStatsOggi(bid)]);
      if (stRes.status === "fulfilled") { setStats(stRes.value.data); setCountN(stRes.value.data.countOggi); }
      setTimeout(() => setFlashId(null), 1500);
    } catch (err) {
      setApiError(err?.response?.data?.errore ?? "Errore nel salvataggio.");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshStats = useCallback(async () => {
    const bid = isAdmin ? (vistaBoutiqueId ? Number(vistaBoutiqueId) : null) : null;
    const res = await getStatsOggi(bid).catch(() => null);
    if (res) { setStats(res.data); setCountN(res.data.countOggi); }
  }, [isAdmin, vistaBoutiqueId]);

  const handleModifica = async (formData, rigaId) => {
    setSubmitMod(true);
    try {
      const body = buildBody(formData, tariffe, ruolo, utente?.boutiqueId);
      const { data } = await modificaRicarica(rigaId, body);
      setRicariche(prev => prev.map(r => r.id === data.id ? data : r));
      setEditedIds(prev => new Set([...prev, data.id]));
      await refreshStats();
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
      await Promise.allSettled([caricaRicariche(page), refreshStats()]);
    } catch (err) {
      setApiError(err?.response?.data?.errore ?? "Errore nell'eliminazione.");
    }
  };

  return {
    ruolo, isAdmin, utente,
    ricariche, totalPages, page,
    countN, stats, tariffe, boutiques, boutiqueName, vistaBoutiqueId,
    loading, apiError, setApiError,
    flashId, editedIds,
    submitting, submitMod, formKey,
    caricaRicariche, handleCrea, handleModifica, handleElimina, handleVistaBoutiqueChange,
  };
}
