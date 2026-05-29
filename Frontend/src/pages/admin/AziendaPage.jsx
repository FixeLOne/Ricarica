import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  ImageUp,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { getDatiAzienda, salvaDatiAzienda } from "@/api/aziendaApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_LOGO_SIZE = 1_000_000;
const ACCEPTED_LOGO_TYPES = ["image/png"];

const schema = z.object({
  ragioneSociale: z.string().trim().min(2, "Inserisci almeno 2 caratteri").max(140, "Massimo 140 caratteri"),
  indirizzo: z.string().trim().min(3, "Inserisci almeno 3 caratteri").max(180, "Massimo 180 caratteri"),
  matriculeFiscale: z.string().trim().min(3, "Inserisci almeno 3 caratteri").max(80, "Massimo 80 caratteri"),
});

const emptyValues = {
  ragioneSociale: "",
  indirizzo: "",
  matriculeFiscale: "",
};

function getApiError(error) {
  return (
    error?.response?.data?.errore ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === "string" ? error.response.data : null) ||
    "Operazione non riuscita"
  );
}

function isNotConfigured(error) {
  const message = getApiError(error).toLowerCase();
  return error?.response?.status === 400 && message.includes("non ancora configurati");
}

function normalizeCompany(data) {
  if (!data) return null;

  return {
    ragioneSociale: data.ragioneSociale ?? "",
    indirizzo: data.indirizzo ?? "",
    matriculeFiscale: data.matriculeFiscale ?? "",
    logo: data.logo ?? null,
  };
}

function isConfigured(company) {
  return Boolean(
    company?.ragioneSociale?.trim() &&
      company?.indirizzo?.trim() &&
      company?.matriculeFiscale?.trim()
  );
}

function logoToSrc(logo) {
  if (!logo) return null;
  if (logo.startsWith("data:")) return logo;
  return `data:image/png;base64,${logo}`;
}

function stripDataUrlPrefix(value) {
  return value.replace(/^data:.*;base64,/, "");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrlPrefix(String(reader.result ?? "")));
    reader.onerror = () => reject(new Error("Logo non leggibile"));
    reader.readAsDataURL(file);
  });
}

function toFormValues(company) {
  return {
    ragioneSociale: company?.ragioneSociale ?? "",
    indirizzo: company?.indirizzo ?? "",
    matriculeFiscale: company?.matriculeFiscale ?? "",
  };
}

function fieldError(error) {
  return error ? <p className="mt-1.5 text-[11px] font-medium text-red-500">{error.message}</p> : null;
}

function FieldIcon({ icon: Icon }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-stone-400 dark:text-stone-500">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-950/35">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyCompany({ onConfigure }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)]">
          <Building2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-stone-950 dark:text-stone-50">
          Dati azienda non configurati
        </h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Inserisci intestazione e logo per prepararli alle fatture.
        </p>
        <Button type="button" onClick={onConfigure} className="brand-primary mt-5 h-9 rounded-xl font-semibold">
          <Pencil className="h-4 w-4" />
          Configura azienda
        </Button>
      </div>
    </div>
  );
}

function CompanyCard({ company, logoSrc, loading, onEdit }) {
  const configured = isConfigured(company);

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-[var(--brand-soft)] px-5 py-4 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/70">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">Profilo azienda</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {configured ? "Pronto per documenti e fatture" : "Da configurare"}
            </p>
          </div>
        </div>

        {configured && (
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            className="h-9 rounded-xl border-stone-200 bg-white/80 text-stone-700 hover:bg-white dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-300 dark:hover:bg-stone-900"
          >
            <Pencil className="h-4 w-4" />
            Modifica
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 p-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="h-36 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800/70" />
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800/70" />
            ))}
          </div>
        </div>
      ) : configured ? (
        <div className="grid gap-4 p-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo azienda" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center">
                <ImageUp className="mx-auto h-5 w-5 text-[var(--brand-text)]" />
                <p className="mt-2 text-xs font-semibold text-[var(--brand-text)]">Logo non inserito</p>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <InfoLine icon={Building2} label="Ragione sociale" value={company.ragioneSociale} />
            <InfoLine icon={FileText} label="Matricule fiscale" value={company.matriculeFiscale} />
            <InfoLine icon={MapPin} label="Indirizzo" value={company.indirizzo} />
          </div>
        </div>
      ) : (
        <EmptyCompany onConfigure={onEdit} />
      )}
    </section>
  );
}

