import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RicaricaForm from "./RicaricaForm";
import { MANUALE_VALUE } from "@/hooks/useRicariche";

export function ConfirmDialog({ open, onConfirm, onCancel, numero }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="max-w-sm bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="text-stone-900 dark:text-stone-50">Elimina ricarica</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Eliminare la ricarica per il numero <strong>{numero}</strong>? L'operazione non è reversibile.
        </p>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={onCancel}
            className="border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">Annulla</Button>
          <Button onClick={onConfirm} className="bg-red-500 hover:bg-red-600 text-white">Elimina</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ModificaRicaricaModal({
  riga, tariffe, boutiques, ruolo, isSubmitting, onSubmit, onClose,
}) {
  if (!riga) return null;

  const defaultValues = {
    numero:         riga.numero,
    gigaValore:     riga.manuale ? MANUALE_VALUE : String(parseFloat(riga.giga)),
    gigaManuale:    riga.manuale ? String(parseFloat(riga.giga)) : "",
    costoEffettivo: riga.manuale ? parseFloat(riga.costoEffettivo).toFixed(3) : "",
    costoCliente:   riga.manuale ? parseFloat(riga.costoCliente).toFixed(3)   : "",
    note:           riga.note ?? "",
    boutiqueId:     riga.boutiqueId ? String(riga.boutiqueId) : "",
  };

  return (
    <Dialog open={!!riga} onOpenChange={v => !v && onClose()}>
      <DialogContent onOpenAutoFocus={e => e.preventDefault()} className="max-w-2xl bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="text-stone-900 dark:text-stone-50">
            Modifica ricarica — {riga.numero}
          </DialogTitle>
        </DialogHeader>
        <RicaricaForm
          key={riga.id}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          tariffe={tariffe}
          boutiques={boutiques}
          ruolo={ruolo}
          isSubmitting={isSubmitting}
          submitLabel="Salva modifiche"
        />
      </DialogContent>
    </Dialog>
  );
}
