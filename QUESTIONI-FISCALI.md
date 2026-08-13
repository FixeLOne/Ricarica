# Questioni fiscali da verificare con il commercialista

Elenco delle scelte fiscali fatte nel software che si basano su ricerca online e
ragionamento, non su una fonte autorevole. Ognuna funziona ed e coerente, ma va
confermata prima di usare il gestionale per documenti reali.

Da portare al commercialista cosi com'e: ogni voce dice **cosa fa il software
oggi**, **perche e un dubbio** e **la domanda da fare**.

Ultimo aggiornamento: 13 agosto 2026.

---

## 1. Timbre fiscal sull'avoir

**Oggi:** l'avoir non riporta il timbre fiscal. Il flag viene forzato a `false` in
`FatturaService.creaAvoir`, anche quando la fattura di origine lo aveva.

**Il dubbio:** il ragionamento e che il timbro sia dovuto sulla fattura, non sul
documento che la rettifica — ereditarlo accrediterebbe al cliente 1 DT di imposta
che non gli spetta. La conseguenza pratica e che dopo uno storno totale non si
torna esattamente a zero: la fattura vale 100,000 DT e l'avoir 99,000 DT, resta
1,000 DT a saldo.

**Da chiedere:** l'avoir deve riportare il timbre fiscal? E se si, il timbro
versato sulla fattura annullata si recupera o resta a carico dell'emittente?

---

## 2. Serie di numerazione separate per tipo documento

**Oggi:** ogni tipo documento ha il suo progressivo annuale per admin —
`FAC-2026-0001`, `AV-2026-0001`, `DEV-2026-0001`, `BL-2026-0001`. Le serie sono
indipendenti, quindi ognuna e ininterrotta.

**Il dubbio:** prima le serie condividevano un unico contatore e le fatture
avevano dei salti (0001, 0003, 0004...). E stato corretto perche un buco nella
numerazione, in sede di controllo, e indistinguibile da una fattura emessa e
fatta sparire. Resta da confermare il formato e il fatto che devis e bon de
livraison — che non sono documenti fiscali — possano avere una serie propria.

**Da chiedere:** il formato `FAC-2026-0001` va bene o serve un altro schema?
Devis e BL devono essere numerati e conservati come le fatture?

---

## 3. Fattura annullata: cosa si stampa

**Oggi:** una fattura annullata da un avoir si ristampa identica a com'e stata
emessa. Nessuna filigrana, nessun importo barrato, nessuna dicitura. Lo stato
"annullata" si vede solo nell'interfaccia (lista ed editor), mai sul documento.

**Il dubbio:** il ragionamento e che una fattura emessa resti un documento
fiscale valido e archiviato — con la fatturazione elettronica e registrata presso
TTN — e che sia l'avoir a rettificarla. Alterare la ristampa la renderebbe
diversa da quanto registrato.

**Da chiedere:** e corretto? Oppure la ristampa deve riportare un riferimento
all'avoir che l'ha annullata?

---

## 4. Avoir sempre totale, mai parziale

**Oggi:** l'avoir copia tutte le righe della fattura di origine, quindi storna
sempre l'intero importo. Non e possibile stornarne una parte.

**Il dubbio:** nella pratica capita il reso parziale (2 pezzi su 10) o la
correzione di un prezzo sbagliato su una sola riga. Oggi l'unica strada sarebbe
stornare tutto e riemettere.

**Da chiedere:** serve l'avoir parziale? Se si, che riferimento deve riportare
alla fattura di origine (numero e data, righe stornate)?

---

## 5. Data dell'avoir

**Oggi:** l'avoir prende la data del giorno in cui viene creato, non quella della
fattura che rettifica.

**Il dubbio:** se la fattura e di dicembre e l'avoir di gennaio, lo storno cade
nell'esercizio successivo. Fiscalmente e probabilmente corretto (l'avoir e un
documento a se, con la sua data), ma il riquadro del fatturato per periodo
mostrera un mese con una fattura non stornata e il mese dopo uno storno senza
fattura.

