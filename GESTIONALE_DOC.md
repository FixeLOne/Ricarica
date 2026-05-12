# RechargeNet — Documentazione Tecnica del Gestionale

## Contesto e Scopo

Gestionale web multi-tenant per negozi di ricariche telefoniche in Tunisia.
Progettato per un admin principale (proprietario di più boutique) che può rivendere l'accesso ad altri proprietari di negozi.
Stack: **Spring Boot 3 + Spring Security (JWT) + JPA/Hibernate + PostgreSQL**.
Frontend separato (non incluso in questo documento).

---

## Modello di Ruoli (Multi-Tenant)

| Ruolo | Chi è | Cosa può fare |
|---|---|---|
| `SUPER_ADMIN` | Lo sviluppatore/proprietario del sistema | Crea nuovi Admin, vede tutte le boutique |
| `ADMIN` | Proprietario di uno o più negozi | Gestisce le sue boutique, i listini, vede i report |
| `DIPENDENTE` | Operatore del singolo negozio | Inserisce, modifica, elimina ricariche del suo negozio |

Ogni entità è **isolata per Admin**: le tariffe, le boutique e le ricariche di un Admin non sono mai visibili o modificabili da un altro Admin.

```
SUPER_ADMIN (1)
│
│  può creare
├──────────────────────────────────────┐
│                                      │
ADMIN A (proprietario)          ADMIN B (proprietario)
│                                      │
│  possiede                            │  possiede
├─────────────────┐                    ├─────────────────┐
│                 │                    │                 │
Boutique A1    Boutique A2          Boutique B1    Boutique B2
│                 │                    │                 │
Listino A      Listino A            Listino B      Listino B
(condiviso tra    │                  (condiviso tra    │
 le boutique      │                   le boutique      │
 di A)            │                   di B)            │
│                 │                    │                 │
DIPENDENTE A1  DIPENDENTE A2       DIPENDENTE B1  DIPENDENTE B2
(vede/scrive       (vede/scrive        (vede/scrive       (vede/scrive
 solo A1)           solo A2)            solo B1)           solo B2)
```

**Isolamento dati:** ADMIN A non vede mai dati di ADMIN B e viceversa.
Il `boutiqueId` nel JWT garantisce che ogni dipendente operi solo sul suo negozio.

---

## Architettura dei Package

```
lx.gestionale
├── security/         # JWT, filtri, UserPrincipal, SecurityConfig
├── utente/           # Entity Utente, repository, ruoli
├── negozio/          # Entity Boutique, BoutiqueService, BoutiqueController
├── ricarica/         # Entity Ricarica, logica operatori, RicaricaService
├── tariffa/          # Entity Tariffa (listino prezzi per Admin)
├── dashboard/        # Riepilogo giornaliero per boutique
├── export/           # Generazione Excel (Apache POI)
├── eccezioni/        # GlobalExceptionHandler, ExportException
└── dto/              # Request/Response objects (mai entity esposte direttamente)
```

---

## Autenticazione e Sicurezza

### Flusso Login
1. Il client manda `POST /api/v2/auth/login` con `{ username, password }`
2. `AuthService` autentica via `AuthenticationManager` (nessuna query extra)
3. `JwtService` genera un token firmato HS256 contenente: `username`, `ruolo`, `boutiqueId`
4. Il client riceve `{ token, username, ruolo, boutiqueId }`

### JWT Token
- Scadenza: **8 ore** (configurabile via `jwt.expiration` in properties)
- Payload claims: `subject` (username), `ruolo` (es. `"ADMIN"`), `utenteId` (presente per tutti i ruoli), `boutiqueId` (presente solo per DIPENDENTE, null per ADMIN e SUPER_ADMIN)
- Validazione: `JwtFilter` intercetta ogni richiesta, valida il token e popola il `SecurityContext`

### UserPrincipal
Estende `User` di Spring Security con due campi aggiuntivi:
- `utenteId` — ID dell'utente nel DB
- `boutiqueId` — ID della boutique associata (null per ADMIN e SUPER_ADMIN)

Ogni controller riceve il `principal` via `@AuthenticationPrincipal UserPrincipal` e passa solo gli ID necessari al service, **senza query aggiuntive**.

