import { Printer, Send, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import FatturaDocumentPreview from "./FatturaDocumentPreview";

export default function InvoicePreviewDialog({ fattura, azienda, open, onOpenChange, onAskAction, working }) {
  const isBozza = fattura?.stato === "BOZZA";
  const canAvoir = fattura?.stato === "EMESSA" && fattura?.tipo !== "AVOIR";

  if (!fattura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border-stone-200 bg-stone-50 p-0 dark:border-stone-800 dark:bg-stone-950">
        <div className="no-print flex shrink-0 flex-col gap-3 border-b border-stone-200 bg-white py-4 pl-5 pr-14 dark:border-stone-800 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <DialogTitle className="text-base font-semibold text-stone-950 dark:text-stone-50">
              {fattura.numero}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Anteprima documento. Usa Stampa/PDF per salvarlo dal browser.
            </DialogDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isBozza && (
              <Button
                type="button"
                disabled={working}
                onClick={() => onAskAction("emit", fattura)}
                className="brand-primary h-9 rounded-xl font-semibold"
              >
                <Send className="h-4 w-4" />
                Emetti
              </Button>
            )}
            {canAvoir && (
              <Button
                type="button"
                variant="outline"
                disabled={working}
                onClick={() => onAskAction("avoir", fattura)}
                className="h-9 rounded-xl border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]"
              >
                <Undo2 className="h-4 w-4" />
                Avoir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="h-9 rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <Printer className="h-4 w-4" />
              Stampa/PDF
            </Button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto p-4 sm:p-6"
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          <FatturaDocumentPreview
            documento={fattura}
            azienda={azienda}
            fitPageToViewport
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