**Da chiedere:** e corretto che l'avoir porti la data di emissione propria? Come
va gestito lo storno a cavallo di due esercizi?

---

## 6. Arrotondamento della TVA

**Oggi:** la TVA si calcola raggruppando le righe per aliquota, sottraendo la
quota di remise globale ripartita in proporzione, e arrotondando a 3 decimali
(millimes) con HALF_UP. Quindi una volta per aliquota, non riga per riga.

**Il dubbio:** e il metodo piu comune e produce lo scarto minore, ma
l'arrotondamento riga per riga da risultati diversi di qualche millime. Se il
metodo atteso e un altro, i totali non torneranno con quelli del commercialista.

**Da chiedere:** la TVA va arrotondata per aliquota o per riga? A 3 decimali?

---

## 7. Timbre fiscal su devis e bon de livraison

**Oggi:** il flag del timbre e disponibile su tutti i tipi documento, quindi si
puo attivare anche su un devis o un bon de livraison.

**Il dubbio:** il timbre e un'imposta dovuta sulla fattura. Su un preventivo, che
non e un documento fiscale, non dovrebbe comparire. Oggi nulla lo impedisce.

**Da chiedere:** su quali documenti va il timbre fiscal? Va bloccato sugli altri?

---

## 8. Esenzioni e regimi speciali

**Oggi:** si puo scegliere aliquota 0% su una riga, ma il documento non riporta
nessuna dicitura che spieghi il perche.

**Il dubbio:** un'operazione esente (export, regime suspensif, cliente
esonerato) di norma richiede in fattura il riferimento alla norma o
all'autorizzazione. Oggi la fattura mostra solo uno 0% senza spiegazione.

**Da chiedere:** quali casi di esenzione capitano nella pratica e che dicitura
deve comparire in fattura? Serve registrare il numero di autorizzazione del
cliente?

---

## 9. Definizione di "fatturato"

**Oggi:** il riquadro "Fatturato" nella lista somma il totale netto (TTC), cioe
comprensivo di TVA e timbre, sottraendo gli avoir. Preventivi, bolle e bozze
contano zero.

**Il dubbio:** in contabilita il fatturato e l'imponibile (HT). Il valore
mostrato oggi e la cifra incassata, non il ricavo.

**Da chiedere:** quale dei due valori serve nei prospetti — e servono entrambi
(HT per il ricavo, TTC per la cassa)?

---

## 10. Fatturazione elettronica (El Fatoora / TTN)

**Oggi:** il gestionale produce solo PDF. Nessun invio a TTN, nessun formato
TEIF, nessuna firma elettronica.

**Il dubbio:** l'obbligo di fatturazione elettronica in Tunisia si applica per
scaglioni a seconda del tipo di attivita e del volume d'affari. Se questa
attivita ci rientra, il PDF da solo non basta.

**Da chiedere:** l'attivita e soggetta all'obbligo? Da quando? Cosa serve per
interfacciarsi (certificato, formato, canale)?

---

## 11. Conservazione dei documenti

**Oggi:** i documenti stanno in un database che in sviluppo e in memoria e si
azzera ad ogni riavvio. In produzione servira un database persistente.

**Il dubbio:** la conservazione richiede che i documenti emessi restino
recuperabili e immodificabili per 10 anni. Il software gia impedisce di
modificare o cancellare una fattura emessa, ma non c'e ancora ne backup ne
archiviazione a norma.

**Da chiedere:** che forma deve avere la conservazione — basta il backup del
database e il PDF, o serve un servizio di conservazione certificato?

---

## 12. Tracciabilita di chi emette

**Oggi:** la fattura registra l'admin proprietario e la boutique, ma non chi ha
materialmente premuto "Emetti" ne quando.

**Il dubbio:** con piu dipendenti che emettono documenti dalla stessa boutique,
in caso di contestazione non si risale all'operatore.

**Da chiedere:** serve tenere traccia dell'operatore e dell'orario di emissione?
