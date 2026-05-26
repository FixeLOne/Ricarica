import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine } from "lucide-react";

import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { COLORI_OPERATORE, operatoreDaNumero } from "@/lib/operatori";
import { MANUALE_VALUE, BOUTIQUE_KEY } from "@/hooks/useRicariche";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  numero:         z.string().length(8, "8 cifre richieste").regex(/^\d+$/, "Solo cifre"),
  gigaValore:     z.string().min(1, "Seleziona un piano"),
  costoEffettivo: z.string().optional(),
  costoCliente:   z.string().optional(),
  note:           z.string().max(255).regex(/^[^<>]*$/, "Caratteri < > non ammessi").optional().or(z.literal("")),
  boutiqueId:     z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.gigaValore === MANUALE_VALUE) {
    const eff = parseFloat(val.costoEffettivo ?? "");
    const cli = parseFloat(val.costoCliente ?? "");
    if (isNaN(eff) || val.costoEffettivo === "")
      ctx.addIssue({ path: ["costoEffettivo"], code: z.ZodIssueCode.custom, message: "Obbligatorio" });
    if (isNaN(cli) || val.costoCliente === "")
      ctx.addIssue({ path: ["costoCliente"], code: z.ZodIssueCode.custom, message: "Obbligatorio" });
    if (!isNaN(eff) && !isNaN(cli) && eff > cli)
      ctx.addIssue({ path: ["costoEffettivo"], code: z.ZodIssueCode.custom, message: "Non può superare il prezzo cliente" });
  }
});

// ─── Colori brand ─────────────────────────────────────────────────────────────

const DOT_BRAND = { OOREDOO: "#E30613", ORANGE: "#FF6600", TELECOM: "#003DA5", FISSO: "#0891b2" };

// ─── Badge operatore ──────────────────────────────────────────────────────────

