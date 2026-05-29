import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CirclePause,
  CirclePlay,
  FileCheck2,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import {
  creaBoutique,
  getBoutique,
  getTutteLeBoutique,
  modificaBoutique,
  modificaServizioBoutique,
  modificaStatoBoutique,
} from "@/api/boutiqueApi";
import BoutiqueAccountModal from "./BoutiqueAccountModal";
import BoutiqueFormModal from "./BoutiqueFormModal";

const FILTRI_STATO = [
  { id: "tutte", label: "Tutte" },
  { id: "attive", label: "Attive" },
  { id: "disattivate", label: "Disattivate" },
];

const FILTRI_SERVIZIO = [
  { id: "tutte", label: "Tutte" },
  { id: "attive", label: "Attive" },
  { id: "spente", label: "Spente" },
];

const SERVIZI_BOUTIQUE = [
  {
    servizio: "RICARICHE",
    serviziKey: "ricariche",
    field: "ricaricheAbilitate",
    label: "Ricariche",
    onText: "Nuove ricariche abilitate",
    offText: "Nuove ricariche bloccate",
    icon: Zap,
  },
  {
    servizio: "FATTURE",
    serviziKey: "fatture",
    field: "fattureAbilitate",
    label: "Fatture",
    onText: "Editor e dati fattura attivi",
    offText: "Fatture disattivate",
    icon: FileCheck2,
  },
];

function getCitta(boutique) {
  return boutique?.citta ?? boutique?.["città"] ?? "";
}

function normalizeBoutique(boutique) {
  const servizi = boutique.servizi ?? {};
  const ricaricheAbilitate = servizi.ricariche ?? boutique.ricaricheAbilitate ?? true;
  const fattureAbilitate = servizi.fatture ?? boutique.fattureAbilitate ?? false;

  return {
    ...boutique,
    citta: getCitta(boutique),
    ricaricheAbilitate: Boolean(ricaricheAbilitate),
    fattureAbilitate: Boolean(fattureAbilitate),
    attiva: boutique.attiva !== false,
    servizi: {
      ricariche: Boolean(ricaricheAbilitate),
      fatture: Boolean(fattureAbilitate),
    },
  };
}

function getApiError(error) {
  return (
      error?.response?.data?.errore ||
      error?.response?.data?.message ||
      (typeof error?.response?.data === "string" ? error.response.data : null) ||
      "Operazione non riuscita"
  );
}

function getFiltroLabel(id) {
  return FILTRI_STATO.find((item) => item.id === id)?.label ?? "Filtro";
}

function getServizioFiltroLabel(servizio, value) {
  const option = FILTRI_SERVIZIO.find((item) => item.id === value);
  return `${servizio} ${option?.label?.toLowerCase() ?? value}`;
}

function EmptyState({ canCreate, onCreate }) {
  return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-soft)] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/60">
        <Store className="h-5 w-5" />
      </span>
        <h2 className="mt-4 text-base font-semibold text-stone-950 dark:text-stone-50">Nessuna boutique</h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          Crea il primo punto vendita e il relativo account dipendente in un unico passaggio.
        </p>
        {canCreate && (
            <Button onClick={onCreate} className="brand-primary mt-5 h-9 rounded-xl font-semibold">
              <Plus className="h-4 w-4" />
              Nuova boutique
            </Button>
        )}
      </div>
  );
}

function LoadingGrid() {
  return (
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
            <div
                key={index}
                className="h-52 animate-pulse rounded-2xl border border-stone-200 bg-white/75 dark:border-stone-800 dark:bg-stone-900/70"
            >
              <div className="h-full rounded-2xl bg-gradient-to-br from-stone-100 via-transparent to-[var(--brand-soft)] dark:from-stone-800/70 dark:to-[var(--brand-soft)]" />
            </div>
        ))}
      </div>
  );
}

