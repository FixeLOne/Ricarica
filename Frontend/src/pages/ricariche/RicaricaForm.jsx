import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, MessageSquarePlus, Zap } from "lucide-react";

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
  gigaManuale:    z.string().optional(),
  costoEffettivo: z.string().optional(),
  costoCliente:   z.string().optional(),
  note:           z.string().max(255).regex(/^[^<>]*$/, "Caratteri < > non ammessi").optional().or(z.literal("")),
  boutiqueId:     z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.gigaValore === MANUALE_VALUE) {
    const gb  = parseFloat(val.gigaManuale ?? "");
    const eff = parseFloat(val.costoEffettivo ?? "");
    const cli = parseFloat(val.costoCliente ?? "");
    if (isNaN(gb) || !val.gigaManuale)
      ctx.addIssue({ path: ["gigaManuale"], code: z.ZodIssueCode.custom, message: "Obbligatorio" });
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
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium shadow-sm dark:border-stone-800 dark:bg-stone-900"
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

function GigaTile({ giga, selected, onClick, onRapid, rapidOn, hasError }) {
  const isManuale = giga === MANUALE_VALUE;

  const handleClick = () => {
    // Rapid attivo (toggle ON) e non è tile manuale → submit diretto
    if (rapidOn && !isManuale) {
      onRapid(giga);
    } else {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      className={[
        "relative flex h-14 select-none flex-col items-center justify-center rounded-xl border bg-white transition-all duration-150 cursor-pointer dark:bg-stone-950/40",
        selected
          ? "brand-soft-strong shadow-sm"
          : hasError
            ? "border-red-300 bg-red-50/40 hover:border-[var(--brand-border)] dark:border-red-400/40 dark:bg-red-500/10"
            : "border-stone-200 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:shadow-sm dark:border-stone-800 dark:hover:border-[var(--brand-border)] dark:hover:bg-[var(--brand-soft)]",
      ].join(" ")}
    >
      {isManuale ? (
        <>
          <PenLine className={`w-4 h-4 ${selected ? "text-[var(--brand-text)]" : "text-stone-400 dark:text-stone-500"}`} />
          <span className={`text-[10px] font-medium mt-0.5 ${selected ? "text-[var(--brand-text)]" : "text-stone-400 dark:text-stone-500"}`}>
            Libero
          </span>
        </>
      ) : (
        <>
          <span className={`text-sm font-bold leading-none tabular-nums ${selected ? "text-[var(--brand-text)]" : "text-stone-700 dark:text-stone-200"}`}>
            {giga}
          </span>
          <span className={`text-[10px] font-medium leading-none mt-1 ${selected ? "text-[var(--brand-text)] opacity-70" : "text-stone-400 dark:text-stone-500"}`}>
            GB
          </span>
          {/* Pallino indicatore rapid attivo */}
          {rapidOn && (
            <span className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-[var(--brand-primary)]" />
          )}
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

  const [rapidMode, setRapidMode]   = useState(() => localStorage.getItem("ricarica_rapid") === "1");
  const [noteAperte, setNoteAperte] = useState(isModifica && !!defaultValues?.note);

  // Legge boutique salvata dal localStorage per inizializzare il form già popolato
  const savedBoutique = !isModifica && ruolo !== "DIPENDENTE"
    ? (localStorage.getItem(BOUTIQUE_KEY) ?? "")
    : "";

  const { register, handleSubmit, watch, setValue, control,
    formState: { errors }, reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      numero: "", gigaValore: "", gigaManuale: "",
      costoEffettivo: "", costoCliente: "", note: "",
      boutiqueId: savedBoutique,
    },
  });

  const gigaValore = watch("gigaValore");
  const numero     = watch("numero");
  const isManuale  = gigaValore === MANUALE_VALUE;

  // Rapid attivo: toggle ON (non dipende dalla lunghezza del numero — valida handleSubmit)
  const numeroPronto = /^\d{8}$/.test(numero ?? "");
  const rapidInAttesa = rapidMode && !isModifica && !numeroPronto;
  const rapidOn = rapidMode && !isModifica && numeroPronto;

  const gigaUnici = useMemo(() =>
    [...new Set(tariffe.map(t => parseFloat(t.giga)))].sort((a, b) => a - b),
    [tariffe]
  );

  const tariffeShorcut = useMemo(() => gigaUnici.slice(0, 9), [gigaUnici]);
  const submitRef = useRef(null);

  // Rapid submit: imposta il piano e invia
  const handleRapid = useCallback((giga) => {
    setValue("gigaValore", String(giga), { shouldValidate: true });
    setTimeout(() => submitRef.current?.(), 0);
  }, [setValue]);

  useEffect(() => {
    if (isModifica) return;
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const isDialogOpen = !!document.querySelector("[role='dialog']");

      if (e.key === "Escape" && !isDialogOpen) {
        e.preventDefault();
        reset({
          numero: "", gigaValore: "", gigaManuale: "",
          costoEffettivo: "", costoCliente: "", note: "",
          boutiqueId: localStorage.getItem(BOUTIQUE_KEY) ?? "",
        });
        setNoteAperte(false);
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

  const handleNumeroChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
    setValue("numero", val, { shouldValidate: false });
  };

  // NON resetta il form qui — il reset avviene solo sul remount via formKey (successo)
  // In caso di errore API il form mantiene tutti i valori inseriti
  const internalSubmit = useCallback((data) => {
    onSubmit(data);
  }, [onSubmit]);

  const wrappedSubmit = handleSubmit(internalSubmit);
  useEffect(() => { submitRef.current = wrappedSubmit; });

  const inputCn    = "h-10 rounded-xl border-stone-200 bg-white text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-50 dark:shadow-none";
  const numInputCn = `${inputCn} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
  const labelCn    = "text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit(internalSubmit)} noValidate className="space-y-4">

      {/* Riga 1: Numero + Boutique admin */}
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

        {/* Boutique — solo admin */}
        {ruolo !== "DIPENDENTE" && boutiques.length > 0 && (
          <div className="w-44">
            <Label className={`${labelCn} mb-1.5 block`}>Boutique ricarica</Label>
            <Controller name="boutiqueId" control={control} render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => { field.onChange(v); localStorage.setItem(BOUTIQUE_KEY, v); }}
              >
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

      {/* Riga 2: Label piano + toggle rapid */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label className={labelCn}>Piano</Label>
          {errors.gigaValore && (
            <span className="text-[11px] text-red-500">{errors.gigaValore.message}</span>
          )}

          {/* Toggle rapid — visibile solo nel form di creazione */}
          {!isModifica && (
            <button
              type="button"
              onClick={() => setRapidMode(v => { const next = !v; localStorage.setItem("ricarica_rapid", next ? "1" : "0"); return next; })}
              className={[
                "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all duration-150 cursor-pointer select-none",
                rapidOn
                  ? "brand-primary"
                  : rapidInAttesa
                    ? "brand-soft ring-1 ring-[var(--brand-border)]"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700",
              ].join(" ")}
              aria-pressed={rapidMode}
              title={rapidInAttesa ? "Rapid attivo: inserisci 8 cifre" : "Rapid: clicca un piano per salvare subito"}
            >
              <Zap className="w-2.5 h-2.5" />
              Rapid
            </button>
          )}
        </div>

        {/* Tile piani — grid adattivo */}
        {tariffe.length === 0 ? (
          <p className="text-xs text-stone-400 py-3">Caricamento piani…</p>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))" }}>
            {gigaUnici.map((g, i) => (
              <GigaTile
                key={g}
                giga={g}
                shortcutIdx={i < 9 ? i : undefined}
                selected={gigaValore === String(g)}
                hasError={!!errors.gigaValore}
                rapidOn={rapidOn}
                onClick={() => setValue("gigaValore", String(g), { shouldValidate: true })}
                onRapid={handleRapid}
              />
            ))}
            <GigaTile
              key="manuale"
              giga={MANUALE_VALUE}
              selected={gigaValore === MANUALE_VALUE}
              hasError={!!errors.gigaValore}
              rapidOn={false}
              onClick={() => setValue("gigaValore", MANUALE_VALUE, { shouldValidate: true })}
              onRapid={() => {}}
            />
          </div>
        )}
      </div>

      {/* Riga 3: Campi libero — slide-in */}
      <AnimatePresence initial={false}>
        {isManuale && (
          <motion.div
            key="manuale"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
              <p className="text-xs text-[var(--brand-text)] mb-3">
                Inserimento libero — specifica giga e prezzi manualmente.
              </p>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Giga</Label>
                  <Input
                    autoFocus
                    type="number" step="1" min="1" placeholder="es. 30"
                    className={`${numInputCn} w-28 ${errors.gigaManuale ? "border-red-400" : ""}`}
                    {...register("gigaManuale")}
                  />
                  {errors.gigaManuale && <p className="mt-1 text-[11px] text-red-500">{errors.gigaManuale.message}</p>}
                </div>
                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Costo effettivo (DT)</Label>
                  <Input
                    type="number" step="0.001" min="0" placeholder="0.000"
                    className={`${numInputCn} no-spinner w-36 ${errors.costoEffettivo ? "border-red-400" : ""}`}
                    {...register("costoEffettivo")}
                  />
                  {errors.costoEffettivo && <p className="mt-1 text-[11px] text-red-500">{errors.costoEffettivo.message}</p>}
                </div>
                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Prezzo cliente (DT)</Label>
                  <Input
                    type="number" step="0.001" min="0" placeholder="0.000"
                    className={`${numInputCn} no-spinner w-36 ${errors.costoCliente ? "border-red-400" : ""}`}
                    {...register("costoCliente")}
                  />
                  {errors.costoCliente && <p className="mt-1 text-[11px] text-red-500">{errors.costoCliente.message}</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Riga 4: Note espandibili */}
      <div>
        <button
          type="button"
          onClick={() => setNoteAperte(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 transition-colors cursor-pointer hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          {noteAperte ? "Rimuovi nota" : "Aggiungi nota"}
        </button>

        <AnimatePresence initial={false}>
          {noteAperte && (
            <motion.div
              key="note"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <textarea
                rows={3}
                placeholder="Note aggiuntive sulla ricarica…"
                className={[
                  "mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm",
                  "bg-white dark:bg-stone-950/60 border-stone-200 dark:border-stone-800",
                  "text-stone-900 dark:text-stone-50 placeholder:text-stone-400",
                  "shadow-inner shadow-stone-200/40 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] focus:border-[var(--brand-border)]",
                  errors.note ? "border-red-400" : "",
                ].join(" ")}
                {...register("note")}
              />
              {errors.note && <p className="mt-1 text-[11px] text-red-500">{errors.note.message}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Riga 5: Submit */}
      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="brand-primary h-10 min-w-[120px] rounded-xl font-semibold cursor-pointer"
        >
          {isSubmitting ? "Salvataggio…" : submitLabel}
        </Button>
      </div>

    </form>
  );
}
