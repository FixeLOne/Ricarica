// Stato iniziale, conversioni documento <-> API e validazione dell'editor fatture.
import { rigaVuota, TVA_OPTIONS } from "./fatturaHelpers";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function createRow() {
  return {
    localId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    reference: "",
    descrizione: "",
    quantita: "1",
    prezzoUnitarioHT: "0.000",
    scontoPercentuale: "0",
    aliquotaTVA: "19",
  };
}

export function createDocumento() {
  return {
    tipo: "FACTURE",
    stato: "BOZZA",
    numero: "Automatico",
    dataEmissione: todayIso(),
    nomeCliente: "",
    indirizzoCliente: "",
    matriculeFiscaleCliente: "",
    boutiqueId: "",
    nomeBoutique: "",
    timbreFiscal: false,
    logoIntestazioneVisibile: true,
    logoWatermarkVisibile: false,
    remiseGlobale: "0.000",
    righe: [createRow()],
  };
}

export function responseToDocumento(fattura) {
  return {
    ...createDocumento(),
    ...fattura,
    boutiqueId: fattura.boutiqueId ? String(fattura.boutiqueId) : "",
    indirizzoCliente: fattura.indirizzoCliente ?? "",
    matriculeFiscaleCliente: fattura.matriculeFiscaleCliente ?? "",
    remiseGlobale: String(fattura.remiseGlobale ?? "0.000"),
    logoIntestazioneVisibile: fattura.logoIntestazioneVisibile !== false,
    logoWatermarkVisibile: Boolean(fattura.logoWatermarkVisibile),
    righe: (fattura.righe ?? []).map((riga) => ({
      localId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      id: riga.id,
      reference: riga.reference ?? "",
      descrizione: riga.descrizione ?? "",
      quantita: String(riga.quantita ?? "1"),
      prezzoUnitarioHT: String(riga.prezzoUnitarioHT ?? "0.000"),
      scontoPercentuale: String(riga.scontoPercentuale ?? "0"),
      aliquotaTVA: String(riga.aliquotaTVA ?? "19"),
    })),
  };
}

/**
 * Applica al documento in modifica solo i campi che decide il server
 * (id, numero, stato...), lasciando intatto tutto il resto — comprese le
 * righe con i loro localId, che sono le key React dei campi del form.
 *
 * Sostituire l'intero documento con la risposta (responseToDocumento genera
 * localId nuovi ad ogni chiamata) smonterebbe e rimonterebbe ogni input ad
 * ogni salvataggio: chi sta scrivendo perderebbe focus e posizione del
 * cursore, e la colonna scatterebbe visibilmente.
 *
 * Gli id delle singole righe non servono al client: il backend le ricrea ad
 * ogni salvataggio e normalizzaDocumentoPerApi non li invia.
 */
export function mergeDocumentoSalvato(corrente, salvato) {
  return {
    ...corrente,
    id: salvato.id,
    numero: salvato.numero,
    stato: salvato.stato,
    boutiqueId: salvato.boutiqueId != null ? String(salvato.boutiqueId) : corrente.boutiqueId,
    nomeBoutique: salvato.nomeBoutique ?? corrente.nomeBoutique,
    fatturaOrigineId: salvato.fatturaOrigineId ?? corrente.fatturaOrigineId,
    fatturaOrigineNumero: salvato.fatturaOrigineNumero ?? corrente.fatturaOrigineNumero,
  };
}

function validaRiga(riga) {
  const problemi = [];
  if (!riga.descrizione?.trim()) problemi.push("descrizione");
  if (!(Number(riga.quantita) > 0)) problemi.push("quantita");
  if (riga.prezzoUnitarioHT === "" || Number(riga.prezzoUnitarioHT) < 0) problemi.push("prezzoUnitarioHT");
  if (Number(riga.scontoPercentuale) < 0 || Number(riga.scontoPercentuale) > 100) problemi.push("scontoPercentuale");
  if (!TVA_OPTIONS.includes(String(riga.aliquotaTVA))) problemi.push("aliquotaTVA");
  return problemi;
}

/**
 * Valida l'intero documento. Ritorna { messaggio, righeInvalide } dove
 * righeInvalide e una Map<localId, string[]> dei campi non validi per riga,
 * cosi l'editor puo evidenziare la riga e il campo esatti invece di un
 * messaggio generico in cima al form.
 */
/**
 * Cosa impedisce di *salvare* una bozza: quasi niente.
 *
 * Una bozza e un blocco per appunti e si salva com'e, anche a meta. Le regole
 * vere — descrizione obbligatoria, quantita positiva — valgono all'emissione,
 * che e il momento in cui il documento diventa fiscale e prende un numero.
 *
 * Prima bastava svuotare un prezzo per rendere l'intero documento non
 * salvabile, e uscendo dalla pagina compariva "le modifiche andranno perse".
 * Qui restano solo i vincoli che il backend continua a imporre anche in
 * bozza, perche' violarli farebbe fallire la richiesta davvero.
 */
export function validaSalvataggio(documento, totaleHT) {
  const vuota = new Map();
  const righe = (documento.righe ?? []).filter((riga) => !rigaVuota(riga));

  if (!documento.tipo) return { messaggio: "Tipo documento obbligatorio.", righeInvalide: vuota };
  if (!documento.dataEmissione) return { messaggio: "Data documento obbligatoria.", righeInvalide: vuota };
  if (!righe.length) return { messaggio: "Inserisci almeno una riga.", righeInvalide: vuota };

  const problema = righe.findIndex(
    (riga) =>
      !TVA_OPTIONS.includes(String(riga.aliquotaTVA)) ||
      Number(riga.prezzoUnitarioHT) < 0 ||
      Number(riga.quantita) < 0 ||
      Number(riga.scontoPercentuale) < 0 ||
      Number(riga.scontoPercentuale) > 100,
  );
  if (problema >= 0) {
    return { messaggio: `Valori non ammessi nella riga ${problema + 1}.`, righeInvalide: vuota };
  }

  if (Number(documento.remiseGlobale) > totaleHT) {
    return { messaggio: "La remise globale non puo superare il totale HT.", righeInvalide: vuota };
  }
  return { messaggio: null, righeInvalide: vuota };
}

export function validaDocumento(documento, totaleHT) {
  const righeInvalide = new Map();
  documento.righe.forEach((riga) => {
    const problemi = validaRiga(riga);
    if (problemi.length > 0) righeInvalide.set(riga.localId, problemi);
  });

  if (!documento.tipo) return { messaggio: "Tipo documento obbligatorio.", righeInvalide };
  if (!documento.dataEmissione) return { messaggio: "Data documento obbligatoria.", righeInvalide };
  if (!documento.righe.length) return { messaggio: "Inserisci almeno una riga.", righeInvalide };
  if (righeInvalide.size > 0) {
    return {
      messaggio: `Correggi la riga ${
        documento.righe.findIndex((riga) => righeInvalide.has(riga.localId)) + 1
      }: descrizione, quantita e prezzo devono essere validi.`,
      righeInvalide,
    };
  }
  if (Number(documento.remiseGlobale) > totaleHT) {
    return { messaggio: "La remise globale non puo superare il totale HT.", righeInvalide };
  }
  return { messaggio: null, righeInvalide };
}
