import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Il nodo della barra alta vive in uno store minimo invece che in un context:
// i totali della fattura cambiano a ogni tasto premuto, e con uno stato
// condiviso ogni battuta ridisegnerebbe la barra e tutto quello che ci sta
// dentro (avatar, dropdown, palette). Qui l'unica cosa che cambia e' il nodo,
// una volta sola, al montaggio della shell.
let nodoSlot = null;
const iscritti = new Set();

function registraSlot(nodo) {
  nodoSlot = nodo;
  iscritti.forEach((avvisa) => avvisa());
}

function sottoscrivi(avvisa) {
  iscritti.add(avvisa);
  return () => iscritti.delete(avvisa);
}

/** Spazio nella barra alta che le pagine possono riempire con le proprie azioni. */
export function TopbarSlot() {
  return <div ref={registraSlot} className="flex min-w-0 flex-1 items-center gap-3" />;
}

/** Monta i figli nella barra alta invece che nel punto in cui e' scritto. */
export function TopbarPortal({ children }) {
  const nodo = useSyncExternalStore(sottoscrivi, () => nodoSlot, () => null);
  return nodo ? createPortal(children, nodo) : null;
}
