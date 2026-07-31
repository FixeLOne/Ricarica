import { Building2, FileText, ImageUp, MapPin, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isConfigured } from "./aziendaHelpers";

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

export function CompanyCard({ company, logoSrc, loading, onEdit }) {
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

export function DocumentPreview({ company, logoSrc }) {
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