function BadgeOperatore({ numero }) {
  const op = operatoreDaNumero(numero);
  return (
    <AnimatePresence initial={false}>
      {op && (
        <motion.span
          key={op}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700/80 text-[11px] font-medium"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: DOT_BRAND[op] ?? "#a8a29e" }}
          />
          <span className={COLORI_OPERATORE[op]?.text ?? "text-stone-500"}>
            {op.charAt(0) + op.slice(1).toLowerCase()}
          </span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ─── Tile piano giga ──────────────────────────────────────────────────────────

function GigaTile({ giga, shortcutIdx, selected, onClick, hasError }) {
  const isManuale = giga === MANUALE_VALUE;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-150 select-none cursor-pointer shrink-0",
        "w-[60px] h-14",
        selected
          ? "border-amber-500 dark:border-amber-400 bg-amber-500/10 dark:bg-amber-400/10"
          : hasError
            ? "border-red-400/60 hover:border-amber-400/50 hover:scale-[1.04]"
            : "border-stone-200 dark:border-stone-700 hover:border-amber-400/50 hover:scale-[1.04]",
      ].join(" ")}
    >
      {isManuale ? (
        <>
          <PenLine className={`w-4 h-4 ${selected ? "text-amber-500 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`} />
          <span className={`text-[10px] font-medium mt-0.5 ${selected ? "text-amber-500 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`}>
            Libero
          </span>
        </>
      ) : (
        <>
          <span className={`text-sm font-bold leading-none tabular-nums ${selected ? "text-amber-500 dark:text-amber-400" : "text-stone-700 dark:text-stone-200"}`}>
            {giga}
          </span>
          <span className={`text-[10px] font-medium leading-none mt-1 ${selected ? "text-amber-500/70 dark:text-amber-400/70" : "text-stone-400 dark:text-stone-500"}`}>
            GB
          </span>
        </>
      )}
    </button>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function RicaricaForm({
  onSubmit, defaultValues, tariffe, boutiques,
  ruolo, isSubmitting, submitLabel = "Salva",
}) {
  const isModifica = !!defaultValues;

  const { register, handleSubmit, watch, setValue, control,
    formState: { errors }, reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      numero: "", gigaValore: "", costoEffettivo: "", costoCliente: "", note: "", boutiqueId: "",
    },
  });

  const gigaValore = watch("gigaValore");
  const numero     = watch("numero");
  const isManuale  = gigaValore === MANUALE_VALUE;

  const gigaUnici = useMemo(() =>
    [...new Set(tariffe.map(t => parseFloat(t.giga)))].sort((a, b) => a - b),
    [tariffe]
  );

  const tariffeShorcut = useMemo(() => gigaUnici.slice(0, 9), [gigaUnici]);
  const submitRef = useRef(null);

  useEffect(() => {
    if (isModifica) return;
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const isDialogOpen = !!document.querySelector("[role='dialog']");

      if (e.key === "Escape" && !isDialogOpen) {
        e.preventDefault();
        reset({ numero: "", gigaValore: "", costoEffettivo: "", costoCliente: "", note: "", boutiqueId: "" });
        return;
      }
      if (isInput) return;
      const idx = parseInt(e.key, 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < tariffeShorcut.length) {
        e.preventDefault();
        setValue("gigaValore", String(tariffeShorcut[idx]), { shouldValidate: true });
        return;
      }
      if (e.key === "Enter" && submitRef.current && !isDialogOpen) {
        submitRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isModifica, tariffeShorcut, reset, setValue]);

  useEffect(() => {
    if (ruolo !== "DIPENDENTE" && !defaultValues?.boutiqueId) {
      const saved = localStorage.getItem(BOUTIQUE_KEY);
      if (saved) setValue("boutiqueId", saved);
    }
  }, []);

  const handleNumeroChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
    setValue("numero", val, { shouldValidate: false });
  };

  const internalSubmit = useCallback((data) => {
    onSubmit(data);
    if (!isModifica) {
      reset({ numero: "", gigaValore: "", costoEffettivo: "", costoCliente: "", note: "", boutiqueId: data.boutiqueId });
    }
  }, [onSubmit, isModifica, reset]);

  const wrappedSubmit = handleSubmit(internalSubmit);
  useEffect(() => { submitRef.current = wrappedSubmit; });

  const inputCn   = "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-50 h-10 rounded-lg";
  const numInputCn = `${inputCn} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
  const labelCn   = "text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit(internalSubmit)} noValidate className="space-y-4">

      {/* Riga 1: Numero + Note (+ Boutique admin) */}
      <div className="flex flex-wrap gap-3 items-start">

        {/* Numero */}
        <div className="w-48">
          <div className="flex items-center gap-2 mb-1.5">
            <Label className={labelCn}>Numero</Label>
            <BadgeOperatore numero={numero} />
          </div>
          <Input
            autoFocus={!isModifica}
            inputMode="numeric"
            placeholder="00 000 000"
            maxLength={8}
            value={numero}
            onChange={handleNumeroChange}
            className={`${inputCn} font-mono text-base tracking-[0.18em] ${errors.numero ? "border-red-400" : ""}`}
          />
          {errors.numero && (
            <p className="mt-1 text-[11px] text-red-500">{errors.numero.message}</p>
          )}
        </div>

        {/* Note */}
        <div className="flex-1 min-w-[160px] max-w-sm">
          <Label className={`${labelCn} mb-1.5 block`}>
            Note <span className="normal-case font-normal text-stone-300 dark:text-stone-600">(opz.)</span>
          </Label>
          <Input
            placeholder="Aggiungi nota…"
            className={`${inputCn} ${errors.note ? "border-red-400" : ""}`}
            {...register("note")}
          />
          {errors.note && <p className="mt-1 text-[11px] text-red-500">{errors.note.message}</p>}
        </div>

        {/* Boutique — solo admin */}
        {ruolo !== "DIPENDENTE" && boutiques.length > 0 && (
          <div className="w-44">
            <Label className={`${labelCn} mb-1.5 block`}>Boutique</Label>
            <Controller name="boutiqueId" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => { field.onChange(v); localStorage.setItem(BOUTIQUE_KEY, v); }}>
                <SelectTrigger className={`${inputCn} w-full`}>
                  <SelectValue placeholder="Seleziona…" />
                </SelectTrigger>
                <SelectContent>
                  {boutiques.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
        )}
      </div>

      {/* Riga 2: Tile piani */}
      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <Label className={labelCn}>Piano</Label>
          {errors.gigaValore && (
            <span className="text-[11px] text-red-500">{errors.gigaValore.message}</span>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {tariffe.length === 0 ? (
            <p className="text-xs text-stone-400 py-3">Caricamento piani…</p>
          ) : (
            <>
              {gigaUnici.map((g, i) => (
                <GigaTile
                  key={g}
                  giga={g}
                  shortcutIdx={i < 9 ? i : undefined}
                  selected={gigaValore === String(g)}
                  hasError={!!errors.gigaValore}
                  onClick={() => setValue("gigaValore", String(g), { shouldValidate: true })}
                />
              ))}
              <GigaTile
                key="manuale"
                giga={MANUALE_VALUE}
                selected={gigaValore === MANUALE_VALUE}
                hasError={!!errors.gigaValore}
                onClick={() => setValue("gigaValore", MANUALE_VALUE, { shouldValidate: true })}
              />
            </>
          )}

          {/* Bottone allineato in basso a destra delle tile */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-stone-900 text-white h-14 min-w-[110px] rounded-xl font-semibold"
          >
            {isSubmitting ? "…" : submitLabel}
          </Button>
        </div>
      </div>

      {/* Riga 3: Prezzi manuali — slide-in */}
      <AnimatePresence initial={false}>
        {isManuale && (
          <motion.div
            key="manuale"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="pt-3 border-t border-stone-100 dark:border-stone-700/60">
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
                Prezzi manuali — il listino tariffe non verrà applicato.
              </p>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Costo effettivo (DT)</Label>
                  <Input
                    autoFocus
                    type="number" step="0.001" min="0" placeholder="0.000"
                    className={`${numInputCn} w-36 ${errors.costoEffettivo ? "border-red-400" : ""}`}
                    {...register("costoEffettivo")}
                  />
                  {errors.costoEffettivo && <p className="mt-1 text-[11px] text-red-500">{errors.costoEffettivo.message}</p>}
                </div>
                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Prezzo cliente (DT)</Label>
                  <Input
                    type="number" step="0.001" min="0" placeholder="0.000"
                    className={`${numInputCn} w-36 ${errors.costoCliente ? "border-red-400" : ""}`}
                    {...register("costoCliente")}
                  />
                  {errors.costoCliente && <p className="mt-1 text-[11px] text-red-500">{errors.costoCliente.message}</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </form>
  );
}