### Matrice Permessi (SecurityConfig)

| Endpoint | Ruoli ammessi |
|---|---|
| `POST /api/v2/auth/login` | Pubblico |
| `POST /api/v2/utenti/admin` | SUPER_ADMIN |
| `POST /api/v2/boutique` | ADMIN |
| `GET /api/v2/boutique/tutte` | SUPER_ADMIN |
| `GET /api/v2/boutique/**` | SUPER_ADMIN, ADMIN |
| `GET/POST/PUT/DELETE /api/v2/tariffe/**` | SUPER_ADMIN, ADMIN |
| `GET /api/v2/dashboard/**` | ADMIN |
| `GET /api/v2/export/**` | SUPER_ADMIN, ADMIN, DIPENDENTE |
| `* /api/v2/ricariche/**` | SUPER_ADMIN, ADMIN, DIPENDENTE |

---

## Moduli Funzionali

### 1. Boutique (Negozi)
**Entity:** `Boutique` — ha `nome`, `città`, riferimento all'`admin` proprietario.

**Operazioni:**
- `POST /api/v2/boutique` — crea una boutique **e** contestualmente crea l'account `DIPENDENTE` associato (username/password configurabili nella request). Transazionale: o tutto va a buon fine o niente.
- `GET /api/v2/boutique` — lista delle boutique dell'admin loggato
- `GET /api/v2/boutique/tutte` — tutte le boutique del sistema (solo SUPER_ADMIN)

**Vincoli:**
- Un Admin non può avere due boutique con lo stesso nome
- Lo username dell'account dipendente deve essere unico nel sistema

---

### 2. Tariffe (Listino Prezzi)
**Entity:** `Tariffa` — ha `operatore` (nullable), `giga`, `costoAcquisto`, `prezzoVendita`, riferimento all'`admin`.

**Logica chiave:**
- Ogni Admin ha il suo listino indipendente
- L'`operatore` può essere `null`: in quel caso la tariffa è **generica** (fallback)
- Al momento della ricarica, il sistema cerca prima la tariffa specifica per operatore+giga, poi quella generica se non la trova

**Operatori supportati:** `ooredoo`, `orange`, `telecom`, `fisso`
**Rilevamento automatico operatore** dal primo digit del numero:
- `2`, `4` → Ooredoo
- `5` → Orange
- `9` → Telecom
- `3` → Fisso

**Operazioni:**
- `POST /api/v2/tariffe` — crea o aggiorna (upsert per operatore+giga+admin)
- `GET /api/v2/tariffe` — listino completo dell'admin loggato
- `PUT /api/v2/tariffe/{id}` — modifica (verifica ownership)
- `DELETE /api/v2/tariffe/{id}` — elimina (verifica ownership)

---

### 3. Ricariche
**Entity:** `Ricarica` — ha `numero`, `operatore`, `giga`, `costoEffettivo`, `costoCliente`, `profitto`, `dataOra`, `dataSolo`, riferimento alla `boutique`.

**`dataSolo`** è un campo ridondante (LocalDate) ottimizzato per le query della dashboard senza conversioni datetime.

