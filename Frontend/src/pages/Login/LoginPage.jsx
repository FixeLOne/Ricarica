import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ThemeToggle from "@/components/shared/ThemeToggle";
import logo from "@/logo.png";

const schema = z.object({
  username: z.string().min(1, "Username obbligatorio"),
  password: z.string().min(1, "Password obbligatoria"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [sessioneScaduta] = useState(() => {
    const val = !!sessionStorage.getItem("sessione-scaduta");
    if (val) sessionStorage.removeItem("sessione-scaduta");
    return val;
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ username, password }) => {
    setApiError(null);
    try {
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setApiError(
        err?.response?.data?.errore ?? "Credenziali non valide. Riprova."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--brand-soft)] dark:bg-stone-900 px-4">
      <ThemeToggle className="fixed top-4 right-4 z-10" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Card className="bg-white dark:bg-stone-800 border border-[var(--brand-border)] dark:border-stone-700 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4">
            <img src={logo} alt="RechargeNet" className="h-12 w-auto" />
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
              RechargeNet
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Accedi al gestionale
            </p>
          </CardHeader>

          <CardContent className="pb-8">
            {sessioneScaduta && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="brand-soft mb-4 rounded-md border px-3 py-2 text-sm"
              >
                La sessione è scaduta. Accedi di nuovo per continuare.
              </motion.p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Username */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-stone-700 dark:text-stone-300 text-sm"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="Inserisci username"
                  className={`
                    bg-white dark:bg-stone-900
                    border-stone-200 dark:border-stone-700
                    text-stone-900 dark:text-stone-50
                    placeholder:text-stone-400 dark:placeholder:text-stone-600
                    focus-visible:ring-[var(--brand-ring)]
                    ${errors.username ? "border-red-500 dark:border-red-400" : ""}
                  `}
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-stone-700 dark:text-stone-300 text-sm"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Inserisci password"
                    className={`
                      bg-white dark:bg-stone-900
                      border-stone-200 dark:border-stone-700
                      text-stone-900 dark:text-stone-50
                      placeholder:text-stone-400 dark:placeholder:text-stone-600
                      focus-visible:ring-[var(--brand-ring)]
                      pr-10
                      ${errors.password ? "border-red-500 dark:border-red-400" : ""}
                    `}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Errore backend */}
              {apiError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2"
                >
                  {apiError}
                </motion.p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="brand-primary w-full font-medium"
              >
                {isSubmitting ? "Accesso in corso…" : "Accedi"}
              </Button>

            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
