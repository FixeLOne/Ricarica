import { AlertCircle, DoorOpen, Send, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACTION_COPY = {
  emit: {
    title: "Emettere la bozza?",
    description: "Il documento ricevera un numero definitivo e non sara piu modificabile.",
    confirm: "Emetti",
    icon: Send,
  },
  avoir: {
    title: "Creare un Avoir?",
    description: "Righe, remise e dati fiscali saranno copiati. La fattura originale verra annullata e si aprira il nuovo Avoir emesso.",
    confirm: "Crea Avoir",
    icon: Undo2,
  },
  delete: {
    title: "Eliminare la bozza?",
    description: "Solo le bozze possono essere eliminate. Questa operazione rimuove il documento non emesso.",
    confirm: "Elimina",
    icon: Trash2,
  },
  leave: {
    title: "Uscire senza salvare?",
    description: "Ci sono modifiche non salvate: uscendo dalla pagina andranno perse.",
    confirm: "Esci",
    icon: DoorOpen,
  },
};

export default function ConfirmActionDialog({ action, open, onOpenChange, onConfirm, working }) {
  const fattura = action?.fattura;
  const copy = ACTION_COPY[action?.type] ?? {};
  const Icon = copy.icon ?? AlertCircle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <DialogHeader className="text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-950 dark:text-stone-50">{copy.title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {copy.description}
              </DialogDescription>
              {fattura && (
                <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold tabular-nums text-stone-800 dark:border-stone-800 dark:bg-stone-950/35 dark:text-stone-200">
                  {fattura.numero}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-3 gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            disabled={working}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border-stone-200 text-stone-700 dark:border-stone-800 dark:text-stone-300"
          >
            Annulla
          </Button>
          <Button
            type="button"
            disabled={working}
            onClick={onConfirm}
            className={action?.type === "delete" ? "h-9 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700" : "brand-primary h-9 rounded-xl font-semibold"}
          >
            {working ? "Attendi..." : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