function SegmentedFilter({ label, options, value, onChange }) {
  return (
      <div className="grid gap-2 sm:grid-cols-[78px_1fr] sm:items-center">
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">{label}</p>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-950/30">
          {options.map((item) => (
              <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={[
                    "h-8 rounded-full px-2 text-xs font-semibold transition-colors",
                    value === item.id
                        ? "bg-white text-[var(--brand-text)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-stone-900"
                        : "text-stone-500 hover:bg-white hover:text-[var(--brand-text)] dark:text-stone-400 dark:hover:bg-stone-900",
                  ].join(" ")}
              >
                {item.label}
              </button>
          ))}
        </div>
      </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
      <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 text-xs font-semibold text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft-strong)]"
      >
        {label}
        <X className="h-3 w-3" />
      </button>
  );
}

function getServiceToggleKey(boutiqueId, servizio) {
  return `${boutiqueId}:${servizio}`;
}

function ServizioRow({ boutique, item, onToggle, disabled }) {
  const checked = boutique[item.field];
  const Icon = item.icon;

  return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 dark:border-stone-800 dark:bg-stone-950/35">
        <div className="flex min-w-0 items-center gap-2.5">
        <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              checked
                  ? "bg-[var(--brand-soft)] text-[var(--brand-text)]"
                  : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
            ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{item.label}</p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">
              {checked ? item.onText : item.offText}
            </p>
          </div>
        </div>

        <Switch
            checked={checked}
            disabled={disabled}
            onCheckedChange={(value) => onToggle(boutique, item, value)}
            className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700"
            aria-label={`${item.label} ${boutique.nome}`}
        />
      </div>
  );
}

