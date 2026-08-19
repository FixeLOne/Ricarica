import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  operatore:     z.string().min(1, "Seleziona un operatore"),
  giga:          z.string().refine(v => parseFloat(v) > 0, "Deve essere > 0"),
  costoAcquisto: z.string().refine(v => parseFloat(v) > 0, "Deve essere > 0"),
  prezzoVendita: z.string().refine(v => parseFloat(v) > 0, "Deve essere > 0"),
}).refine(d => parseFloat(d.prezzoVendita) >= parseFloat(d.costoAcquisto), {
  path: ["prezzoVendita"],
  message: "Non può essere inferiore al costo acquisto",
});

const OPERATORI_OPTIONS = [
  { value: "OOREDOO", label: "Ooredoo" },
  { value: "ORANGE",  label: "Orange"  },
  { value: "TELECOM", label: "Telecom" },
  { value: "FISSO",   label: "Fisso"   },
  { value: "DEFAULT", label: "Default" },
];

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function TariffaModal({ tariffa, onSave, onClose, isSubmitting, serverError }) {
  const isModifica = !!tariffa;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      operatore:     tariffa?.operatore ?? "DEFAULT",
      giga:          tariffa ? String(parseFloat(tariffa.giga)) : "",
      costoAcquisto: tariffa ? parseFloat(tariffa.costoAcquisto).toFixed(3) : "",
      prezzoVendita: tariffa ? parseFloat(tariffa.prezzoVendita).toFixed(3) : "",
    },
  });

  // Ricarica i valori se cambia la tariffa aperta
  useEffect(() => {
    reset({
      operatore:     tariffa?.operatore ?? "DEFAULT",
      giga:          tariffa ? String(parseFloat(tariffa.giga)) : "",
      costoAcquisto: tariffa ? parseFloat(tariffa.costoAcquisto).toFixed(3) : "",
      prezzoVendita: tariffa ? parseFloat(tariffa.prezzoVendita).toFixed(3) : "",
    });
  }, [tariffa, reset]);

  const inputCn  = "h-10 rounded-xl border-stone-200 bg-white text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-50 dark:shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const labelCn  = "text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider";

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-white shadow-md dark:border-stone-800 dark:bg-stone-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-stone-200/70 bg-stone-50/80 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/40">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            {isModifica ? "Modifica tariffa" : "Aggiungi tariffa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} noValidate className="p-5 space-y-4">

          {/* Operatore */}
          <div>
            <Label className={`${labelCn} mb-1.5 block`}>Operatore</Label>
            <Controller name="operatore" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={`${inputCn} w-full`}>
                  <SelectValue placeholder="Seleziona…" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORI_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.operatore && <p className="mt-1 text-[11px] text-red-500">{errors.operatore.message}</p>}
          </div>

          {/* Giga */}
          <div>
            <Label className={`${labelCn} mb-1.5 block`}>Giga</Label>
            <Input
              type="number" step="1" min="1" placeholder="es. 25"
              className={`${inputCn} w-full ${errors.giga ? "border-red-400" : ""}`}
              {...register("giga")}
            />
            {errors.giga && <p className="mt-1 text-[11px] text-red-500">{errors.giga.message}</p>}
          </div>

          {/* Costo acquisto + Prezzo vendita */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className={`${labelCn} mb-1.5 block`}>Costo acquisto (DT)</Label>
              <Input
                type="number" step="0.001" min="0" placeholder="0.000"
                className={`${inputCn} no-spinner w-full ${errors.costoAcquisto ? "border-red-400" : ""}`}
                {...register("costoAcquisto")}
              />
              {errors.costoAcquisto && <p className="mt-1 text-[11px] text-red-500">{errors.costoAcquisto.message}</p>}
            </div>
            <div className="flex-1">
              <Label className={`${labelCn} mb-1.5 block`}>Prezzo cliente (DT)</Label>
              <Input
                type="number" step="0.001" min="0" placeholder="0.000"
                className={`${inputCn} no-spinner w-full ${errors.prezzoVendita ? "border-red-400" : ""}`}
                {...register("prezzoVendita")}
              />
              {errors.prezzoVendita && <p className="mt-1 text-[11px] text-red-500">{errors.prezzoVendita.message}</p>}
            </div>
          </div>

          {/* Errore server */}
          {serverError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-xl border-stone-200 text-stone-700 dark:border-stone-800 dark:text-stone-300"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="brand-primary h-9 min-w-[100px] rounded-xl font-semibold"
            >
              {isSubmitting ? "Salvataggio…" : isModifica ? "Salva" : "Aggiungi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
