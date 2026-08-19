import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Image,
  Layers,
  Loader2,
  Plus,
  Printer,
  ReceiptText,
  Send,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosClient from "@/api/axiosClient";
import { getApiError } from "@/api/apiError";
import { getDatiAzienda } from "@/api/aziendaApi";
import { getBoutique } from "@/api/boutiqueApi";
import { creaAvoir, creaFattura, emettiFattura, getFatturaById, modificaFattura } from "@/api/fattureApi";
import { useAuth } from "@/context/AuthContext";
import ConfirmActionDialog from "./ConfirmActionDialog";
import FatturaDocumentPreview from "./FatturaDocumentPreview";
import { TopbarPortal } from "@/components/layout/TopbarSlot";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EditorBar } from "./FatturaEditorBar";
import { FieldLabel, RowEditor, SoftSection, ToggleRow } from "./FatturaEditorFields";
import {
  createDocumento,
  createRow,
  mergeDocumentoSalvato,
  responseToDocumento,
  validaDocumento,
  validaSalvataggio,
} from "./fatturaEditorHelpers";
import {
  calcolaTotaliDocumento,
  normalizzaDocumentoPerApi,
  TIMBRE_FISCAL_DEFAULT,
  TIPO_DOCUMENTO_OPTIONS,
} from "./fatturaHelpers";

