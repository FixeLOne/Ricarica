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
  costoAcquisto: z.string().refine(v => parseFloat(v) >= 0, "Valore non valido"),
  prezzoVendita: z.string().refine(v => parseFloat(v) >= 0, "Valore non valido"),
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

  const inputCn  = "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-50 h-10 rounded-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const labelCn  = "text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider";

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-700/60">
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
                className={`${inputCn} w-full ${errors.costoAcquisto ? "border-red-400" : ""}`}
                {...register("costoAcquisto")}
              />
              {errors.costoAcquisto && <p className="mt-1 text-[11px] text-red-500">{errors.costoAcquisto.message}</p>}
            </div>
            <div className="flex-1">
              <Label className={`${labelCn} mb-1.5 block`}>Prezzo cliente (DT)</Label>
              <Input
                type="number" step="0.001" min="0" placeholder="0.000"
                className={`${inputCn} w-full ${errors.prezzoVendita ? "border-red-400" : ""}`}
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
              className="border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 h-9 rounded-lg"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-stone-900 text-white h-9 min-w-[100px] rounded-lg font-semibold"
            >
              {isSubmitting ? "Salvataggio…" : isModifica ? "Salva" : "Aggiungi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
