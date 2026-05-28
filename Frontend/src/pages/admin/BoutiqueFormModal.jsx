import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, KeyRound, MapPin, Store, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const baseSchema = {
  nome: z.string().trim().min(2, "Inserisci almeno 2 caratteri").max(100, "Massimo 100 caratteri"),
  citta: z.string().trim().min(2, "Inserisci almeno 2 caratteri").max(100, "Massimo 100 caratteri"),
  fattureAbilitate: z.boolean(),
};

const creaSchema = z.object({
  ...baseSchema,
  nomeAccount: z.string().trim().min(2, "Inserisci il nome dell'account"),
  usernameAccount: z.string().trim().min(3, "Minimo 3 caratteri").max(50, "Massimo 50 caratteri"),
  passwordAccount: z.string().min(8, "Minimo 8 caratteri"),
});

const modificaSchema = z.object(baseSchema);

const emptyValues = {
  nome: "",
  citta: "",
  nomeAccount: "",
  usernameAccount: "",
  passwordAccount: "",
  fattureAbilitate: false,
};

function toFormValues(boutique) {
  return {
    ...emptyValues,
    nome: boutique?.nome ?? "",
    citta: boutique?.citta ?? boutique?.["città"] ?? "",
    fattureAbilitate: Boolean(boutique?.fattureAbilitate),
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

export default function BoutiqueFormModal({
  boutique,
  open,
  onClose,
  onSave,
  isSubmitting,
  serverError,
}) {
  const isEdit = Boolean(boutique);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? modificaSchema : creaSchema),
    defaultValues: toFormValues(boutique),
  });

  useEffect(() => {
    if (open) reset(toFormValues(boutique));
  }, [boutique, open, reset]);

  if (!open) return null;

  const inputCn = "h-10 rounded-xl border-stone-200 bg-white pl-10 text-stone-900 shadow-inner shadow-stone-200/40 placeholder:text-stone-400 focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-50 dark:shadow-none";
  const labelCn = "text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400";

  const submit = (values) => {
    onSave({
      nome: values.nome.trim(),
      "città": values.citta.trim(),
      ...(isEdit
        ? {}
        : {
            nomeAccount: values.nomeAccount.trim(),
            usernameAccount: values.usernameAccount.trim(),
            passwordAccount: values.passwordAccount,
          }),
      fattureAbilitate: values.fattureAbilitate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_26px_70px_-42px_rgba(15,23,42,0.65)] dark:border-stone-800 dark:bg-stone-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-stone-200/70 bg-[var(--brand-soft)] px-5 py-4 dark:border-stone-800">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
              {isEdit ? "Modifica boutique" : "Nuova boutique"}
            </p>
            <h2 className="text-base font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              {isEdit ? boutique.nome : "Aggiungi un punto vendita"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-white/70 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={`${labelCn} mb-1.5 block`}>Nome boutique</Label>
              <div className="relative">
                <FieldIcon icon={Store} />
                <Input
                  className={`${inputCn} ${errors.nome ? "border-red-400" : ""}`}
                  placeholder="Boutique A1"
                  {...register("nome")}
                />
              </div>
              {fieldError(errors.nome)}
            </div>

            <div>
              <Label className={`${labelCn} mb-1.5 block`}>Città</Label>
              <div className="relative">
                <FieldIcon icon={MapPin} />
                <Input
                  className={`${inputCn} ${errors.citta ? "border-red-400" : ""}`}
                  placeholder="Tunisi"
                  {...register("citta")}
                />
              </div>
              {fieldError(errors.citta)}
            </div>
          </div>

          <Controller
            name="fattureAbilitate"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/35">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Fatture abilitate</p>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    Permette alla boutique di usare i dati azienda per le fatture.
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700"
                />
              </div>
            )}
          />

          {!isEdit && (
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/60">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Account dipendente</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Creato insieme alla boutique.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Nome account</Label>
                  <div className="relative">
                    <FieldIcon icon={User} />
                    <Input
                      className={`${inputCn} bg-white/85 ${errors.nomeAccount ? "border-red-400" : ""}`}
                      placeholder="Operatore A1"
                      {...register("nomeAccount")}
                    />
                  </div>
                  {fieldError(errors.nomeAccount)}
                </div>

                <div>
                  <Label className={`${labelCn} mb-1.5 block`}>Username</Label>
                  <div className="relative">
                    <FieldIcon icon={User} />
                    <Input
                      className={`${inputCn} bg-white/85 ${errors.usernameAccount ? "border-red-400" : ""}`}
                      placeholder="boutique.a1"
                      autoComplete="username"
                      {...register("usernameAccount")}
                    />
                  </div>
                  {fieldError(errors.usernameAccount)}
                </div>

                <div className="sm:col-span-2">
                  <Label className={`${labelCn} mb-1.5 block`}>Password temporanea</Label>
                  <div className="relative">
                    <FieldIcon icon={KeyRound} />
                    <Input
                      type="password"
                      className={`${inputCn} bg-white/85 ${errors.passwordAccount ? "border-red-400" : ""}`}
                      placeholder="Minimo 8 caratteri"
                      autoComplete="new-password"
                      {...register("passwordAccount")}
                    />
                  </div>
                  {fieldError(errors.passwordAccount)}
                </div>
              </div>
            </div>
          )}

          {serverError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="brand-primary h-9 min-w-[118px] rounded-xl font-semibold"
            >
              {isSubmitting ? "Salvataggio..." : isEdit ? "Salva" : "Crea boutique"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