const NESSUNA_BOUTIQUE = "__nessuna__";
const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function FatturaEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utente } = useAuth();
  const isNew = !id || id === "nuova";
  const isAdmin = utente?.ruolo === "ADMIN";
  const [documento, setDocumento] = useState(createDocumento);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(normalizzaDocumentoPerApi(createDocumento())));
  const [azienda, setAzienda] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [attemptedEmit, setAttemptedEmit] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);
  const [focusRowId, setFocusRowId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionWorking, setActionWorking] = useState(false);

  const readOnly = documento.stato && documento.stato !== "BOZZA";
  const totals = useMemo(() => calcolaTotaliDocumento(documento, TIMBRE_FISCAL_DEFAULT), [documento]);

  // Da 1440px in su intestazione, totali e azioni salgono nella barra alta
  // dell'app. Sotto quella soglia le due colonne non ci stanno senza
  // restringere il foglio sotto la sua misura di stampa: meglio impilarle,
  // cosi la compilazione prende tutta la larghezza e il documento resta fedele.
  const barraInAlto = useMediaQuery("(min-width: 1440px)");
  const validation = useMemo(() => validaDocumento(documento, totals.totaleHT), [documento, totals.totaleHT]);
  // Cosa impedisce di salvare (righe vuote escluse) e cosa impedisce di
  // emettere sono due domande diverse: vedi validaSalvataggio.
  const validationSalvataggio = useMemo(
    () => validaSalvataggio(documento, totals.totaleHT),
    [documento, totals.totaleHT],
  );
  const isDirty = useMemo(
    () => JSON.stringify(normalizzaDocumentoPerApi(documento)) !== savedSnapshot,
    [documento, savedSnapshot],
  );
  const activeRowIndex = useMemo(
    () => (activeRowId == null ? null : documento.righe.findIndex((riga) => riga.localId === activeRowId)),
    [activeRowId, documento.righe],
  );
  // L'errore di validazione e derivato dallo stato corrente (non fissato al
  // momento del tentativo): si aggiorna o sparisce da solo mentre l'utente
  // corregge. apiError resta invece per gli errori del server, che restano
  // finche l'utente non modifica. Mostrato solo dopo un'azione esplicita
  // (Emetti, Ctrl+S, Stampa) — l'autosave in background fallisce in silenzio.
  const displayError = apiError || (attemptedEmit ? validation.messaggio : null);

  // Refs "sempre aggiornate": permettono a performSave e al flush di uscita
  // di leggere lo stato piu recente anche quando vengono invocati da un
  // timer/listener registrato molti render fa, senza richiudere su valori
  // stantii e senza dover elencare "documento" tra le dipendenze di ogni
  // effect (si aggiornano loro stesse via effect, mai durante il render).
  const documentoRef = useRef(documento);
  const savedSnapshotRef = useRef(savedSnapshot);
  const savingRef = useRef(false);
  // Id creato da noi con il primo salvataggio: dopo la navigazione verso
  // /fatture/:id il loader non deve riscaricare il documento (lo abbiamo gia
  // in memoria, ricaricarlo rimonterebbe il form sotto le dita dell'utente).
  const skipReloadIdRef = useRef(null);

  useEffect(() => {
    documentoRef.current = documento;
  }, [documento]);
  useEffect(() => {
    savedSnapshotRef.current = savedSnapshot;
  }, [savedSnapshot]);

  const applyDocumento = (next) => {
    setDocumento(next);
    setSavedSnapshot(JSON.stringify(normalizzaDocumentoPerApi(next)));
    setAttemptedEmit(false);
  };

  const updateDocumento = (patch) => {
    setApiError(null);
    setDocumento((current) => ({ ...current, ...patch }));
  };

  const updateRow = (localId, patch) => {
    setApiError(null);
    setDocumento((current) => ({
      ...current,
      righe: current.righe.map((riga) => (riga.localId === localId ? { ...riga, ...patch } : riga)),
    }));
  };

  const addRow = () => {
    const riga = createRow();
    setDocumento((current) => ({ ...current, righe: [...current.righe, riga] }));
    setFocusRowId(riga.localId);
  };

  const duplicateRow = (localId) => {
    const nuovoId = createRow().localId;
    setDocumento((current) => {
      const index = current.righe.findIndex((riga) => riga.localId === localId);
      if (index < 0) return current;
      const copia = { ...current.righe[index], localId: nuovoId, id: undefined };
      const righe = [...current.righe];
      righe.splice(index + 1, 0, copia);
      return { ...current, righe };
    });
    setFocusRowId(nuovoId);
  };

  const removeRow = (localId) => {
    setDocumento((current) => ({
      ...current,
      righe: current.righe.length > 1 ? current.righe.filter((riga) => riga.localId !== localId) : current.righe,
    }));
  };

  /**
   * Unico punto di salvataggio, usato sia dall'autosave silenzioso sia dalle
   * azioni esplicite (Ctrl+S, Emetti, Stampa/PDF). Legge sempre da
   * documentoRef (mai da una closure) cosi funziona correttamente anche se
   * invocato da un timer schedulato render fa. { silent: true } sopprime gli
   * errori (l'autosave in background non deve interrompere chi sta scrivendo
   * una riga non ancora valida) e non tocca "attemptedEmit".
   */
  const performSave = useCallback(async ({ silent = false } = {}) => {
    const doc = documentoRef.current;
    const totaleHT = calcolaTotaliDocumento(doc, TIMBRE_FISCAL_DEFAULT).totaleHT;
    const currentValidation = validaSalvataggio(doc, totaleHT);

    if (currentValidation.messaggio) {
      if (!silent) setAttemptedEmit(true);
      return null;
    }

    // Un salvataggio alla volta: se ce n'e gia uno in volo lasciamo perdere,
    // ci ripensa l'effect di autosave appena "saving" torna false (il
    // documento e ancora dirty, quindi riparte da solo).
    if (savingRef.current) return null;

    savingRef.current = true;
    setSaving(true);
    setSaveStatus("saving");
    if (!silent) setApiError(null);

    const payload = normalizzaDocumentoPerApi(doc);
    const payloadSnapshot = JSON.stringify(payload);

    try {
      const existingId = doc.id;
      const response = existingId ? await modificaFattura(existingId, payload) : await creaFattura(payload);
      const saved = responseToDocumento(response.data);
      // Lo snapshot e cio che il server ha effettivamente ricevuto, non cio
      // che c'e a schermo adesso: se l'utente ha continuato a scrivere mentre
      // la richiesta era in volo, isDirty resta true e parte un altro autosave
      // per quelle modifiche, invece di darle per salvate.
      setSavedSnapshot(payloadSnapshot);
      // Merge (non sostituzione) per non rimontare i campi: vedi
      // mergeDocumentoSalvato. L'updater funzionale parte sempre dallo stato
      // piu recente, comprese le modifiche arrivate durante la richiesta.
      setDocumento((current) => mergeDocumentoSalvato(current, saved));
      setSaveStatus("saved");
      if (!existingId) {
        skipReloadIdRef.current = String(saved.id);
        navigate(`/fatture/${saved.id}`, { replace: true });
      }
      return saved;
    } catch (error) {
      setSaveStatus("error");
      if (!silent) setApiError(getApiError(error));
      return null;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [navigate]);

  const saveAndPrint = async () => {
    const saved = readOnly ? documento : await performSave();
    if (saved) window.setTimeout(() => window.print(), 120);
  };

  const askEmit = () => setPendingAction({ type: "emit", fattura: documento });
  const askAvoir = () => setPendingAction({ type: "avoir", fattura: documento });
  const askLeave = () => setPendingAction({ type: "leave" });

  const goToList = async () => {
    if (!isDirty) {
      navigate("/fatture");
      return;
    }
    if (validationSalvataggio.messaggio) {
      // Contenuto non valido: non c'e nulla da salvare automaticamente,
      // chiediamo conferma prima di scartarlo (come prima).
      askLeave();
      return;
    }
    const saved = await performSave({ silent: true });
    if (!saved) {
      // Il salvataggio e fallito (es. rete): chiediamo conferma prima di
      // uscire perdendo le modifiche, invece di scartarle in silenzio.
      askLeave();
      return;
    }
    navigate("/fatture");
  };

  const confirmPendingAction = async () => {
    if (pendingAction?.type === "leave") {
      navigate("/fatture");
      return;
    }

    setActionWorking(true);
    setApiError(null);
    try {
      if (pendingAction.type === "emit") {
        let fatturaId = documento.id;
        if (isDirty) {
          const saved = await performSave();
          if (!saved) return;
          fatturaId = saved.id;
        }
        const response = await emettiFattura(fatturaId);
        const emessa = mergeDocumentoSalvato(documentoRef.current, responseToDocumento(response.data));
        setDocumento(emessa);
        setSavedSnapshot(JSON.stringify(normalizzaDocumentoPerApi(emessa)));
        setSuccess("Documento emesso correttamente.");
        setPendingAction(null);
      }
      if (pendingAction.type === "avoir") {
        const response = await creaAvoir(documento.id);
        const avoir = responseToDocumento(response.data);
        setPendingAction(null);
        navigate(`/fatture/${avoir.id}`, { replace: true });
      }
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setActionWorking(false);
    }
  };

  useEffect(() => {
    // Il primo salvataggio di una bozza nuova ci porta da /fatture/nuova a
    // /fatture/:id: il documento e gia quello in memoria, riscaricarlo
    // rimonterebbe il form mentre l'utente sta scrivendo.
    if (skipReloadIdRef.current && skipReloadIdRef.current === String(id)) {
      skipReloadIdRef.current = null;
      return undefined;
    }

    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      setApiError(null);
      try {
        const [aziendaRes, fatturaRes] = await Promise.all([
          getDatiAzienda().catch(() => ({ data: null })),
          isNew ? Promise.resolve(null) : getFatturaById(id),
        ]);

        if (ignore) return;

        setAzienda(aziendaRes.data);

        if (fatturaRes?.data) {
          applyDocumento(responseToDocumento(fatturaRes.data));
        }
      } catch (error) {
        if (!ignore) setApiError(getApiError(error));
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [id, isNew]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let ignore = false;

    getBoutique()
      .then((response) => {
        if (!ignore) setBoutiques((response.data ?? []).filter((b) => b.fattureAbilitate && b.attiva));
      })
      .catch(() => {
        if (!ignore) setBoutiques([]);
      });

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  // Autosave: salva da solo 1.5s dopo l'ultima modifica, senza interrompere
  // chi sta scrivendo. Se il documento non e ancora valido (es. una riga
  // nuova senza descrizione) non tenta nulla e non lo segnala: fallisce in
  // silenzio finche l'utente non lo completa.
  // "saving" tra le dipendenze non e superfluo: e cio che fa ripartire il
  // salvataggio delle modifiche scritte mentre la richiesta precedente era
  // ancora in volo (a quel punto isDirty e ancora true).
  useEffect(() => {
    if (readOnly || saving || !isDirty || validationSalvataggio.messaggio) return undefined;
    const timeoutId = window.setTimeout(() => {
      void performSave({ silent: true });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [readOnly, saving, isDirty, validationSalvataggio.messaggio, documento, performSave]);

  // Salvataggio "best effort" quando l'utente chiude la scheda o cambia
  // pagina/app: niente piu dialog nativo che blocca l'uscita, si tenta solo
  // di spedire le modifiche prima che il browser scarichi la pagina.
  // fetch(...,{keepalive:true}) e usato al posto di navigator.sendBeacon
  // perche sendBeacon accetta solo POST senza header custom, mentre qui
  // serve l'header Authorization per autenticare la richiesta.
  useEffect(() => {
    const flush = () => {
      if (savingRef.current) return;
      const doc = documentoRef.current;
      const snapshot = JSON.stringify(normalizzaDocumentoPerApi(doc));
      if (snapshot === savedSnapshotRef.current) return;
      const totaleHT = calcolaTotaliDocumento(doc, TIMBRE_FISCAL_DEFAULT).totaleHT;
      if (validaSalvataggio(doc, totaleHT).messaggio) return;

      const token = localStorage.getItem("token");
      const baseURL = axiosClient.defaults.baseURL;
      const url = doc.id ? `${baseURL}/fatture/${doc.id}` : `${baseURL}/fatture`;
      try {
        fetch(url, {
          method: doc.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(normalizzaDocumentoPerApi(doc)),
          keepalive: true,
        });
      } catch {
        // Best effort: se il browser rifiuta la richiesta in uscita non
        // c'e altro da fare, i dati restano solo lato client.
      }
    };

    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("pagehide", flush);
      // Anche uscire dall'editor restando nell'app (un link della sidebar)
      // deve spedire le modifiche: senza questo, quanto scritto negli ultimi
      // 1500ms — il tempo del debounce — andava perso senza dirlo a nessuno.
      // La freccia "indietro" salva gia da se e qui trova lo snapshot
      // aggiornato, quindi non spedisce due volte.
      flush();
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (!readOnly && !saving) void performSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [readOnly, saving, performSave]);

  // Dopo "Aggiungi articolo" o "Duplica riga" porta subito la nuova riga in
  // vista con uno scorrimento animato e mette il focus sulla descrizione: si
  // scrive senza dover ricliccare un pulsante lontano ogni volta.
  // focus({preventScroll:true}) evita che il focus riattivi un secondo scroll
  // nativo del browser che romperebbe l'animazione di scrollIntoView.
  // Non serve "consumare" focusRowId: ogni riga ha un localId univoco, quindi
  // l'effect scatta di nuovo ad ogni nuova aggiunta/duplicazione comunque.
  useEffect(() => {
    if (!focusRowId) return undefined;
    const timeoutId = window.setTimeout(() => {
      const field = document.getElementById(`riga-${focusRowId}-descrizione`);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [focusRowId]);

  if (loading) {
    return (
      <div className="grid h-full min-h-[520px] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  const canAvoir = readOnly && documento.stato === "EMESSA" && documento.tipo !== "AVOIR";

  // Un solo testo per "in coda" e "in corso": l'utente non deve vedere due
  // cambi di etichetta di fila per un salvataggio che dura una frazione di
  // secondo. L'icona gira solo mentre la richiesta e davvero in volo.
  const autosaveLabel = readOnly
    ? null
    : saveStatus === "error"
      ? { text: "Non salvato", tone: "text-red-600 dark:text-red-400", icon: AlertCircle }
      : saving || (isDirty && !validationSalvataggio.messaggio)
        ? { text: "Salvataggio...", tone: "text-stone-400 dark:text-stone-500", icon: Loader2, spin: saving }
        : documento.id && !isDirty
          ? { text: "Salvato", tone: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 }
          : null;

  const titolo = isNew ? "Nuova bozza" : documento.numero;
  const isAvoir = documento.tipo === "AVOIR";

  const renderAzioni = (compatto) => {
    const forma = compatto ? "h-8 rounded-lg px-3" : "h-11 rounded-xl";
    // Su una bozza l'azione e "Emetti": la stampa resta a portata ma senza
    // etichetta, per non allineare tre bottoni di pari peso nella barra.
    // Su un documento gia emesso la stampa e invece l'azione principale.
    const stampaSoloIcona = compatto && !readOnly;
    return (
      <>
        {!readOnly && (
          // Sempre presente (non compare dal nulla al primo salvataggio, che
          // sposterebbe tutta la barra): resta disabilitato finche la bozza
          // non e stata salvata almeno una volta ed e valida.
          <Button
            type="button"
            disabled={!documento.id || saving || actionWorking || Boolean(validation.messaggio)}
            onClick={askEmit}
            className={`brand-primary ${forma} font-semibold`}
          >
            <Send className="h-4 w-4" />
            Emetti
          </Button>
        )}
        {canAvoir && (
          <Button
            type="button"
            variant="outline"
            disabled={actionWorking}
            onClick={askAvoir}
            className={`${forma} border-[var(--brand-border)] bg-[var(--brand-soft)] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]`}
          >
            <Undo2 className="h-4 w-4" />
            Crea Avoir
          </Button>
        )}
        <Button
          type="button"
          variant={readOnly ? "default" : "outline"}
          disabled={saving}
          onClick={saveAndPrint}
          aria-label="Stampa o esporta in PDF"
          title="Stampa / PDF"
          className={
            readOnly
              ? `brand-primary ${forma} font-semibold`
              : `${forma} ${stampaSoloIcona ? "w-8 px-0" : ""} border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800`
          }
        >
          <Printer className="h-4 w-4" />
          {!stampaSoloIcona && "Stampa/PDF"}
        </Button>
      </>
    );
  };

  const intestazione = (
    <EditorBar
      layout={barraInAlto ? "barra" : "pagina"}
      titolo={titolo}
      autosaveLabel={autosaveLabel}
      totals={totals}
      isAvoir={isAvoir}
      onBack={goToList}
      azioni={barraInAlto ? renderAzioni(true) : null}
    />
  );

  return (
    <div className="flex min-h-0 flex-col gap-4 min-[1440px]:h-full">
      {barraInAlto ? <TopbarPortal>{intestazione}</TopbarPortal> : intestazione}

      {displayError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-2 text-sm font-medium text-[var(--brand-text)]">
          {success}
        </div>
      )}
      {readOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          Documento gia emesso o annullato: i campi sono in sola lettura.
        </div>
      )}

      {/* La colonna del foglio ha una misura naturale (640px di documento piu
          aria) e non guadagna nulla oltre: e la compilazione a prendersi tutto
          lo spazio in piu, invece di lasciarlo diventare vuoto attorno al
          foglio — erano 532px sprecati su un monitor da 1920. */}
      <div className="mx-auto grid w-full max-w-[1800px] gap-5 min-[1440px]:min-h-0 min-[1440px]:flex-1 min-[1440px]:grid-cols-[minmax(440px,1fr)_694px]">
        <aside className="flex flex-col min-[1440px]:min-h-0">
          <div className="@container space-y-4 pb-2 pr-1 min-[1440px]:min-h-0 min-[1440px]:flex-1 min-[1440px]:overflow-y-auto">
            <SoftSection title="Mittente" icon={Building2}>
              {azienda?.ragioneSociale ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-800 dark:bg-stone-950/35">
                  <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">{azienda.ragioneSociale}</p>
                  {azienda.matriculeFiscale && (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{azienda.matriculeFiscale}</p>
                  )}
                </div>
              ) : (
                // Qui un invito ad agire e piu utile di un segnaposto: il
                // documento resta senza intestazione finche non si compila.
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3 dark:border-amber-400/30 dark:bg-amber-400/10">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Dati azienda da configurare
                  </p>
                  <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-200/80">
                    Senza intestazione il documento verra stampato senza i tuoi dati fiscali.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/azienda")}
                    className="mt-2.5 h-8 rounded-xl border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-transparent dark:text-amber-200"
                  >
                    Configura ora
                  </Button>
                </div>
              )}
            </SoftSection>

          <SoftSection title="Documento" icon={FileText} griglia>
            <div className="grid grid-cols-2 gap-3 @[560px]:col-span-2">
              <div>
                <FieldLabel htmlFor="doc-tipo">Tipo</FieldLabel>
                {documento.tipo === "AVOIR" ? (
                  <Input
                    id="doc-tipo"
                    value="Avoir"
                    disabled
                    className="h-10 rounded-xl border-stone-200 bg-stone-100 font-medium text-stone-500 shadow-none dark:border-stone-800 dark:bg-stone-950/50"
                  />
                ) : (
                  <Select
                    value={documento.tipo}
                    disabled={readOnly}
                    onValueChange={(value) => updateDocumento({ tipo: value })}
                  >
                    <SelectTrigger id="doc-tipo" className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                      {TIPO_DOCUMENTO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <FieldLabel htmlFor="doc-data">Data</FieldLabel>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="doc-data"
                    type="date"
                    value={documento.dataEmissione}
                    disabled={readOnly}
                    onChange={(event) => updateDocumento({ dataEmissione: event.target.value })}
                    className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9 shadow-none dark:border-stone-800 dark:bg-stone-950/40"
                  />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="doc-numero" right={<span className="text-[10px] text-stone-400">Automatico</span>}>Numero</FieldLabel>
              <Input
                id="doc-numero"
                value={documento.numero || "Automatico"}
                disabled
                className="h-10 rounded-xl border-stone-200 bg-stone-100 font-medium text-stone-500 shadow-none dark:border-stone-800 dark:bg-stone-950/50"
              />
            </div>
            {isAdmin && boutiques.length > 0 && (
              <div>
                <FieldLabel htmlFor="doc-boutique">Boutique</FieldLabel>
                <Select
                  value={documento.boutiqueId || NESSUNA_BOUTIQUE}
                  disabled={readOnly || !isNew}
                  onValueChange={(value) => updateDocumento({ boutiqueId: value === NESSUNA_BOUTIQUE ? "" : value })}
                >
                  <SelectTrigger id="doc-boutique" className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                    <SelectItem value={NESSUNA_BOUTIQUE} className="rounded-lg">Nessuna (fattura diretta)</SelectItem>
                    {boutiques.map((boutique) => (
                      <SelectItem key={boutique.id} value={String(boutique.id)} className="rounded-lg">
                        {boutique.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </SoftSection>

          <SoftSection title="Cliente e finanze" icon={ReceiptText} griglia>
            <div>
              <FieldLabel htmlFor="doc-cliente" right={<span className="text-[10px] text-stone-400">{documento.nomeCliente?.length ?? 0} / 150</span>}>Nome cliente</FieldLabel>
              <Input
                id="doc-cliente"
                value={documento.nomeCliente}
                disabled={readOnly}
                onChange={(event) => updateDocumento({ nomeCliente: event.target.value })}
                placeholder="Client passager"
                maxLength={150}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>
            {/* Dati B2B: servono al cliente azienda per detrarre la TVA.
                Restano vuoti per le vendite al banco. */}
            <div>
              <FieldLabel
                htmlFor="doc-cliente-indirizzo"
                right={<span className="text-[10px] text-stone-400">Facoltativo</span>}
              >
                Indirizzo cliente
              </FieldLabel>
              <Input
                id="doc-cliente-indirizzo"
                value={documento.indirizzoCliente}
                disabled={readOnly}
                onChange={(event) => updateDocumento({ indirizzoCliente: event.target.value })}
                placeholder="Via, citta"
                maxLength={200}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>
            <div>
              <FieldLabel
                htmlFor="doc-cliente-mf"
                right={<span className="text-[10px] text-stone-400">Facoltativo</span>}
              >
                Matricule fiscale cliente
              </FieldLabel>
              <Input
                id="doc-cliente-mf"
                value={documento.matriculeFiscaleCliente}
                disabled={readOnly}
                onChange={(event) => updateDocumento({ matriculeFiscaleCliente: event.target.value })}
                placeholder="0000000/A/M/000"
                maxLength={80}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>
            <div>
              <FieldLabel htmlFor="doc-remise">Remise globale (DT)</FieldLabel>
              <Input
                id="doc-remise"
                type="number"
                min="0"
                step="0.001"
                value={documento.remiseGlobale}
                disabled={readOnly}
                onChange={(event) => updateDocumento({ remiseGlobale: event.target.value })}
                className="no-spinner h-10 rounded-xl border-stone-200 bg-stone-50 text-right shadow-none dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>
            <div className="@[560px]:col-span-2">
              <ToggleRow
                icon={ReceiptText}
                title="Timbre fiscal"
                description={documento.timbreFiscal ? "Applicato al totale" : "Non applicato"}
                checked={documento.timbreFiscal}
                disabled={readOnly}
                onChange={(checked) => updateDocumento({ timbreFiscal: checked })}
              />
            </div>
          </SoftSection>

          {azienda?.logo && (
            <SoftSection title="Logo e watermark" icon={Image}>
              <ToggleRow
                icon={Image}
                title="Logo in alto a sinistra"
                description="Mostra il logo nell'intestazione"
                checked={documento.logoIntestazioneVisibile}
                disabled={readOnly}
                onChange={(checked) => updateDocumento({ logoIntestazioneVisibile: checked })}
              />
              <ToggleRow
                icon={Layers}
                title="Watermark centrale"
                description="Usa il logo come sfondo leggero"
                checked={documento.logoWatermarkVisibile}
                disabled={readOnly}
                onChange={(checked) => updateDocumento({ logoWatermarkVisibile: checked })}
              />
            </SoftSection>
          )}

          <section className="space-y-3 @[660px]:space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
              Articoli <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[var(--brand-on-primary)]">{documento.righe.length}</span>
            </p>
            {documento.righe.map((riga, index) => (
              <RowEditor
                key={riga.localId}
                riga={riga}
                index={index}
                readOnly={readOnly}
                canRemove={documento.righe.length > 1}
                onChange={(patch) => updateRow(riga.localId, patch)}
                onRemove={() => removeRow(riga.localId)}
                onDuplicate={() => duplicateRow(riga.localId)}
                onFieldFocus={() => setActiveRowId(riga.localId)}
                etichetteVisibili={index === 0}
                invalidFields={attemptedEmit ? (validation.righeInvalide.get(riga.localId) ?? []) : []}
              />
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={addRow}
                className="h-11 w-full rounded-2xl border-dashed border-stone-300 bg-transparent text-sm font-semibold text-stone-500 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-700 dark:text-stone-400"
              >
                <Plus className="h-4 w-4" />
                Aggiungi articolo
              </Button>
            )}
            </section>
          </div>

          {/* Sopra i 1400px le azioni stanno nella barra alta: qui tornano in
              fondo alla colonna, dove restano raggiungibili senza scorrere. */}
          {!barraInAlto && (
            <div className="z-20 grid shrink-0 gap-2 border-t border-stone-200 bg-stone-50/95 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
              {renderAzioni(false)}
            </div>
          )}
        </aside>

        <section
          className="min-h-0 overflow-auto rounded-2xl border border-stone-200 bg-stone-100/60 p-4 dark:border-stone-800 dark:bg-stone-950/35"
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          <FatturaDocumentPreview
            documento={{ ...documento, ...totals }}
            azienda={azienda}
            fitPageToViewport
            activeRowIndex={activeRowIndex}
            editable={!readOnly}
          />
        </section>
      </div>

      <ConfirmActionDialog
        action={pendingAction}
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && !actionWorking && setPendingAction(null)}
        onConfirm={confirmPendingAction}
        working={actionWorking}
      />
    </div>
  );
}
