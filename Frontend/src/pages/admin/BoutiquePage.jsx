import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CirclePlay,
  Plus,
  RefreshCw,
  Store,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import BoutiqueAccountModal from "./BoutiqueAccountModal";
import { BoutiqueCard, EmptyState, LoadingGrid } from "./BoutiqueCard";
import BoutiqueFilterBar from "./BoutiqueFilterBar";
import BoutiqueFormModal from "./BoutiqueFormModal";
import ConfermaStatoDialog from "./ConfermaStatoDialog";
import {
  getFiltroLabel,
  getServizioFiltroLabel,
  SERVIZI_BOUTIQUE,
} from "./boutiqueHelpers";
import { useBoutiques } from "./useBoutiques";

const FILTRI_INIZIALI = {
  query: "",
  stato: "tutte",
  ricariche: "tutte",
  fatture: "tutte",
  citta: "tutte",
};

export default function BoutiquePage() {
  const { utente } = useAuth();
  const isSuperAdmin = utente?.ruolo === "SUPER_ADMIN";
  const canCreate = utente?.ruolo === "ADMIN";
  const canManageAccount = utente?.ruolo === "ADMIN";

  const {
    boutiques,
    loading,
    apiError,
    togglingKey,
    loadBoutiques,
    salvaBoutique,
    toggleServizio,
    cambiaStato,
  } = useBoutiques({ isSuperAdmin });

  const [filtri, setFiltri] = useState(FILTRI_INIZIALI);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [statoBoutique, setStatoBoutique] = useState(null);
  const [statoSubmitting, setStatoSubmitting] = useState(false);
  const [accountBoutique, setAccountBoutique] = useState(null);

  const updateFiltri = (patch) => setFiltri((current) => ({ ...current, ...patch }));
  const resetFiltri = () => setFiltri((current) => ({ ...FILTRI_INIZIALI, query: current.query }));

  const stats = useMemo(() => {
    const attive = boutiques.filter((boutique) => boutique.attiva).length;
    const serviziAttivi = boutiques.reduce((totale, boutique) => (
        totale + SERVIZI_BOUTIQUE.filter((item) => boutique[item.field]).length
    ), 0);
    const serviziTotali = boutiques.length * SERVIZI_BOUTIQUE.length;

    return {
      totale: boutiques.length,
      attive,
      disattivate: boutiques.length - attive,
      serviziAttivi,
      serviziSpenti: serviziTotali - serviziAttivi,
    };
  }, [boutiques]);

  const cittaOptions = useMemo(() => {
    const citta = boutiques
        .map((boutique) => boutique.citta)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    return Array.from(new Set(citta));
  }, [boutiques]);

  // Valore derivato: se la citta selezionata non esiste piu tra le opzioni
  // (es. boutique eliminata), il filtro ricade su "tutte" senza setState in effect.
  const cittaFiltroAttivo =
    filtri.citta !== "tutte" && cittaOptions.includes(filtri.citta) ? filtri.citta : "tutte";

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filtri.stato !== "tutte") {
      chips.push({
        id: "stato",
        label: getFiltroLabel(filtri.stato),
        onRemove: () => updateFiltri({ stato: "tutte" }),
      });
    }
    if (filtri.ricariche !== "tutte") {
      chips.push({
        id: "ricariche",
        label: getServizioFiltroLabel("Ricariche", filtri.ricariche),
        onRemove: () => updateFiltri({ ricariche: "tutte" }),
      });
    }
    if (filtri.fatture !== "tutte") {
      chips.push({
        id: "fatture",
        label: getServizioFiltroLabel("Fatture", filtri.fatture),
        onRemove: () => updateFiltri({ fatture: "tutte" }),
      });
    }
    if (cittaFiltroAttivo !== "tutte") {
      chips.push({
        id: "citta",
        label: cittaFiltroAttivo,
        onRemove: () => updateFiltri({ citta: "tutte" }),
      });
    }
    return chips;
  }, [cittaFiltroAttivo, filtri.fatture, filtri.ricariche, filtri.stato]);

  const filteredBoutiques = useMemo(() => {
    const value = filtri.query.trim().toLowerCase();
    return boutiques.filter((boutique) => {
      if (value && !boutique.nome?.toLowerCase().includes(value) && !boutique.citta?.toLowerCase().includes(value)) return false;
      if (cittaFiltroAttivo !== "tutte" && boutique.citta !== cittaFiltroAttivo) return false;
      if (filtri.stato === "attive" && !boutique.attiva) return false;
      if (filtri.stato === "disattivate" && boutique.attiva) return false;
      if (filtri.ricariche === "attive" && !boutique.ricaricheAbilitate) return false;
      if (filtri.ricariche === "spente" && boutique.ricaricheAbilitate) return false;
      if (filtri.fatture === "attive" && !boutique.fattureAbilitate) return false;
      if (filtri.fatture === "spente" && boutique.fattureAbilitate) return false;
      return true;
    });
  }, [boutiques, cittaFiltroAttivo, filtri]);

  const openCreate = () => {
    setSelectedBoutique(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEdit = (boutique) => {
    setSelectedBoutique(boutique);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSelectedBoutique(null);
    setModalError(null);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    setModalError(null);
    const errore = await salvaBoutique(selectedBoutique, values);
    setSubmitting(false);
    if (errore) {
      setModalError(errore);
    } else {
      closeModal();
    }
  };

  const handleConfermaStato = async () => {
    if (!statoBoutique) return;
    setStatoSubmitting(true);
    const ok = await cambiaStato(statoBoutique);
    setStatoSubmitting(false);
    if (ok) setStatoBoutique(null);
  };

  return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_4px_var(--brand-soft)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-text)]">
                Punti vendita
              </p>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">Boutique</h1>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
                Gestisci le boutique, l'accesso dipendente e i servizi abilitati per ogni punto vendita.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
                type="button"
                variant="outline"
                onClick={loadBoutiques}
                className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
            {canCreate && (
                <Button onClick={openCreate} className="brand-primary h-9 rounded-xl font-semibold">
                  <Plus className="h-4 w-4" />
                  Nuova boutique
                </Button>
            )}
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Totale</p>
              <Store className="h-4 w-4 text-[var(--brand-text)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-950 dark:text-stone-50">{stats.totale}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">boutique registrate</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">Operative</p>
              <CirclePlay className="h-4 w-4 text-[var(--brand-text)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-950 dark:text-stone-50">{stats.attive}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">abilitate alle operazioni</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Disattivate</p>
              <Building2 className="h-4 w-4 text-stone-400 dark:text-stone-500" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-950 dark:text-stone-50">{stats.disattivate}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">fuori dai nuovi flussi</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Servizi attivi</p>
              <Zap className="h-4 w-4 text-[var(--brand-text)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-950 dark:text-stone-50">{stats.serviziAttivi}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{stats.serviziSpenti} servizi spenti</p>
          </div>
        </section>

        <BoutiqueFilterBar
            filtri={{ ...filtri, citta: cittaFiltroAttivo }}
            onChange={updateFiltri}
            onReset={resetFiltri}
            chips={activeFilterChips}
            cittaOptions={cittaOptions}
            countLabel={`${filteredBoutiques.length} di ${boutiques.length} boutique`}
        />

        {apiError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
        )}

        {loading ? (
            <LoadingGrid />
        ) : boutiques.length === 0 ? (
            <EmptyState canCreate={canCreate} onCreate={openCreate} />
        ) : filteredBoutiques.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Nessun risultato</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Prova con un nome o una città diversa.</p>
            </div>
        ) : (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredBoutiques.map((boutique) => (
                  <BoutiqueCard
                      key={boutique.id}
                      boutique={boutique}
                      canManageAccount={canManageAccount}
                      onEdit={openEdit}
                      onManageAccount={setAccountBoutique}
                      onToggleServizio={toggleServizio}
                      onRequestStato={setStatoBoutique}
                      togglingKey={togglingKey}
                  />
              ))}
            </div>
        )}

        <BoutiqueFormModal
            open={modalOpen}
            boutique={selectedBoutique}
            onClose={closeModal}
            onSave={handleSave}
            isSubmitting={submitting}
            serverError={modalError}
        />

        <BoutiqueAccountModal
            open={Boolean(accountBoutique)}
            boutique={accountBoutique}
            onClose={() => setAccountBoutique(null)}
        />

        <ConfermaStatoDialog
            boutique={statoBoutique}
            submitting={statoSubmitting}
            onClose={() => setStatoBoutique(null)}
            onConfirm={handleConfermaStato}
        />
      </div>
  );
}
