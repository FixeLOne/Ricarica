import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  RefreshCw,
} from "lucide-react";

import { getApiError } from "@/api/apiError";
import { getDatiAzienda, salvaDatiAzienda } from "@/api/aziendaApi";
import { Button } from "@/components/ui/button";
import { CompanyCard, DocumentPreview } from "./AziendaCards";
import AziendaEditorDialog from "./AziendaEditorDialog";
import {
  ACCEPTED_LOGO_TYPES,
  aziendaSchema,
  emptyValues,
  fileToBase64,
  isConfigured,
  isNotConfigured,
  logoToSrc,
  MAX_LOGO_SIZE,
  normalizeCompany,
  toFormValues,
} from "./aziendaHelpers";

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
    resolver: zodResolver(aziendaSchema),
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
      // I contatti facoltativi lasciati vuoti viaggiano come null, non "".
      telefono: formValues.telefono?.trim() || null,
      email: formValues.email?.trim() || null,
      sitoWeb: formValues.sitoWeb?.trim() || null,
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
