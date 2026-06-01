import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Image,
  Layers,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDatiAzienda } from "@/api/aziendaApi";
import { getBoutique, getTutteLeBoutique } from "@/api/boutiqueApi";
import { creaFattura, getFatturaById, modificaFattura } from "@/api/fattureApi";
import { useAuth } from "@/context/AuthContext";
import FatturaDocumentPreview from "./FatturaDocumentPreview";
import {
  calcolaRiga,
  calcolaTotaliDocumento,
  formatMoney,
  normalizzaDocumentoPerApi,
  TIMBRE_FISCAL_DEFAULT,
  TIPO_DOCUMENTO_OPTIONS,
  TVA_OPTIONS,
} from "./fatturaHelpers";

const ADMIN_DOC_VALUE = "__ADMIN__";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function createRow() {
  return {
    localId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    reference: "",
    descrizione: "",
    quantita: "1",
    prezzoUnitarioHT: "0.000",
    scontoPercentuale: "0",
    aliquotaTVA: "19",
  };
}

function createDocumento() {
  return {
    tipo: "FACTURE",
    stato: "BOZZA",
    numero: "Automatico",
    dataEmissione: todayIso(),
    nomeCliente: "",
    boutiqueId: "",
    nomeBoutique: "",
    timbreFiscal: false,
    logoIntestazioneVisibile: true,
    logoWatermarkVisibile: false,
    remiseGlobale: "0.000",
    righe: [createRow()],
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

function normalizeBoutique(boutique) {
  return {
    id: boutique.id,
    nome: boutique.nome,
    citta: boutique.citta ?? boutique["città"] ?? boutique["cittÃ "] ?? "",
    attiva: boutique.attiva !== false,
    fattureAbilitate: boutique.servizi?.fatture ?? boutique.fattureAbilitate ?? false,
  };
}

function responseToDocumento(fattura) {
  return {
    ...createDocumento(),
    ...fattura,
    boutiqueId: fattura.boutiqueId ? String(fattura.boutiqueId) : "",
    remiseGlobale: String(fattura.remiseGlobale ?? "0.000"),
    logoIntestazioneVisibile: fattura.logoIntestazioneVisibile !== false,
    logoWatermarkVisibile: Boolean(fattura.logoWatermarkVisibile),
    righe: (fattura.righe ?? []).map((riga) => ({
      localId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      id: riga.id,
      reference: riga.reference ?? "",
      descrizione: riga.descrizione ?? "",
      quantita: String(riga.quantita ?? "1"),
      prezzoUnitarioHT: String(riga.prezzoUnitarioHT ?? "0.000"),
      scontoPercentuale: String(riga.scontoPercentuale ?? "0"),
      aliquotaTVA: String(riga.aliquotaTVA ?? "19"),
    })),
  };
}

function FieldLabel({ children, right }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
        {children}
      </label>
      {right}
    </div>
  );
}

function SoftSection({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_45px_-40px_rgba(15,23,42,0.5)] dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/70 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/30">
        <Icon className="h-4 w-4 text-[var(--brand-text)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">{title}</p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-3 dark:border-stone-800 dark:bg-stone-950/35">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</p>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700"
      />
    </div>
  );
}

