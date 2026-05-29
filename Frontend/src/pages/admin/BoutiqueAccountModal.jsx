import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getAccountBoutique,
  modificaCredenzialiAccountBoutique,
  modificaStatoAccountBoutique,
  resetPasswordAccountBoutique,
} from "@/api/boutiqueApi";

const passwordField = z
  .string()
  .min(8, "Minimo 8 caratteri")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Massimo 72 byte");

const passwordSchema = z
  .object({
    nuovaPassword: passwordField,
    confermaPassword: z.string().min(8, "Conferma la password"),
  })
  .refine((values) => values.nuovaPassword === values.confermaPassword, {
    path: ["confermaPassword"],
    message: "Le password non coincidono",
  });

const credentialsSchema = z
  .object({
    username: z.string().trim().min(3, "Minimo 3 caratteri").max(50, "Massimo 50 caratteri"),
    password: passwordField,
    confermaPassword: z.string().min(8, "Conferma la password"),
  })
  .refine((values) => values.password === values.confermaPassword, {
    path: ["confermaPassword"],
    message: "Le password non coincidono",
  });

function getApiError(error) {
  return (
    error?.response?.data?.errore ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === "string" ? error.response.data : null) ||
    "Operazione non riuscita"
  );
}

function createPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#?_-";
  const bytes = new Uint32Array(18);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  }

  return Array.from({ length: 18 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
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

function PasswordInput({ register, name, placeholder, visible, onToggle, error }) {
  const inputCn = [
    "h-10 rounded-xl border-stone-200 bg-white pl-10 pr-10 text-stone-900 shadow-inner shadow-stone-200/40",
    "placeholder:text-stone-400 focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
    "dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-50 dark:shadow-none",
    error ? "border-red-400" : "",
  ].join(" ");

  return (
    <div className="relative">
      <FieldIcon icon={KeyRound} />
      <Input
        type={visible ? "text" : "password"}
        className={inputCn}
        placeholder={placeholder}
        autoComplete="new-password"
        {...register(name)}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 rounded-lg p-1.5 text-stone-400 transition-colors -translate-y-1/2 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        aria-label={visible ? "Nascondi password" : "Mostra password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ActionButton({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-h-[76px] items-center gap-3 rounded-2xl border px-3 text-left transition-colors",
        active
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)]"
          : "border-stone-200 bg-stone-50/70 text-stone-700 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/35 dark:text-stone-300",
      ].join(" ")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-stone-900/80">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">{description}</span>
      </span>
    </button>
  );
}

