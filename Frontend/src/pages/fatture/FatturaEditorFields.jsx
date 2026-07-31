import { Copy, Trash2 } from "lucide-react";

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
import { formatMoney } from "@/lib/format";
import { calcolaRiga, TVA_OPTIONS } from "./fatturaHelpers";

export function FieldLabel({ children, right, htmlFor }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400"
      >
        {children}
      </label>
      {right}
    </div>
  );
}

export function SoftSection({ title, icon: Icon, children }) {
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

export function ToggleRow({ icon: Icon, title, description, checked, onChange, disabled }) {
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
        aria-label={title}
        className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700"
      />
    </div>
  );
}

const ERROR_INPUT_CN = "border-red-400 focus-visible:ring-red-200 dark:border-red-500/70";

export function RowEditor({
  riga,
  index,
  readOnly,
  onChange,
  onRemove,
  onDuplicate,
  onFieldFocus,
  canRemove,
  invalidFields = [],
}) {
  const totals = calcolaRiga(riga);
  const fieldId = (name) => `riga-${riga.localId}-${name}`;
  const errorCn = (name) => (invalidFields.includes(name) ? ` ${ERROR_INPUT_CN}` : "");

  return (
    <div
      data-row-id={riga.localId}
      onFocusCapture={onFieldFocus}
      className={[
        "rounded-2xl border bg-stone-50/70 p-3 dark:bg-stone-950/35",
        invalidFields.length > 0
          ? "border-red-300 dark:border-red-500/50"
          : "border-stone-200 dark:border-stone-800",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
          Riga {index + 1}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={readOnly}
            onClick={onDuplicate}
            className="h-8 w-8 rounded-xl text-stone-400 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)]"
            aria-label={`Duplica riga ${index + 1}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
        <div>
          <FieldLabel htmlFor={fieldId("ref")}>Ref</FieldLabel>
          <Input
            id={fieldId("ref")}
            value={riga.reference}
            disabled={readOnly}
            onChange={(event) => onChange({ reference: event.target.value })}
            className="h-10 rounded-xl border-stone-200 bg-white shadow-none dark:border-stone-800 dark:bg-stone-900"
            maxLength={50}
          />
        </div>
        <div>
          <FieldLabel htmlFor={fieldId("descrizione")}>Descrizione</FieldLabel>
          <Input
            id={fieldId("descrizione")}
            value={riga.descrizione}
            disabled={readOnly}
            onChange={(event) => onChange({ descrizione: event.target.value })}
            placeholder="Article"
            className={`h-10 rounded-xl border-stone-200 bg-white shadow-none dark:border-stone-800 dark:bg-stone-900${errorCn("descrizione")}`}
            maxLength={255}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[0.8fr_1.1fr_0.9fr_1fr_1.3fr]">
        <div>
          <FieldLabel htmlFor={fieldId("quantita")}>Qta</FieldLabel>
          <Input
            id={fieldId("quantita")}
            type="number"
            min="0.001"
            step="0.001"
            value={riga.quantita}
            disabled={readOnly}
            onChange={(event) => onChange({ quantita: event.target.value })}
            className={`h-10 rounded-xl border-stone-200 bg-white px-2 text-right shadow-none dark:border-stone-800 dark:bg-stone-900${errorCn("quantita")}`}
          />
        </div>
        <div>
          <FieldLabel htmlFor={fieldId("prezzo")}>Prezzo HT</FieldLabel>
          <Input
            id={fieldId("prezzo")}
            type="number"
            min="0"
            step="0.001"
            value={riga.prezzoUnitarioHT}
            disabled={readOnly}
            onChange={(event) => onChange({ prezzoUnitarioHT: event.target.value })}
            className={`h-10 rounded-xl border-stone-200 bg-white px-2 text-right shadow-none dark:border-stone-800 dark:bg-stone-900${errorCn("prezzoUnitarioHT")}`}
          />
        </div>
        <div>
          <FieldLabel htmlFor={fieldId("sconto")}>Sconto %</FieldLabel>
          <Input
            id={fieldId("sconto")}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={riga.scontoPercentuale}
            disabled={readOnly}
            onChange={(event) => onChange({ scontoPercentuale: event.target.value })}
            className={`h-10 rounded-xl border-stone-200 bg-white px-2 text-right shadow-none dark:border-stone-800 dark:bg-stone-900${errorCn("scontoPercentuale")}`}
          />
        </div>
        <div>
          <FieldLabel htmlFor={fieldId("tva")}>TVA</FieldLabel>
          <Select
            value={String(riga.aliquotaTVA)}
            disabled={readOnly}
            onValueChange={(value) => onChange({ aliquotaTVA: value })}
          >
            <SelectTrigger
              id={fieldId("tva")}
              className="h-10 rounded-xl border-stone-200 bg-white px-2 shadow-none dark:border-stone-800 dark:bg-stone-900"
            >
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
          <FieldLabel>Totale HT</FieldLabel>
          <div className="flex h-10 items-center justify-end overflow-hidden whitespace-nowrap rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2 text-[13px] font-semibold tabular-nums text-stone-950 dark:text-stone-100">
            {formatMoney(totals.montanteHT)}
          </div>
        </div>
      </div>
    </div>
  );
}