function RowEditor({ riga, index, readOnly, onChange, onRemove, canRemove }) {
  const totals = calcolaRiga(riga);

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-950/35">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
          Ligne {index + 1}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={readOnly || !canRemove}
          onClick={onRemove}
          className="h-8 w-8 rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
          aria-label={`Rimuovi riga ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
        <div>
          <FieldLabel>Ref</FieldLabel>
          <Input
            value={riga.reference}
            disabled={readOnly}
            onChange={(event) => onChange({ reference: event.target.value })}
            className="h-10 rounded-xl border-stone-200 bg-white shadow-none dark:border-stone-800 dark:bg-stone-900"
            maxLength={50}
          />
        </div>
        <div>
          <FieldLabel>Designation</FieldLabel>
          <Input
            value={riga.descrizione}
            disabled={readOnly}
            onChange={(event) => onChange({ descrizione: event.target.value })}
            placeholder="Article"
            className="h-10 rounded-xl border-stone-200 bg-white shadow-none dark:border-stone-800 dark:bg-stone-900"
            maxLength={255}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <FieldLabel>Qte</FieldLabel>
          <Input
            type="number"
            min="0.001"
            step="0.001"
            value={riga.quantita}
            disabled={readOnly}
            onChange={(event) => onChange({ quantita: event.target.value })}
            className="h-10 rounded-xl border-stone-200 bg-white text-right shadow-none dark:border-stone-800 dark:bg-stone-900"
          />
        </div>
        <div>
          <FieldLabel>Prix HT</FieldLabel>
          <Input
            type="number"
            min="0"
            step="0.001"
            value={riga.prezzoUnitarioHT}
            disabled={readOnly}
            onChange={(event) => onChange({ prezzoUnitarioHT: event.target.value })}
            className="h-10 rounded-xl border-stone-200 bg-white text-right shadow-none dark:border-stone-800 dark:bg-stone-900"
          />
        </div>
        <div>
          <FieldLabel>Remise %</FieldLabel>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={riga.scontoPercentuale}
            disabled={readOnly}
            onChange={(event) => onChange({ scontoPercentuale: event.target.value })}
            className="h-10 rounded-xl border-stone-200 bg-white text-right shadow-none dark:border-stone-800 dark:bg-stone-900"
          />
        </div>
        <div>
          <FieldLabel>TVA</FieldLabel>
          <Select
            value={String(riga.aliquotaTVA)}
            disabled={readOnly}
            onValueChange={(value) => onChange({ aliquotaTVA: value })}
          >
            <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-white shadow-none dark:border-stone-800 dark:bg-stone-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
              {TVA_OPTIONS.map((option) => (
                <SelectItem key={option} value={option} className="rounded-lg">
                  {option}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Total HT</FieldLabel>
          <div className="flex h-10 items-center justify-end rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-100">
            {formatMoney(totals.montanteHT)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FatturaEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utente } = useAuth();
  const isNew = !id || id === "nuova";
  const canChooseBoutique = utente?.ruolo === "ADMIN" || utente?.ruolo === "SUPER_ADMIN";

  const [documento, setDocumento] = useState(createDocumento);
  const [azienda, setAzienda] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(null);

  const readOnly = documento.stato && documento.stato !== "BOZZA";
  const totals = useMemo(() => calcolaTotaliDocumento(documento, TIMBRE_FISCAL_DEFAULT), [documento]);

  const updateDocumento = (patch) => {
    setDocumento((current) => ({ ...current, ...patch }));
  };

  const updateRow = (localId, patch) => {
    setDocumento((current) => ({
      ...current,
      righe: current.righe.map((riga) => (riga.localId === localId ? { ...riga, ...patch } : riga)),
    }));
  };

  const addRow = () => {
    setDocumento((current) => ({ ...current, righe: [...current.righe, createRow()] }));
  };

  const removeRow = (localId) => {
    setDocumento((current) => ({
      ...current,
      righe: current.righe.length > 1 ? current.righe.filter((riga) => riga.localId !== localId) : current.righe,
    }));
  };

  const validate = useCallback(() => {
    if (!documento.tipo) return "Tipo documento obbligatorio.";
    if (!documento.dataEmissione) return "Data documento obbligatoria.";
    if (!documento.righe.length) return "Inserisci almeno una riga.";
    const invalidRow = documento.righe.find((riga) => !riga.descrizione?.trim() || Number(riga.quantita) <= 0 || Number(riga.prezzoUnitarioHT) < 0);
    if (invalidRow) return "Ogni riga deve avere designation, quantita positiva e prezzo valido.";
    const invalidTva = documento.righe.find((riga) => !TVA_OPTIONS.includes(String(riga.aliquotaTVA)));
    if (invalidTva) return "Aliquota TVA non ammessa. Usa 0, 7, 13 o 19.";
    const invalidDiscount = documento.righe.find((riga) => Number(riga.scontoPercentuale) < 0 || Number(riga.scontoPercentuale) > 100);
    if (invalidDiscount) return "La remise riga deve essere tra 0 e 100.";
    if (Number(documento.remiseGlobale) > totals.totaleHT) return "La remise globale non puo superare il totale HT.";
    return null;
  }, [documento, totals.totaleHT]);

  useEffect(() => {
    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      setApiError(null);
      try {
        const [aziendaRes, boutiqueRes, fatturaRes] = await Promise.all([
          getDatiAzienda().catch(() => ({ data: null })),
          canChooseBoutique
            ? (utente?.ruolo === "SUPER_ADMIN" ? getTutteLeBoutique() : getBoutique()).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
          isNew ? Promise.resolve(null) : getFatturaById(id),
        ]);

        if (ignore) return;

        setAzienda(aziendaRes.data);
        setBoutiques((boutiqueRes.data ?? []).map(normalizeBoutique).filter((boutique) => boutique.attiva && boutique.fattureAbilitate));

        if (fatturaRes?.data) {
          setDocumento(responseToDocumento(fatturaRes.data));
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
  }, [canChooseBoutique, id, isNew, utente?.ruolo]);

  const save = async () => {
    const validationError = validate();
    if (validationError) {
      setApiError(validationError);
      return null;
    }

    setSaving(true);
    setApiError(null);
    setSuccess(null);

    try {
      const payload = normalizzaDocumentoPerApi(documento);
      const response = isNew ? await creaFattura(payload) : await modificaFattura(id, payload);
      const saved = responseToDocumento(response.data);
      setDocumento(saved);
      setSuccess("Bozza salvata correttamente.");
      if (isNew) navigate(`/fatture/${saved.id}`, { replace: true });
      return saved;
    } catch (error) {
      setApiError(getApiError(error));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveAndPrint = async () => {
    const saved = readOnly ? documento : await save();
    if (saved) window.setTimeout(() => window.print(), 120);
  };

  const boutiqueValue = documento.boutiqueId ? String(documento.boutiqueId) : ADMIN_DOC_VALUE;

  if (loading) {
    return (
      <div className="grid h-full min-h-[520px] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 dark:border-stone-800 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate("/fatture")}
            className="mt-0.5 h-9 w-9 rounded-xl border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-300"
            aria-label="Torna alle fatture"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_4px_var(--brand-soft)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-text)]">
                Editeur de facture
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              {isNew ? "Nuova bozza" : documento.numero}
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Modifica righe, timbre, remise e resa grafica del documento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-900">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">HT net</p>
            <p className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">{formatMoney(totals.totaleHTNet)}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-900">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">TVA</p>
            <p className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">{formatMoney(totals.totaleTVA)}</p>
          </div>
          <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-text)]">Net a payer</p>
            <p className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">{formatMoney(totals.totaleNet)}</p>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
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

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[460px_1fr]">
        <aside className="min-h-0 flex flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2 pr-1">
            <SoftSection title="Emetteur" icon={Building2}>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-800 dark:bg-stone-950/35">
              <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">{azienda?.ragioneSociale || "Azienda non configurata"}</p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{azienda?.matriculeFiscale || "Matricule fiscale mancante"}</p>
            </div>
            {canChooseBoutique && (
              <div>
                <FieldLabel>Boutique</FieldLabel>
                <Select
                  value={boutiqueValue}
                  disabled={readOnly}
                  onValueChange={(value) => {
                    const selected = boutiques.find((boutique) => String(boutique.id) === value);
                    updateDocumento({
                      boutiqueId: value === ADMIN_DOC_VALUE ? "" : value,
                      nomeBoutique: selected?.nome ?? "",
                    });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                    <SelectItem value={ADMIN_DOC_VALUE} className="rounded-lg">Admin / sede</SelectItem>
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

          <SoftSection title="Document" icon={FileText}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Type</FieldLabel>
                <Select
                  value={documento.tipo}
                  disabled={readOnly}
                  onValueChange={(value) => updateDocumento({ tipo: value })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40">
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
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
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
              <FieldLabel right={<span className="text-[10px] text-stone-400">Automatico</span>}>Numero</FieldLabel>
              <Input
                value={documento.numero || "Automatico"}
                disabled
                className="h-10 rounded-xl border-stone-200 bg-stone-100 font-medium text-stone-500 shadow-none dark:border-stone-800 dark:bg-stone-950/50"
              />
            </div>
          </SoftSection>

          <SoftSection title="Client & finances" icon={ReceiptText}>
            <div>
              <FieldLabel right={<span className="text-[10px] text-stone-400">{documento.nomeCliente?.length ?? 0} / 150</span>}>Nom du client</FieldLabel>
              <Input
                value={documento.nomeCliente}
                disabled={readOnly}
                onChange={(event) => updateDocumento({ nomeCliente: event.target.value })}
                placeholder="Client passager"
                maxLength={150}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>
            <ToggleRow
              icon={ReceiptText}
              title="Timbre fiscal"
              description={documento.timbreFiscal ? "Applique au total" : "Non applique"}
              checked={documento.timbreFiscal}
              disabled={readOnly}
              onChange={(checked) => updateDocumento({ timbreFiscal: checked })}
            />
            <div>
              <FieldLabel>Remise globale (DT)</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={documento.remiseGlobale}
                disabled={readOnly}
                onChange={(event) => updateDocumento({ remiseGlobale: event.target.value })}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 text-right shadow-none dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>
          </SoftSection>

          <SoftSection title="Logo & watermark" icon={Image}>
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
            {!azienda?.logo && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                Nessun logo caricato nella pagina Azienda.
              </p>
            )}
          </SoftSection>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                Articles <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[var(--brand-on-primary)]">{documento.righe.length}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={readOnly}
                onClick={addRow}
                className="h-8 rounded-xl border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 text-xs font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Riga
              </Button>
            </div>
            {documento.righe.map((riga, index) => (
              <RowEditor
                key={riga.localId}
                riga={riga}
                index={index}
                readOnly={readOnly}
                canRemove={documento.righe.length > 1}
                onChange={(patch) => updateRow(riga.localId, patch)}
                onRemove={() => removeRow(riga.localId)}
              />
            ))}
            </section>
          </div>

          <div className="z-20 grid shrink-0 gap-2 border-t border-stone-200 bg-stone-50/95 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:grid-cols-2">
            <Button
              type="button"
              disabled={saving || readOnly}
              onClick={save}
              className="brand-primary h-11 rounded-xl font-semibold"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvo..." : "Salva bozza"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={saveAndPrint}
              className="h-11 rounded-xl border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <Printer className="h-4 w-4" />
              Stampa/PDF
            </Button>
          </div>
        </aside>

        <section className="min-h-0 overflow-auto rounded-2xl border border-stone-200 bg-stone-100/60 p-4 dark:border-stone-800 dark:bg-stone-950/35">
          <FatturaDocumentPreview documento={{ ...documento, ...totals }} azienda={azienda} />
        </section>
      </div>
    </div>
  );
}