export default function BoutiqueAccountModal({ boutique, open, onClose }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mode, setMode] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [statoSubmitting, setStatoSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { nuovaPassword: "", confermaPassword: "" },
  });

  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { username: "", password: "", confermaPassword: "" },
  });

  const resetPasswordForm = passwordForm.reset;
  const resetCredentialsForm = credentialsForm.reset;

  const labelCn = "text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400";
  const usernameInputCn = [
    "h-10 rounded-xl border-stone-200 bg-white pl-10 text-stone-900 shadow-inner shadow-stone-200/40",
    "placeholder:text-stone-400 focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
    "dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-50 dark:shadow-none",
    credentialsForm.formState.errors.username ? "border-red-400" : "",
  ].join(" ");

  const isBusy = loading || submitting || statoSubmitting;

  const accountStatus = useMemo(() => {
    if (!account) return null;
    return account.attivo
      ? { label: "Account attivo", cn: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" }
      : { label: "Account bloccato", cn: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300" };
  }, [account]);

  useEffect(() => {
    if (!open || !boutique?.id) return undefined;

    let ignore = false;

    async function loadAccount() {
      setLoading(true);
      setApiError(null);
      setSuccess(null);
      setMode("password");
      setShowPassword(false);
      setShowConfirm(false);
      resetPasswordForm({ nuovaPassword: "", confermaPassword: "" });
      resetCredentialsForm({ username: "", password: "", confermaPassword: "" });

      try {
        const response = await getAccountBoutique(boutique.id);
        if (ignore) return;
        setAccount(response.data);
        resetCredentialsForm({
          username: response.data?.username ?? "",
          password: "",
          confermaPassword: "",
        });
      } catch (error) {
        if (!ignore) setApiError(getApiError(error));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadAccount();
    return () => {
      ignore = true;
    };
  }, [boutique?.id, open, resetCredentialsForm, resetPasswordForm]);

  if (!open || !boutique) return null;

  const applyPasswordToForm = (form, passwordField) => {
    const password = createPassword();
    form.setValue(passwordField, password, { shouldDirty: true, shouldValidate: true });
    form.setValue("confermaPassword", password, { shouldDirty: true, shouldValidate: true });
    setShowPassword(true);
    setShowConfirm(true);
  };

  const submitPassword = async (values) => {
    setSubmitting(true);
    setApiError(null);
    setSuccess(null);
    try {
      const response = await resetPasswordAccountBoutique(boutique.id, values.nuovaPassword);
      setAccount(response.data);
      passwordForm.reset({ nuovaPassword: "", confermaPassword: "" });
      setSuccess("Password aggiornata. Il vecchio accesso non e piu valido.");
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const submitCredentials = async (values) => {
    setSubmitting(true);
    setApiError(null);
    setSuccess(null);
    try {
      const response = await modificaCredenzialiAccountBoutique(boutique.id, {
        username: values.username.trim(),
        password: values.password,
      });
      setAccount(response.data);
      credentialsForm.reset({
        username: response.data?.username ?? "",
        password: "",
        confermaPassword: "",
      });
      setSuccess("Credenziali aggiornate. I vecchi token sono stati revocati.");
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAccount = async (checked) => {
    setStatoSubmitting(true);
    setApiError(null);
    setSuccess(null);
    try {
      const response = await modificaStatoAccountBoutique(boutique.id, checked);
      setAccount(response.data);
      setSuccess(checked ? "Account riattivato." : "Account bloccato.");
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setStatoSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 p-4 backdrop-blur-[2px]"
      onClick={() => !isBusy && onClose()}
    >
      <div
        className="max-h-[92vh] w-full max-w-[620px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_26px_70px_-42px_rgba(15,23,42,0.65)] dark:border-stone-800 dark:bg-stone-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-stone-200/70 bg-[var(--brand-soft)] px-5 py-4 dark:border-stone-800">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
              Account boutique
            </p>
            <h2 className="truncate text-base font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              {boutique.nome}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-white/70 hover:text-stone-700 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-5">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50/70 dark:border-stone-800 dark:bg-stone-950/35">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-text)]" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/35">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--brand-border)] bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/80">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {account?.username ?? "Account non disponibile"}
                        </p>
                        {accountStatus && (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${accountStatus.cn}`}>
                            {accountStatus.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        {account?.nome ?? "Account operativo della boutique"}
                      </p>
                    </div>
                  </div>

                  {account && (
                    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-900">
                      <Power className="h-3.5 w-3.5 text-stone-400" />
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                        {account.attivo ? "Attivo" : "Bloccato"}
                      </span>
                      <Switch
                        checked={account.attivo}
                        disabled={statoSubmitting}
                        onCheckedChange={toggleAccount}
                        className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700"
                        aria-label="Stato account boutique"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <ActionButton
                  active={mode === "password"}
                  icon={KeyRound}
                  title="Reset password"
                  description="Mantiene lo username attuale"
                  onClick={() => setMode("password")}
                />
                <ActionButton
                  active={mode === "credentials"}
                  icon={User}
                  title="Credenziali"
                  description="Cambia username e password"
                  onClick={() => setMode("credentials")}
                />
              </div>

              {apiError && (
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

              {mode === "password" ? (
                <form onSubmit={passwordForm.handleSubmit(submitPassword)} noValidate className="space-y-4 rounded-2xl border border-stone-200 p-4 dark:border-stone-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">Nuova password</p>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Revoca subito i token esistenti.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyPasswordToForm(passwordForm, "nuovaPassword")}
                      className="h-8 rounded-xl border-stone-200 px-3 text-xs font-semibold dark:border-stone-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Genera
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className={`${labelCn} mb-1.5 block`}>Password</Label>
                      <PasswordInput
                        register={passwordForm.register}
                        name="nuovaPassword"
                        placeholder="Minimo 8 caratteri"
                        visible={showPassword}
                        onToggle={() => setShowPassword((value) => !value)}
                        error={passwordForm.formState.errors.nuovaPassword}
                      />
                      {fieldError(passwordForm.formState.errors.nuovaPassword)}
                    </div>
                    <div>
                      <Label className={`${labelCn} mb-1.5 block`}>Conferma</Label>
                      <PasswordInput
                        register={passwordForm.register}
                        name="confermaPassword"
                        placeholder="Ripeti password"
                        visible={showConfirm}
                        onToggle={() => setShowConfirm((value) => !value)}
                        error={passwordForm.formState.errors.confermaPassword}
                      />
                      {fieldError(passwordForm.formState.errors.confermaPassword)}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting || !account} className="brand-primary h-9 min-w-[132px] rounded-xl font-semibold">
                      {submitting ? "Salvo..." : "Aggiorna password"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={credentialsForm.handleSubmit(submitCredentials)} noValidate className="space-y-4 rounded-2xl border border-stone-200 p-4 dark:border-stone-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">Credenziali complete</p>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Sostituisce l'accesso corrente del punto vendita.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyPasswordToForm(credentialsForm, "password")}
                      className="h-8 rounded-xl border-stone-200 px-3 text-xs font-semibold dark:border-stone-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Genera
                    </Button>
                  </div>

                  <div>
                    <Label className={`${labelCn} mb-1.5 block`}>Username</Label>
                    <div className="relative">
                      <FieldIcon icon={User} />
                      <Input
                        className={usernameInputCn}
                        placeholder="boutique.a1"
                        autoComplete="username"
                        {...credentialsForm.register("username")}
                      />
                    </div>
                    {fieldError(credentialsForm.formState.errors.username)}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className={`${labelCn} mb-1.5 block`}>Password</Label>
                      <PasswordInput
                        register={credentialsForm.register}
                        name="password"
                        placeholder="Minimo 8 caratteri"
                        visible={showPassword}
                        onToggle={() => setShowPassword((value) => !value)}
                        error={credentialsForm.formState.errors.password}
                      />
                      {fieldError(credentialsForm.formState.errors.password)}
                    </div>
                    <div>
                      <Label className={`${labelCn} mb-1.5 block`}>Conferma</Label>
                      <PasswordInput
                        register={credentialsForm.register}
                        name="confermaPassword"
                        placeholder="Ripeti password"
                        visible={showConfirm}
                        onToggle={() => setShowConfirm((value) => !value)}
                        error={credentialsForm.formState.errors.confermaPassword}
                      />
                      {fieldError(credentialsForm.formState.errors.confermaPassword)}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting || !account} className="brand-primary h-9 min-w-[132px] rounded-xl font-semibold">
                      {submitting ? "Salvo..." : "Salva credenziali"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