function BoutiqueCard({
  boutique,
  canManageAccount,
  onEdit,
  onManageAccount,
  onToggleServizio,
  onRequestStato,
  togglingKey,
}) {
  const attiva = boutique.attiva;

  return (
      <article className={[
        "group overflow-hidden rounded-2xl border bg-white shadow-[0_18px_48px_-42px_rgba(15,23,42,0.7)] transition-colors dark:bg-stone-900",
        attiva
            ? "border-stone-200 hover:border-[var(--brand-border)] dark:border-stone-800"
            : "border-stone-200/80 opacity-90 dark:border-stone-800/80",
      ].join(" ")}>
        <div className={[
          "relative border-b px-5 py-4",
          attiva
              ? "border-stone-100 bg-gradient-to-br from-white via-white to-[var(--brand-soft)] dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-[var(--brand-soft)]"
              : "border-stone-100 bg-stone-50/90 dark:border-stone-800 dark:bg-stone-900/70",
        ].join(" ")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
            <span className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm dark:bg-stone-950/50",
              attiva
                  ? "border-[var(--brand-border)] text-[var(--brand-text)]"
                  : "border-stone-200 text-stone-400 dark:border-stone-700 dark:text-stone-500",
            ].join(" ")}>
              {attiva ? <Store className="h-5 w-5" /> : <CirclePause className="h-5 w-5" />}
            </span>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                    {boutique.nome}
                  </h2>
                  <span className={[
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    attiva
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
                  ].join(" ")}>
                  {attiva ? "Attiva" : "Disattivata"}
                </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{boutique.citta || "Città non indicata"}</span>
                </p>
              </div>
            </div>

            <button
                type="button"
                onClick={() => onEdit(boutique)}
                className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-white/80 hover:text-[var(--brand-text)] dark:hover:bg-stone-800"
                aria-label={`Modifica ${boutique.nome}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!attiva && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-950/35 dark:text-stone-400">
                Non disponibile per nuove operazioni.
              </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 px-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                Servizi
              </p>
              <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
                {SERVIZI_BOUTIQUE.filter((item) => boutique[item.field]).length}/{SERVIZI_BOUTIQUE.length} attivi
              </p>
            </div>
            {SERVIZI_BOUTIQUE.map((item) => (
                <ServizioRow
                    key={item.servizio}
                    boutique={boutique}
                    item={item}
                    onToggle={onToggleServizio}
                    disabled={togglingKey === getServiceToggleKey(boutique.id, item.servizio)}
                />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-3 dark:border-stone-800 dark:bg-stone-950/25">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">ID</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-stone-800 dark:text-stone-200">#{boutique.id}</p>
            </div>
            <div className={[
              "rounded-xl border px-3 py-3",
              attiva
                  ? "border-[var(--brand-border)] bg-[var(--brand-soft)]"
                  : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/25",
            ].join(" ")}>
              <p className={[
                "text-[10px] font-semibold uppercase tracking-[0.16em]",
                attiva ? "text-[var(--brand-text)]" : "text-stone-400 dark:text-stone-500",
              ].join(" ")}>
                Stato
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-100">
                {attiva ? "Operativa" : "Sospesa"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
            {canManageAccount ? (
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onManageAccount(boutique)}
                  className="h-8 rounded-xl border-stone-200 px-3 text-xs font-semibold text-stone-600 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Account
              </Button>
            ) : (
              <span />
            )}
            <Button
                type="button"
                variant="outline"
                onClick={() => onRequestStato(boutique)}
                className={[
                  "h-8 rounded-xl px-3 text-xs font-semibold",
                  attiva
                      ? "border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                      : "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]",
                ].join(" ")}
            >
              {attiva ? <CirclePause className="h-3.5 w-3.5" /> : <CirclePlay className="h-3.5 w-3.5" />}
              {attiva ? "Disattiva" : "Riattiva"}
            </Button>
          </div>
        </div>
      </article>
  );
}

export default function BoutiquePage() {
  const { utente } = useAuth();
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [query, setQuery] = useState("");
  const [statoFiltro, setStatoFiltro] = useState("tutte");
  const [ricaricheFiltro, setRicaricheFiltro] = useState("tutte");
  const [fattureFiltro, setFattureFiltro] = useState("tutte");
  const [cittaFiltro, setCittaFiltro] = useState("tutte");
  const [filtriOpen, setFiltriOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const [statoBoutique, setStatoBoutique] = useState(null);
  const [statoSubmitting, setStatoSubmitting] = useState(false);
  const [accountBoutique, setAccountBoutique] = useState(null);
  const filtriRef = useRef(null);

  const isSuperAdmin = utente?.ruolo === "SUPER_ADMIN";
  const canCreate = utente?.ruolo === "ADMIN";
  const canManageAccount = utente?.ruolo === "ADMIN";

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

  useEffect(() => {
    if (!filtriOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!filtriRef.current?.contains(event.target)) {
        setFiltriOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFiltriOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtriOpen]);

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

  useEffect(() => {
    if (cittaFiltro !== "tutte" && !cittaOptions.includes(cittaFiltro)) {
      setCittaFiltro("tutte");
    }
  }, [cittaFiltro, cittaOptions]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (statoFiltro !== "tutte") {
      chips.push({
        id: "stato",
        label: getFiltroLabel(statoFiltro),
        onRemove: () => setStatoFiltro("tutte"),
      });
    }
    if (ricaricheFiltro !== "tutte") {
      chips.push({
        id: "ricariche",
        label: getServizioFiltroLabel("Ricariche", ricaricheFiltro),
        onRemove: () => setRicaricheFiltro("tutte"),
      });
    }
    if (fattureFiltro !== "tutte") {
      chips.push({
        id: "fatture",
        label: getServizioFiltroLabel("Fatture", fattureFiltro),
        onRemove: () => setFattureFiltro("tutte"),
      });
    }
    if (cittaFiltro !== "tutte") {
      chips.push({
        id: "citta",
        label: cittaFiltro,
        onRemove: () => setCittaFiltro("tutte"),
      });
    }
    return chips;
  }, [cittaFiltro, fattureFiltro, ricaricheFiltro, statoFiltro]);

  const resetFiltri = () => {
    setStatoFiltro("tutte");
    setRicaricheFiltro("tutte");
    setFattureFiltro("tutte");
    setCittaFiltro("tutte");
  };

  const filteredBoutiques = useMemo(() => {
    const value = query.trim().toLowerCase();
    return boutiques.filter((boutique) => {
      if (value && !boutique.nome?.toLowerCase().includes(value) && !boutique.citta?.toLowerCase().includes(value)) return false;
      if (cittaFiltro !== "tutte" && boutique.citta !== cittaFiltro) return false;
      if (statoFiltro === "attive" && !boutique.attiva) return false;
      if (statoFiltro === "disattivate" && boutique.attiva) return false;
      if (ricaricheFiltro === "attive" && !boutique.ricaricheAbilitate) return false;
      if (ricaricheFiltro === "spente" && boutique.ricaricheAbilitate) return false;
      if (fattureFiltro === "attive" && !boutique.fattureAbilitate) return false;
      if (fattureFiltro === "spente" && boutique.fattureAbilitate) return false;
      return true;
    });
  }, [boutiques, cittaFiltro, fattureFiltro, query, ricaricheFiltro, statoFiltro]);

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

  const openAccount = (boutique) => {
    setAccountBoutique(boutique);
  };

  const closeAccount = () => {
    setAccountBoutique(null);
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
    try {
      if (selectedBoutique) {
        const response = await modificaBoutique(selectedBoutique.id, values);
        const updated = normalizeBoutique(response.data);
        setBoutiques((current) => current.map((boutique) => (
            boutique.id === updated.id ? updated : boutique
        )));
      } else {
        await creaBoutique(values);
        await loadBoutiques();
      }
      closeModal();
    } catch (error) {
      setModalError(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleServizio = async (boutique, servizioConfig, checked) => {
    const previous = boutique[servizioConfig.field];
    const key = getServiceToggleKey(boutique.id, servizioConfig.servizio);
    setTogglingKey(key);
    setApiError(null);
    setBoutiques((current) => current.map((item) => (
        item.id === boutique.id
            ? normalizeBoutique({
              ...item,
              [servizioConfig.field]: checked,
              servizi: {
                ...item.servizi,
                [servizioConfig.serviziKey]: checked,
              },
            })
            : item
    )));

    try {
      const response = await modificaServizioBoutique(boutique.id, servizioConfig.servizio, checked);
      const updated = normalizeBoutique(response.data);
      setBoutiques((current) => current.map((item) => (
          item.id === updated.id ? updated : item
      )));
    } catch (error) {
      setBoutiques((current) => current.map((item) => (
          item.id === boutique.id
              ? normalizeBoutique({
                ...item,
                [servizioConfig.field]: previous,
                servizi: {
                  ...item.servizi,
                  [servizioConfig.serviziKey]: previous,
                },
              })
              : item
      )));
      setApiError(getApiError(error));
    } finally {
      setTogglingKey(null);
    }
  };

  const handleConfermaStato = async () => {
    if (!statoBoutique) return;

    const nextAttiva = !statoBoutique.attiva;
    const previous = statoBoutique.attiva;
    setStatoSubmitting(true);
    setApiError(null);
    setBoutiques((current) => current.map((item) => (
        item.id === statoBoutique.id ? { ...item, attiva: nextAttiva } : item
    )));

    try {
      const response = await modificaStatoBoutique(statoBoutique.id, nextAttiva);
      const updated = normalizeBoutique(response.data);
      setBoutiques((current) => current.map((item) => (
          item.id === updated.id ? updated : item
      )));
      setStatoBoutique(null);
    } catch (error) {
      setBoutiques((current) => current.map((item) => (
          item.id === statoBoutique.id ? { ...item, attiva: previous } : item
      )));
      setApiError(getApiError(error));
    } finally {
      setStatoSubmitting(false);
    }
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

        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cerca boutique o citta"
                    className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
                />
              </div>

              <div ref={filtriRef} className="relative w-full sm:w-auto">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFiltriOpen((open) => !open)}
                    aria-expanded={filtriOpen}
                    className={[
                      "h-10 w-full rounded-xl px-3 text-sm font-semibold shadow-none sm:w-auto",
                      activeFilterChips.length > 0
                          ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]"
                          : "border-stone-200 bg-stone-50 text-stone-600 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
                    ].join(" ")}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtri
                  {activeFilterChips.length > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[11px] font-bold text-white">
                    {activeFilterChips.length}
                  </span>
                  )}
                </Button>

                {filtriOpen && (
                    <div className="absolute left-0 top-12 z-40 max-h-[70vh] w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_24px_70px_-44px_rgba(120,84,32,0.45)] dark:border-stone-800 dark:bg-stone-900 sm:w-[390px]">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
                          Filtri boutique
                        </p>
                        {activeFilterChips.length > 0 && (
                            <button
                                type="button"
                                onClick={resetFiltri}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <SegmentedFilter
                            label="Stato"
                            options={FILTRI_STATO}
                            value={statoFiltro}
                            onChange={setStatoFiltro}
                        />
                        <SegmentedFilter
                            label="Ricariche"
                            options={FILTRI_SERVIZIO}
                            value={ricaricheFiltro}
                            onChange={setRicaricheFiltro}
                        />
                        <SegmentedFilter
                            label="Fatture"
                            options={FILTRI_SERVIZIO}
                            value={fattureFiltro}
                            onChange={setFattureFiltro}
                        />

                        {cittaOptions.length > 0 && (
                            <div className="grid gap-2 pt-1 sm:grid-cols-[78px_1fr] sm:items-start">
                              <p className="pt-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200">Citta</p>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCittaFiltro("tutte")}
                                    className={[
                                      "inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition-colors",
                                      cittaFiltro === "tutte"
                                          ? "border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] shadow-sm"
                                          : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
                                    ].join(" ")}
                                >
                                  Tutte
                                </button>
                                {cittaOptions.map((citta) => (
                                    <button
                                        key={citta}
                                        type="button"
                                        onClick={() => setCittaFiltro(citta)}
                                        className={[
                                          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                                          cittaFiltro === citta
                                              ? "border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] shadow-sm"
                                              : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
                                        ].join(" ")}
                                    >
                                      <MapPin className="h-3 w-3" />
                                      {citta}
                                    </button>
                                ))}
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                )}
              </div>
            </div>

            <p className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400 xl:pt-2.5">
              {filteredBoutiques.length} di {boutiques.length} boutique
            </p>
          </div>

          {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilterChips.map((item) => (
                    <FilterChip key={item.id} label={item.label} onRemove={item.onRemove} />
                ))}
                <button
                    type="button"
                    onClick={resetFiltri}
                    className="h-8 rounded-full px-2 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                >
                  Reset
                </button>
              </div>
          )}
        </div>

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
                      onManageAccount={openAccount}
                      onToggleServizio={handleToggleServizio}
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
            onClose={closeAccount}
        />

        {statoBoutique && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 p-4 backdrop-blur-[2px]"
                onClick={() => !statoSubmitting && setStatoBoutique(null)}
            >
              <div
                  className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.65)] dark:border-stone-800 dark:bg-stone-900"
                  onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                {statoBoutique.attiva ? <CirclePause className="h-5 w-5" /> : <CirclePlay className="h-5 w-5" />}
              </span>
                  <div>
                    <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {statoBoutique.attiva ? "Disattiva boutique" : "Riattiva boutique"}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {statoBoutique.attiva
                          ? `${statoBoutique.nome} non sarà più disponibile per nuove ricariche o nuove fatture.`
                          : `${statoBoutique.nome} tornerà disponibile nei flussi operativi.`}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Button
                      type="button"
                      variant="outline"
                      disabled={statoSubmitting}
                      onClick={() => setStatoBoutique(null)}
                      className="h-9 rounded-xl border-stone-200 text-stone-700 dark:border-stone-800 dark:text-stone-300"
                  >
                    Annulla
                  </Button>
                  <Button
                      type="button"
                      disabled={statoSubmitting}
                      onClick={handleConfermaStato}
                      className="brand-primary h-9 min-w-[104px] rounded-xl font-semibold"
                  >
                    {statoSubmitting ? "Salvo..." : statoBoutique.attiva ? "Disattiva" : "Riattiva"}
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