function DocumentPreview({ company, logoSrc }) {
  const configured = isConfigured(company);

  return (
    <aside className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            Anteprima
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">Intestazione documento</p>
        </div>
        <FileText className="h-4 w-4 text-[var(--brand-text)]" />
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/35">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <Building2 className="h-5 w-5 text-stone-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
              {configured ? company.ragioneSociale : "Ragione sociale"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
              {configured ? company.indirizzo : "Indirizzo aziendale"}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-text)]">
              {configured ? company.matriculeFiscale : "Matricule fiscale"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-text)]">
        {configured
          ? "Questi dati verranno usati come intestazione nei documenti."
          : "La preview si completa appena salvi i dati aziendali."}
      </div>
    </aside>
  );
}

function AziendaEditorDialog({
  open,
  company,
  logoBase64,
  logoError,
  submitting,
  serverError,
  register,
  control,
  errors,
  onOpenChange,
  onSubmit,
  onLogoChange,
  onLogoRemove,
}) {
  const fileInputRef = useRef(null);
  const formValues = { ...emptyValues, ...useWatch({ control }) };
  const formLogoSrc = useMemo(() => logoToSrc(logoBase64), [logoBase64]);
  const configured = isConfigured(company);
  const inputCn = "h-10 rounded-xl border-stone-200 bg-white pl-10 text-stone-900 shadow-inner shadow-stone-200/40 placeholder:text-stone-400 focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-50 dark:shadow-none";
  const labelCn = "text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="max-h-[calc(100vh-2rem)] max-w-3xl gap-0 overflow-hidden rounded-2xl border-stone-200 bg-white p-0 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.65)] dark:border-stone-800 dark:bg-stone-900"
      >
        <DialogHeader className="border-b border-stone-200/70 bg-[var(--brand-soft)] px-5 py-4 pr-12 text-left dark:border-stone-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
            {configured ? "Modifica azienda" : "Configura azienda"}
          </p>
          <DialogTitle className="text-base font-semibold tracking-tight text-stone-950 dark:text-stone-50">
            Dati intestazione
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 dark:text-stone-400">
            Campi fiscali e logo usati per fatture e documenti.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <div>
                <Label className={`${labelCn} mb-1.5 block`}>Ragione sociale</Label>
                <div className="relative">
                  <FieldIcon icon={Building2} />
                  <Input
                    className={`${inputCn} ${errors.ragioneSociale ? "border-red-400" : ""}`}
                    placeholder="RechargeNet SARL"
                    {...register("ragioneSociale")}
                  />
                </div>
                {fieldError(errors.ragioneSociale)}
              </div>

              <div>
                <Label className={`${labelCn} mb-1.5 block`}>Matricule fiscale</Label>
                <div className="relative">
                  <FieldIcon icon={FileText} />
                  <Input
                    className={`${inputCn} ${errors.matriculeFiscale ? "border-red-400" : ""}`}
                    placeholder="0000000/A/M/000"
                    {...register("matriculeFiscale")}
                  />
                </div>
                {fieldError(errors.matriculeFiscale)}
              </div>

              <div className="sm:col-span-2">
                <Label className={`${labelCn} mb-1.5 block`}>Indirizzo</Label>
                <div className="relative">
                  <FieldIcon icon={MapPin} />
                  <Input
                    className={`${inputCn} ${errors.indirizzo ? "border-red-400" : ""}`}
                    placeholder="Rue principale, Tunis"
                    {...register("indirizzo")}
                  />
                </div>
                {fieldError(errors.indirizzo)}
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/35">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
                  Preview live
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {formValues.ragioneSociale || "Ragione sociale"}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {formValues.indirizzo || "Indirizzo aziendale"}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-text)]">
                  {formValues.matriculeFiscale || "Matricule fiscale"}
                </p>
              </div>
            </div>

            <div className="content-start space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                aria-label="Carica logo azienda"
                className="flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-[var(--brand-text)] transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:pointer-events-none disabled:opacity-60 lg:aspect-[5/4] lg:h-auto"
              >
                {formLogoSrc ? (
                  <img src={formLogoSrc} alt="Logo azienda" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-5 w-5" />
                    <p className="mt-2 text-xs font-semibold text-[var(--brand-text)]">Logo PNG</p>
                  </div>
                )}
              </button>

              {logoError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
                  {logoError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(",")}
                onChange={onLogoChange}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="h-9 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <Upload className="h-4 w-4" />
                  Carica
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLogoRemove}
                  disabled={submitting || !logoBase64}
                  className="h-9 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Rimuovi
                </Button>
              </div>
            </div>
          </div>

          {serverError && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
              {serverError}
            </p>
          )}

          <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex flex-col gap-2 border-t border-stone-200/70 bg-white/95 px-5 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-9 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Annulla
            </Button>
            <Button type="submit" disabled={submitting} className="brand-primary h-9 min-w-[142px] rounded-xl font-semibold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? "Salvo..." : "Salva modifiche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AziendaPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [logoError, setLogoError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const logoSrc = useMemo(() => logoToSrc(company?.logo), [company?.logo]);

  const loadDati = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    setSuccess(null);
    setLogoError(null);

    try {
      const response = await getDatiAzienda();
      const loadedCompany = normalizeCompany(response.data);
      setCompany(isConfigured(loadedCompany) ? loadedCompany : null);
    } catch (error) {
      if (isNotConfigured(error)) {
        setCompany(null);
      } else {
        setApiError(getApiError(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadDati();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadDati]);

  const openEditor = () => {
    reset(toFormValues(company));
    setLogoBase64(company?.logo ?? null);
    setLogoError(null);
    setApiError(null);
    setSuccess(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (submitting) return;
    setEditorOpen(false);
    setLogoError(null);
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setLogoError(null);
    setApiError(null);

    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Formato non supportato. Usa un logo PNG.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Logo troppo grande. Massimo 1 MB.");
      return;
    }

    try {
      setLogoBase64(await fileToBase64(file));
    } catch (error) {
      setLogoError(error.message);
    }
  };

  const removeLogo = () => {
    setLogoBase64(null);
    setLogoError(null);
  };

  const submitCompany = async (formValues) => {
    setSubmitting(true);
    setApiError(null);
    setSuccess(null);

    const payload = {
      ragioneSociale: formValues.ragioneSociale.trim(),
      indirizzo: formValues.indirizzo.trim(),
      matriculeFiscale: formValues.matriculeFiscale.trim(),
      logo: logoBase64,
    };

    try {
      await salvaDatiAzienda(payload);
      setCompany(payload);
      reset(toFormValues(payload));
      setEditorOpen(false);
      setSuccess("Dati azienda salvati.");
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_4px_var(--brand-soft)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-text)]">
              Profilo fiscale
            </p>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">Azienda</h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
              Dati intestazione e logo usati nei documenti.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={loadDati}
            disabled={loading || submitting}
            className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
          {!isConfigured(company) && !loading && (
            <Button type="button" onClick={openEditor} className="brand-primary h-9 rounded-xl font-semibold">
              <Pencil className="h-4 w-4" />
              Configura
            </Button>
          )}
        </div>
      </div>

      {apiError && !editorOpen && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <CompanyCard company={company} logoSrc={logoSrc} loading={loading} onEdit={openEditor} />
        <DocumentPreview company={company} logoSrc={logoSrc} />
      </div>

      <AziendaEditorDialog
        open={editorOpen}
        company={company}
        logoBase64={logoBase64}
        logoError={logoError}
        submitting={submitting}
        serverError={apiError}
        register={register}
        control={control}
        errors={errors}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeEditor();
        }}
        onSubmit={handleSubmit(submitCompany)}
        onLogoChange={handleLogoChange}
        onLogoRemove={removeLogo}
      />
    </div>
  );
}
