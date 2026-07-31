import { useMemo, useRef } from "react";
import { useWatch } from "react-hook-form";
import {
  Building2,
  FileText,
  Loader2,
  MapPin,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

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
import {
  ACCEPTED_LOGO_TYPES,
  emptyValues,
  isConfigured,
  logoToSrc,
} from "./aziendaHelpers";

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

export default function AziendaEditorDialog({
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