**Flusso creazione ricarica:**
1. Il dipendente manda numero + giga (+ eventualmente prezzi manuali)
2. Il service valida il numero (8 cifre, solo numeri)
3. Rileva l'operatore automaticamente dal primo digit
4. Se `manuale = false`: recupera i prezzi dal listino dell'Admin del negozio
5. Se `manuale = true`: usa i prezzi passati nella request
6. Calcola `profitto = costoCliente - costoEffettivo` (nel service, non nell'entity)
7. Salva

**Sicurezza ownership:** modifica ed eliminazione verificano che la ricarica appartenga alla boutique del dipendente loggato.

**Operazioni:**
- `POST /api/v2/ricariche` — crea ricarica per la boutique del dipendente loggato
- `PUT /api/v2/ricariche/{id}` — modifica (verifica boutique)
- `DELETE /api/v2/ricariche/{id}` — elimina (verifica boutique)

---

### 4. Dashboard
Riepilogo giornaliero filtrato per boutique dell'utente loggato.

`GET /api/v2/dashboard/riepilogo` → `{ totaleOperazioni, profittoTotale }`

Usa query JPQL aggregate direttamente su `RicaricaRepository`, nessun caricamento di liste in memoria.

---

### 5. Export Excel
`GET /api/v2/export/ricariche?dal=YYYY-MM-DD&al=YYYY-MM-DD`

**Vincoli:**
- `dal` non può essere dopo `al`
- `al` non può essere nel futuro
- Range massimo: 366 giorni

**Output:** file `.xlsx` (Apache POI) con colonne:
`Date et Heure | Numéro | Opérateur | Gigas | Dépense Magasin | Payé par Client | Bénéfice Net`

Riga finale con totali aggregati. Stili colore per operatore (rosso Ooredoo, arancione Orange, blu Telecom, verde Fisso).

---

### 6. Fatture (Feature da Implementare)
La versione legacy aveva un modulo fatture con:
- Dati emittente per Admin (ragione sociale, indirizzo, matricule fiscale/partita IVA, logo)
- Numerazione automatica `FAC-YYYY-NNNN`
- Tipo documento: Factura / Bon de Livraison
- Righe articolo con quantità, prezzo HT, aliquota TVA
- Timbre fiscal (opzionale)
- Remise globale (sconto)
- Calcolo automatico: Totale HT, TVA, Netto a Pagare
- Stampa/PDF inline

**Da progettare — vedi sezione TODO per i dettagli aggiornati.**

---

## Gestione Errori

`GlobalExceptionHandler` intercetta:
- `IllegalArgumentException` → HTTP 400 con `{ "errore": "messaggio specifico" }`
- `Exception` (generico) → HTTP 500 con `{ "errore": "Errore interno del server" }`

Tutti gli errori di validazione business (numero non valido, tariffa non trovata, permessi negati) usano `IllegalArgumentException` con messaggio descrittivo.

---

## CORS
In sviluppo: `allowedOrigins("*")`.
**In produzione: sostituire con l'URL esatto del frontend.**

---

## Regole da Rispettare nelle Nuove Feature

- I **controller** ricevono il `principal` e passano solo ID primitivi ai service. Mai passare entity o oggetti Spring Security ai service.
- I **service** contengono tutta la logica di business e i controlli di ownership.
- Le **entity** sono solo dati — nessuna logica di calcolo, nessun `@PrePersist` con business logic.
- I **DTO** separano sempre il contratto API dalle entity JPA. Mai esporre entity direttamente nei response.
- Ogni operazione di scrittura su risorse altrui deve verificare l'ownership prima di procedere.
- Il profitto viene sempre calcolato nel service immediatamente dopo aver fissato i prezzi.

---

## Audit Sicurezza / Logica / Coerenza — Sintesi

Tabella riepilogativa dei problemi riscontrati al check completo del codice.
I dettagli operativi (causa + soluzione) sono nelle sezioni TODO sotto.

| Priorità | Area | Problema | Stato |
|---|---|---|---|
| CRITICA | Infra | DataInitializer attivo in produzione (password note in chiaro) | da fare |
| CRITICA | Security | UtenteController.creaAdmin senza doppia protezione (solo SecurityConfig) | da fare |
| ALTA | Logica | RicaricaService — ADMIN non può modificare/eliminare proprie ricariche (NPE/false su equals(null)) | da fare |
| ALTA | Logica | FatturaService — SUPER_ADMIN bloccato su tutte le operazioni (ownership check rigido) | da fare |
| ALTA | Logica | FatturaService — getFatture restituisce lista vuota per SUPER_ADMIN | da fare |
| ALTA | Logica | TariffaService — SUPER_ADMIN bloccato su modifica/eliminazione tariffe | da fare |
| ALTA | Coerenza | FatturaRepository.existsByNumero non scoped per admin (numeri collidono tra admin) | da fare |
| MEDIA | Logica | TariffaService.salvaOAggiorna / getListinoCompleto non gestiscono SUPER_ADMIN | da fare |
| MEDIA | Logica | DashboardService.getRiepilogoAdmin restituisce vuoto per SUPER_ADMIN | da fare |
| MEDIA | Logica | ExportService.generaReport produce file vuoto per SUPER_ADMIN | da fare |
| MEDIA | Concorrenza | ContatoreFatturaService — race condition su creazione contatore | da fare |
| MEDIA | Validation | CreaRicaricaRequest senza @NotBlank/@Positive | da fare |
| MEDIA | Validation | CreaFatturaRequest / RigaFatturaRequest senza validazioni sui campi numerici | da fare |
| MEDIA | Coerenza | SecurityConfig fatture — permessi GET/POST disallineati col service | da fare |
| MEDIA | Security | CorsConfig.allowedOrigins("*") in produzione | da fare |
| BASSA | Security | JwtService senza meccanismo invalidazione token (no blacklist) | da fare |
| BASSA | Logica | Ricarica.note presente ma mai valorizzato | da fare |
| BASSA | Logica | BoutiqueController crea boutique senza defense-in-depth nel service | da fare |
| BASSA | Logging | JwtFilter non logga request URI nei warning di token | da fare |

---

## TODO — Backlog Feature

Aggiungere nuove voci liberamente in fondo a ogni sezione.
Formato: `[ ]` da fare — `[x]` fatto — `[-]` scartato con motivazione.

---

### Fatture

```
[x] Entity Fattura — legata a Boutique, visibile all'Admin proprietario
[x] Entity RigaFattura — OneToMany con Fattura (descrizione, qty, prezzo HT, aliquota TVA)
[x] Entity DatiAzienda — OneToOne con Utente Admin
      campi: ragione sociale, indirizzo, matricule fiscale, logo (base64 nel DB)
[x] Tipi documento: Facture, Bon de livraison, Devis, Avoir
[x] Numerazione automatica annuale per Admin: FAC-YYYY-NNNN (ContatoreFattura con lock pessimistico)
[x] Timbre fiscal — toggle on/off, valore fisso configurabile
[x] Remise globale — sconto in DT sul totale documento
[x] Calcolo automatico: Totale HT, TVA per riga, Timbre, Netto a Pagare
[x] Endpoint: GET /api/v2/fatture (lista per boutique o per admin)
[x] Endpoint: POST /api/v2/fatture
[x] Endpoint: GET /api/v2/fatture/{id}
[x] Endpoint: DELETE /api/v2/fatture/{id} — solo se status = BOZZA, altrimenti emettere Avoir
[x] Stati Fattura: BOZZA, EMESSA, ANNULLATA
[x] Endpoint emissione fattura (BOZZA -> EMESSA con assegnazione numero)
[ ] Export PDF — valutare Apache PDFBox (licenza libera) vs iText (licenza da verificare)
[ ] Watermark/logo aziendale nell'anteprima PDF
[ ] Endpoint dedicato emissione AVOIR collegata a una FATTURA esistente
[ ] Validare che la somma delle righe sia > 0 prima di emettere
[ ] Flag fattureAbilitate su Boutique controllato anche in lettura (oggi solo in scrittura)
```

---

### 👤 Profilo & Anagrafica

```
[ ] Aggiungere campi a Boutique: indirizzo completo, telefono
[ ] Endpoint profilo Boutique — restituisce boutique + lista dipendenti associati
[ ] Endpoint profilo Admin — dati personali + lista boutique + dati azienda
[ ] Endpoint cambio password — disponibile a tutti i ruoli per la propria utenza
      nota: non prioritario, l'Admin può reimpostare la password del dipendente
[ ] Gestione multi-dipendente per Boutique — rimandato, ora 1 account per boutique
```

---

### 📊 Report & Dashboard

```
[ ] Report mensile — aggregato per mese, visibile all'Admin (tutte le sue boutique)
[ ] Report annuale — aggregato per anno, visibile all'Admin
[ ] Statistiche per operatore — ricariche e profitto per Ooredoo/Orange/Telecom/Fisso
[ ] Dati grafici dashboard Admin — trend per periodo, breakdown per operatore
      nota: il backend espone dati aggregati JSON, i grafici sono lato frontend
[ ] Dashboard dipendente — già implementata (riepilogo giornaliero per boutique)
```

---

### 🔍 Ricerca & Navigazione

```
[ ] Ricerca ricariche per numero cliente
      endpoint: GET /api/v2/ricariche?numero=XXXXXXXX
[ ] Paginazione lista ricariche
      endpoint: GET /api/v2/ricariche?page=0&size=20
[ ] Paginazione lista fatture
[ ] Filtro ricariche per operatore
[ ] Filtro ricariche per range date (già implementato nell'export, da esporre anche come API)
```

---

### Sicurezza & Qualità

```
[ ] Sostituire allowedOrigins("*") con URL frontend in produzione
      nota: con allowCredentials true il wildcard è invalido per spec CORS
[ ] Valutare blacklist token JWT per invalidazione anticipata (es. cambio password, logout)
[ ] Aggiungere @NotBlank / @Positive / @Valid sui DTO mancanti
      - CreaRicaricaRequest: numero, giga, costoEffettivo, costoCliente
      - CreaFatturaRequest: clienteNome, righe (@Valid + @NotEmpty)
      - RigaFatturaRequest: descrizione (@NotBlank), quantita (@Positive),
                           prezzoUnitarioHT (@PositiveOrZero), aliquotaTVA (@Min 0 @Max 100)
      - CreaBoutiqueRequest: nome, citta, usernameDipendente, passwordDipendente
      - CreaAdminRequest: tutti i campi obbligatori
      - LoginRequest: @NotBlank su username e password
      - DatiAziendaRequest: ragioneSociale, matriculeFiscale
[ ] Aggiungere @PreAuthorize("hasRole('SUPER_ADMIN')") su UtenteController.creaAdmin
      motivazione: defense-in-depth, oggi è protetto solo da SecurityConfig
[ ] Aggiungere @PreAuthorize sui controller sensibili (boutique, tariffe, fatture)
      motivazione: doppio livello di protezione oltre a SecurityConfig
[-] Soft delete Ricarica — SCARTATO: in contabilità tunisina si emette Avoir, non si cancella
[ ] DataInitializer — rimuovere o disabilitare prima del deploy in produzione
      nota: usare profilo Spring @Profile("dev") o flag application property
[ ] JWT secret — verificare che in produzione sia un valore >= 256 bit casuale,
                 non hardcoded e non committato nel repo
[ ] Password policy — minima lunghezza, complessità, scadenza periodica
[ ] Rate limiting su /api/v2/auth/login per prevenire brute force
[ ] Audit log delle azioni sensibili (creazione admin, emissione fatture, modifiche tariffe)
[ ] Aggiungere @NotBlank / @Positive / @Valid sui DTO mancanti
      - CreaRicaricaRequest: numero, giga, costoEffettivo, costoCliente
      - CreaFatturaRequest: clienteNome, righe (@Valid + @NotEmpty), remiseGlobale (@PositiveOrZero per evitare sconti negativi)
      - RigaFatturaRequest: descrizione (@NotBlank), quantita (@Positive),
                           prezzoUnitarioHT (@PositiveOrZero), aliquotaTVA (@Min 0 @Max 100)
      - CreaBoutiqueRequest: nome, citta, usernameDipendente, passwordDipendente
      - CreaAdminRequest: tutti i campi obbligatori
      - LoginRequest: @NotBlank su username e password
      - DatiAziendaRequest: ragioneSociale, matriculeFiscale
```

---

### Bug Noti & Debito Tecnico

```
[x] @Data su tutte le entity JPA (Fattura, RigaFattura, Boutique, Ricarica, Utente, DatiAzienda, ContatoreFattura)
      sostituito con @Getter @Setter @EqualsAndHashCode(onlyExplicitlyIncluded = true) + @EqualsAndHashCode.Include su id

[x] LazyInitializationException su getFatture e getFatturaById in FatturaService
      aggiunto @Transactional(readOnly = true) su entrambi i metodi

[x] TariffaController, RicaricaController, BoutiqueController esponevano entity JPA direttamente
      creati TariffaResponse, RicaricaResponse, BoutiqueResponse con mapping toResponse() nei service

[x] ExportService restituiva file vuoto per ADMIN (boutiqueId null)
      aggiunto utenteId al generaReport, per ADMIN aggrega le ricariche di tutte le sue boutique

[x] SUPER_ADMIN NPE su eliminaRicarica e modificaRicarica
      aggiunto bypass ruolo con short-circuit && in RicaricaService

[ ] FatturaRepository.existsByNumero è globale (non scoped per admin)
      causa: cerca il numero su tutte le fatture del sistema
      soluzione: aggiungere existsByNumeroAndAdminId(String numero, Long adminId)

[ ] RicaricaService — modificaRicarica/eliminaRicarica falliscono per ADMIN
      causa: il check "!r.getBoutique().getId().equals(boutiqueId)" valuta equals(null) per ADMIN
              (boutiqueId nel JWT è null per ADMIN) -> ritorna sempre false -> negazione true -> eccezione
              risultato: ADMIN non può mai modificare/eliminare ricariche delle sue boutique
      soluzione: gestire esplicitamente il ruolo ADMIN verificando che
                 r.getBoutique().getAdmin().getId() == utenteId (passare anche utenteId al service)

[ ] ContatoreFatturaService — race condition su creazione contatore
      causa: findByAdminAndAnno + save senza lock pessimistico; due transazioni concorrenti
              possono entrambe non trovare il contatore e crearne uno duplicato
      soluzione: aggiungere @Lock(LockModeType.PESSIMISTIC_WRITE) sulla query del repository
                 oppure constraint UNIQUE su (admin_id, anno) + retry

[ ] CreaRicaricaRequest — validazione mancante
      campi: numero (@NotBlank), giga (@Positive), costoEffettivo/costoCliente (@Positive quando manuale=true)
      attualmente la validazione avviene solo nel service e parte dei campi può arrivare null

[ ] CreaFatturaRequest e RigaFatturaRequest — validazione incompleta
      campi: quantita > 0, prezzoUnitarioHT >= 0, aliquotaTVA tra 0 e 100, descrizione non vuota
      mancano @Valid sulla lista righe e annotazioni nei DTO delle righe

[ ] Ricarica — campo "note" presente nell'entity e nel response ma mai valorizzato
      soluzione: aggiungere "note" in CreaRicaricaRequest e settarlo in popolaDatiRicarica()

[ ] BoutiqueController — endpoint creazione boutique non verifica che il chiamante sia ADMIN
                          (è protetto solo da SecurityConfig, manca defense-in-depth nel service)
      soluzione: aggiungere @PreAuthorize o verifica esplicita del ruolo nel service

[ ] UtenteController — POST /api/v2/utenti/admin senza doppia protezione
      nota: SecurityConfig richiede SUPER_ADMIN ma il service non verifica nulla
      soluzione: aggiungere @PreAuthorize("hasRole('SUPER_ADMIN')") sul metodo del controller

[ ] SecurityConfig — incoerenza permessi fatture
      .requestMatchers(GET, "/api/v2/fatture/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
      .requestMatchers("/api/v2/fatture/**").hasAnyRole("ADMIN", "DIPENDENTE")
      effetto: SUPER_ADMIN può leggere ma non scrivere, mentre il service blocca SUPER_ADMIN anche in lettura
      soluzione: decidere se il SUPER_ADMIN deve gestire fatture e allineare i due livelli

[ ] DashboardService — getRiepilogoBoutique non valida che la boutique appartenga al dipendente
      nota: il boutiqueId arriva dal JWT, quindi è affidabile, ma manca una defense-in-depth
      soluzione: query JPQL con doppio filtro boutique_id + utente associato

[ ] JwtFilter — eccezioni JWT loggate come WARN ma senza correlazione con request
      soluzione: includere request URI / IP nel log e usare MDC per tracciabilità

[ ] CorsConfig — allowedOrigins("*") con allowCredentials implicito
      causa: combinazione non valida secondo specifica CORS, alcuni browser la rifiutano
      soluzione: in produzione restringere ad origini specifiche

[ ] JwtService — nessuna invalidazione token (no blacklist)
      effetto: dopo cambio password o logout, il vecchio token resta valido fino a scadenza
      soluzione: blacklist in Redis o ridurre durata token + refresh token

[ ] DataInitializer — attivo anche in produzione, crea utenti con password note ("admin123")
      gravità: CRITICA in deploy reale
      soluzione: annotare con @Profile("dev") o @ConditionalOnProperty(name="app.init.enabled", havingValue="true")
```

---

### SUPER_ADMIN — Funzionalità da Completare

```
[x] RicaricaService — bypass ownership implementato (ruolo passato dal token)
      nota: SUPER_ADMIN può modificare/eliminare ricariche di qualsiasi boutique

[ ] TariffaService — modificaTariffa ed eliminaTariffa rifiutano il SUPER_ADMIN
      causa: check tariffa.getAdmin().getId().equals(adminId) fallisce (tariffa appartiene a un ADMIN, non al SUPER_ADMIN)
      soluzione: aggiungere bypass ruolo identico a RicaricaService (passare ruolo dal controller)

[ ] TariffaService — salvaOAggiorna e getListinoCompleto usano adminId del SUPER_ADMIN
      causa: restituisce lista vuota o crea tariffe intestate al SUPER_ADMIN
      soluzione: SUPER_ADMIN deve passare adminId esplicito nel body (come boutiqueId nelle ricariche)

[ ] FatturaService — verificaOwnership rifiuta il SUPER_ADMIN sulle GET e PUT
      causa: fattura.getAdmin().getId().equals(utenteId) sempre false per il SUPER_ADMIN
      soluzione: bypass ruolo in verificaOwnership (overload con parametro ruolo)

[ ] FatturaService — getFatture restituisce lista vuota per il SUPER_ADMIN
      causa: cerca findByAdminId con l'ID del SUPER_ADMIN che non ha fatture intestate a sé
      soluzione: per SUPER_ADMIN usare findAll() o aggiungere un metodo dedicato

[ ] FatturaService — emettiFattura e annullaFattura non gestiscono SUPER_ADMIN
      causa: stesso problema di verificaOwnership
      soluzione: passare ruolo e applicare bypass

[ ] DashboardService — getRiepilogoAdmin restituisce lista vuota per il SUPER_ADMIN
      causa: costruisce un Utente dummy con solo l'ID del SUPER_ADMIN, che non ha boutique associate
      soluzione: per SUPER_ADMIN usare boutiqueRepository.findAll()

[ ] ExportService — generaReport per SUPER_ADMIN produce file vuoto
      causa: usa utenteId del SUPER_ADMIN come admin, ma non ha boutique
      soluzione: per SUPER_ADMIN aggregare tutte le ricariche del sistema o filtrare per adminId esplicito

[ ] BoutiqueService — getBoutiqueByAdmin e simili non hanno percorso SUPER_ADMIN
      nota: SUPER_ADMIN ha solo /tutte; valutare se serve filtrare per adminId

[ ] DatiAziendaService — nessun intervento necessario
      nota: SecurityConfig limita /api/v2/azienda/** solo ad ADMIN, corretto by design
      [ ] FatturaService — emettiFattura non blocca le note di credito (AVOIR)
      causa: la creazione di un AVOIR lo imposta nativamente a EMESSA. L'endpoint /emetti non blocca esplicitamente la transizione se si ritenta l'emissione, restituendo 200 OK invece di 400 Bad Request.
      soluzione: aggiungere in emettiFattura un check rigoroso sullo stato iniziale: if(fattura.getStato() != StatoFattura.BOZZA) throw new IllegalArgumentException("Solo le bozze possono essere emesse");

[ ] CreaFatturaRequest — accettazione sconti negativi
      causa: manca la validazione JSR-380 sul campo remiseGlobale, permettendo di inviare valori sotto lo zero che sballano il calcolo del Netto a Pagare.
      soluzione: aggiungere @PositiveOrZero(message = "Lo sconto non può essere negativo") sul campo remiseGlobale nel DTO.
```

---

### 🏗️ Infrastruttura

```
[ ] Separare DataInitializer con @Profile("dev")
[ ] Configurare profilo produzione (application-prod.properties)
[ ] Configurare PostgreSQL in produzione (ora probabilmente H2 o configurazione locale)
[ ] Logging strutturato — aggiungere @Slf4j nei service principali
[ ] Gestione upload logo azienda — endpoint multipart, salvataggio su disco o storage
```
