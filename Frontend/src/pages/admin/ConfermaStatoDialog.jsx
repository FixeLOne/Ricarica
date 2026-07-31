import { CirclePause, CirclePlay } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ConfermaStatoDialog({ boutique, submitting, onClose, onConfirm }) {
  if (!boutique) return null;

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 p-4 backdrop-blur-[2px]"
          onClick={() => !submitting && onClose()}
      >
        <div
            className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.65)] dark:border-stone-800 dark:bg-stone-900"
            onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
          {boutique.attiva ? <CirclePause className="h-5 w-5" /> : <CirclePlay className="h-5 w-5" />}
        </span>
            <div>
              <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                {boutique.attiva ? "Disattiva boutique" : "Riattiva boutique"}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {boutique.attiva
                    ? `${boutique.nome} non sarà più disponibile per nuove ricariche o nuove fatture.`
                    : `${boutique.nome} tornerà disponibile nei flussi operativi.`}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="h-9 rounded-xl border-stone-200 text-stone-700 dark:border-stone-800 dark:text-stone-300"
            >
              Annulla
            </Button>
            <Button
                type="button"
                disabled={submitting}
                onClick={onConfirm}
                className="brand-primary h-9 min-w-[104px] rounded-xl font-semibold"
            >
              {submitting ? "Salvo..." : boutique.attiva ? "Disattiva" : "Riattiva"}
            </Button>
          </div>
        </div>
      </div>
  );
}
