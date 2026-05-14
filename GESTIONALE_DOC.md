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


**Isolamento dati:** ADMIN A non vede mai dati di ADMIN B e viceversa.
Il `boutiqueId` nel JWT garantisce che ogni dipendente operi solo sul suo negozio.

---

## Architettura dei Package

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
| `GET /api/v2/dashboard/**` | SUPER_ADMIN, ADMIN, DIPENDENTE |
| `GET /api/v2/export/**` | SUPER_ADMIN, ADMIN, DIPENDENTE |
| `* /api/v2/ricariche/**` | SUPER_ADMIN, ADMIN, DIPENDENTE |
| `* /api/v2/fatture/**` | SUPER_ADMIN, ADMIN, DIPENDENTE |
| `* /api/v2/azienda/**` | ADMIN |

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

### 6. Fatture
**Entity:** `Fattura` — ha `numero`, `tipo` (TipoDocumento), `stato` (StatoFattura), `dataEmissione`, `nomeCliente`, `timbreFiscal`, `remiseGlobale`, `totaleHT`, `totaleTVA`, `totaleNet`, riferimento all'`admin` e alla `boutique` (opzionale).
**Entity:** `RigaFattura` — ha `descrizione`, `quantita`, `prezzoUnitarioHT`, `aliquotaTVA`, `montanteHT`, riferimento alla `fattura`.
**Entity:** `DatiAzienda` — OneToOne con `Utente` Admin, ha `ragioneSociale`, `indirizzo`, `matriculeFiscale`, `logo` (base64 nel DB).

**Tipi documento:** `FATTURA`, `BON_DE_LIVRAISON`, `DEVIS`, `AVOIR`
**Stati fattura:** `BOZZA`, `EMESSA`, `ANNULLATA`

**Logica chiave:**
- Numerazione automatica annuale per Admin: `FAC-YYYY-NNNN` — gestita da `ContatoreFatturaService` con `@Lock(PESSIMISTIC_WRITE)` per evitare race condition
- Il calcolo dei totali (HT, TVA, Timbre, Netto) avviene nel service, mai nell'entity
- Un AVOIR creato tramite `POST /api/v2/fatture` o `POST /api/v2/fatture/{id}/avoir` viene emesso direttamente in stato `EMESSA` e la fattura origine passa in `ANNULLATA`
- Non è possibile emettere un AVOIR su un documento che è già un AVOIR
- `emettiFattura` blocca l'emissione se `totaleNet < 0` (protezione contro remise globale eccessiva)
- Ownership verificata su ogni operazione; SUPER_ADMIN bypassa il check

**Operazioni:**
- `POST /api/v2/fatture` — crea fattura (BOZZA) o AVOIR (EMESSA immediata)
- `PUT /api/v2/fatture/{id}` — modifica (solo se BOZZA)
- `PATCH /api/v2/fatture/{id}/emetti` — porta da BOZZA a EMESSA
- `POST /api/v2/fatture/{id}/avoir` — crea nota di credito dalla fattura EMESSA
- `GET /api/v2/fatture` — lista fatture (DIPENDENTE: sua boutique; ADMIN: tutte le sue; SUPER_ADMIN: tutte)
- `GET /api/v2/fatture/{id}` — dettaglio singola fattura
- `DELETE /api/v2/fatture/{id}` — elimina (solo se BOZZA; per annullare una EMESSA usare AVOIR)

**Ruoli ammessi:** SUPER_ADMIN, ADMIN, DIPENDENTE su tutti gli endpoint `/api/v2/fatture/**`

**Vincoli di business:**
- Solo fatture in stato `BOZZA` possono essere modificate o eliminate
- Solo fatture in stato `EMESSA` possono generare un AVOIR
- `fattureAbilitate` su Boutique: se `false`, la creazione lancia eccezione (controllo solo in scrittura — vedi TODO)

---

## Gestione Errori

`GlobalExceptionHandler` intercetta:
- `IllegalArgumentException` → HTTP 400 con `{ "errore": "messaggio specifico" }`
- `IllegalStateException` → HTTP 400 con `{ "errore": "messaggio specifico" }` + log.error
- `MethodArgumentNotValidException` → HTTP 400 con `{ "errore": "campo: messaggio, ..." }` (errori Bean Validation)
- `Exception` (generico) → HTTP 500 con `{ "errore": "Errore interno del server" }` + log.error

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
| CRITICA | Infra | DataInitializer attivo in produzione (password note in chiaro) | ✅ risolto |
| CRITICA | Security | UtenteController.creaAdmin senza doppia protezione (solo SecurityConfig) | ✅ risolto |
| CRITICA | Logica | DashboardController — NPE per ADMIN su /riepilogo (boutiqueId null) | ✅ risolto |
| CRITICA | Security | JwtFilter — token invalido (firma errata o malformato) trattato come anonimo invece di 401 | ✅ risolto |
| CRITICA | Validation | GlobalExceptionHandler — MethodArgumentNotValidException non gestita → 500 (tutti i @Valid silenziosi) | ✅ risolto |
| CRITICA | Logica | CreaFatturaRequest.tipo senza @NotNull → NPE in ContatoreFatturaService.generaNumero | ✅ risolto |
| ALTA | Business | TariffaService — Margine negativo (acquisto > vendita) non bloccato | da fare |
| ALTA | Logica | Boutique / Ricariche — Errore 500 su IDOR o parametri mancanti | da fare |
| ALTA | Logica | RicaricaService — ADMIN non può modificare/eliminare proprie ricariche (NPE/false su equals(null)) | ✅ risolto |
| ALTA | Logica | FatturaService — SUPER_ADMIN bloccato su tutte le operazioni (ownership check rigido) | ✅ risolto |
| ALTA | Logica | FatturaService — getFatture restituisce lista vuota per SUPER_ADMIN | ✅ risolto |
| ALTA | Logica | FatturaService — emettiFattura/eliminaFattura bloccate per SUPER_ADMIN | ✅ risolto |
| ALTA | Logica | TariffaService — SUPER_ADMIN bloccato su modifica/eliminazione tariffe | ✅ risolto |
| ALTA | Coerenza | FatturaRepository.existsByNumero non scoped per admin (numeri collidono tra admin) | ✅ risolto |
| ALTA | Coerenza | FatturaController — modificaFattura/emettiFattura/eliminaFattura non passano ruolo al service | ✅ risolto |
| ALTA | Coerenza | SecurityConfig fatture — SUPER_ADMIN escluso da POST/PUT/DELETE/PATCH | ✅ risolto (tutti gli endpoint /fatture/** aperti a SUPER_ADMIN, ADMIN, DIPENDENTE) |
| MEDIA | Security | SecurityConfig — Ritorna 403 invece di 401 su token scaduti/invalidi | da fare |
| MEDIA | Logica | TariffaService.salvaOAggiorna / getListinoCompleto non gestiscono SUPER_ADMIN | da fare |
| MEDIA | Logica | DashboardService.getRiepilogoAdmin restituisce vuoto per SUPER_ADMIN | da fare |
| MEDIA | Logica | ExportService.generaReport produce file vuoto per SUPER_ADMIN | da fare |
| MEDIA | Logica | DashboardService — entita Utente detached in getRiepilogoAdmin | ✅ risolto |
| MEDIA | Logica | ExportService — entita Utente detached in generaReport | ✅ risolto |
| MEDIA | Logica | FatturaService — AVOIR creato in stato BOZZA invece di EMESSA | ✅ risolto |
| MEDIA | Concorrenza | ContatoreFatturaService — race condition su creazione contatore | ✅ risolto |
| MEDIA | Validation | CreaRicaricaRequest senza @NotBlank/@Positive + @Valid mancante nel controller | ✅ risolto |
| MEDIA | Validation | CreaFatturaRequest / RigaFatturaRequest — validazioni incomplete, @Valid su lista righe mancante | ✅ risolto |
| MEDIA | Validation | GlobalExceptionHandler — IllegalStateException → 500 invece di 400 | ✅ risolto |
| MEDIA | Coerenza | SecurityConfig dashboard — endpoint disallineati dopo unificazione | ✅ risolto |
| MEDIA | Security | CorsConfig — PATCH mancante in allowedMethods | ✅ risolto |
| MEDIA | Security | CorsConfig.allowedOrigins(*) in produzione | da fare |
| MEDIA | Config | application.properties — jwt.expiration 86400000 (24h) invece di 28800000 (8h) | ✅ risolto |
| BASSA | Security | JwtService senza meccanismo invalidazione token (no blacklist) | da fare |
| BASSA | Logica | Ricarica.note presente ma mai valorizzato | ✅ risolto |
| BASSA | Logica | RicaricaService.eliminaRicaricaSuperAdmin — doppia query inutile | ✅ risolto |
| BASSA | Logica | BoutiqueController crea boutique senza defense-in-depth nel service | da fare |
| BASSA | Logging | DataInitializerService — System.out.println invece di @Slf4j | ✅ risolto |
| BASSA | Logging | JwtFilter non logga request URI nei warning di token | da fare |
| MEDIA | Validation | GlobalExceptionHandler — HttpMessageNotReadableException (JSON malformato) non gestita → 500 | ✅ risolto (gestisciJsonMalformato → 400) |
| MEDIA | Validation | GlobalExceptionHandler — MethodArgumentTypeMismatchException (type mismatch URL) non gestita → 500 | ✅ risolto (gestisciTipoErrato → 400) |
| MEDIA | Validation | GlobalExceptionHandler — Enum Jackson non riconosciuto causa 500 | ✅ risolto (catturato da HttpMessageNotReadableException → 400 con messaggio generico) |

---

## TODO — Backlog Feature

Aggiungere nuove voci liberamente in fondo a ogni sezione.
Formato: `[ ]` da fare — `[x]` fatto — `[-]` scartato con motivazione.

---

### Fatture

[x] Entity Fattura — legata a Boutique, visibile all'Admin proprietario
[x] Entity RigaFattura — OneToMany con Fattura (descrizione, qty, prezzo HT, aliquota TVA)
[x] Entity DatiAzienda — OneToOne con Utente Admin
campi: ragione sociale, indirizzo, matricule fiscale, logo (base64 nel DB)
[x] Tipi documento: Facture, Bon de livraison, Devis, Avoir
[x] Numerazione automatica annuale per Admin: FAC-YYYY-NNNN
ContatoreFattura estratto in ContatoreFatturaService con @Transactional(MANDATORY)
e @Lock(PESSIMISTIC_WRITE) sul repository — race condition risolta
[x] Timbre fiscal — toggle on/off, valore fisso configurabile
[x] Remise globale — sconto in DT sul totale documento
[x] Calcolo automatico: Totale HT, TVA per riga, Timbre, Netto a Pagare
[x] Endpoint: GET /api/v2/fatture (lista per boutique o per admin)
[x] Endpoint: POST /api/v2/fatture
[x] Endpoint: GET /api/v2/fatture/{id}
[x] Endpoint: DELETE /api/v2/fatture/{id} — solo se status = BOZZA, altrimenti emettere Avoir
[x] Stati Fattura: BOZZA, EMESSA, ANNULLATA
[x] Endpoint emissione fattura (BOZZA -> EMESSA)
[x] emettiFattura blocca correttamente AVOIR e fatture già emesse (check stato != BOZZA)
[x] creaFattura — AVOIR emesso direttamente in stato EMESSA (fix bug: era in BOZZA)
dataEmissione forzata a LocalDate.now() per coerenza con creaAvoir dedicato
[ ] Export PDF — valutare Apache PDFBox (licenza libera) vs iText (licenza da verificare)
[ ] Watermark/logo aziendale nell'anteprima PDF
[ ] Validare che la somma delle righe sia > 0 prima di emettere
[ ] Flag fattureAbilitate su Boutique controllato anche in lettura (oggi solo in scrittura)


---

### 👤 Profilo & Anagrafica

[ ] Aggiungere campi a Boutique: indirizzo completo, telefono
[ ] Endpoint profilo Boutique — restituisce boutique + lista dipendenti associati
[ ] Endpoint profilo Admin — dati personali + lista boutique + dati azienda
[ ] Endpoint cambio password — disponibile a tutti i ruoli per la propria utenza
nota: non prioritario, l'Admin può reimpostare la password del dipendente
[ ] Gestione multi-dipendente per Boutique — rimandato, ora 1 account per boutique


---

### 📊 Report & Dashboard

[ ] Report mensile — aggregato per mese, visibile all'Admin (tutte le sue boutique)
[ ] Report annuale — aggregato per anno, visibile all'Admin
[ ] Statistiche per operatore — ricariche e profitto per Ooredoo/Orange/Telecom/Fisso
[ ] Dati grafici dashboard Admin — trend per periodo, breakdown per operatore
nota: il backend espone dati aggregati JSON, i grafici sono lato frontend
[x] Dashboard dipendente — riepilogo giornaliero per boutique implementato


---

### 🔍 Ricerca & Navigazione

[ ] Ricerca ricariche per numero cliente
endpoint: GET /api/v2/ricariche?numero=XXXXXXXX
[ ] Paginazione lista ricariche
endpoint: GET /api/v2/ricariche?page=0&size=20
[ ] Paginazione lista fatture
[ ] Filtro ricariche per operatore
[ ] Filtro ricariche per range date (già implementato nell'export, da esporre anche come API)


---

### Sicurezza & Qualità

[ ] Sostituire allowedOrigins("*") con URL frontend in produzione
nota: con allowCredentials true il wildcard è invalido per spec CORS
[ ] Valutare blacklist token JWT per invalidazione anticipata (es. cambio password, logout)
[x] Aggiungere @NotBlank / @Positive / @Valid sui DTO — fatto sui DTO principali
- CreaRicaricaRequest: numero, giga, costoEffettivo/costoCliente ✅
- CreaFatturaRequest: nomeCliente, righe (@Valid + @NotEmpty), remiseGlobale (@PositiveOrZero) ✅
- RigaFatturaRequest: descrizione, quantita, prezzoUnitarioHT, aliquotaTVA ✅
  [ ] Ancora da fare: CreaBoutiqueRequest, CreaAdminRequest, LoginRequest, DatiAziendaRequest
  [x] Aggiungere @PreAuthorize("hasRole('SUPER_ADMIN')") su UtenteController.creaAdmin — fatto
  [-] Soft delete Ricarica — SCARTATO: in contabilità tunisina si emette Avoir, non si cancella
  [ ] DataInitializer — annotare con @Profile("dev") prima del deploy in produzione
  gravità: CRITICA — crea utenti con password note ("admin123")
  [ ] JWT secret — verificare che in produzione sia >= 256 bit casuale, non hardcoded nel repo
  [ ] Password policy — minima lunghezza, complessità, scadenza periodica
  [ ] Rate limiting su /api/v2/auth/login per prevenire brute force
  [ ] Audit log delle azioni sensibili (creazione admin, emissione fatture, modifiche tariffe)


---

### Bug Noti & Debito Tecnico

[ ] Bug Margine Negativo: Il sistema permette il salvataggio di tariffe dove costoAcquisto > prezzoVendita. È necessaria una validazione cross-field nel DTO o un controllo logico nel TariffaService prima del salvataggio.

[ ] Bug Gestione Eccezioni (500): Chiamate a endpoint come GET /api/v2/boutique/{id} (IDOR) o GET /api/v2/ricariche (senza parametri) restituiscono un errore 500 invece di un 403/404 o 400. Probabile NullPointerException o gestione mancante di parametri obbligatori.

[ ] Incoerenza Status Code Auth: I test su token scaduti o firme manipolate restituiscono 403 Forbidden invece del più corretto 401 Unauthorized. È necessario configurare un AuthenticationEntryPoint personalizzato in SecurityConfig.

[x] @Data su tutte le entity JPA
sostituito con @Getter @Setter @EqualsAndHashCode(onlyExplicitlyIncluded = true) + @EqualsAndHashCode.Include su id

[x] LazyInitializationException su getFatture e getFatturaById in FatturaService
aggiunto @Transactional(readOnly = true) su entrambi i metodi

[x] TariffaController, RicaricaController, BoutiqueController esponevano entity JPA direttamente
creati TariffaResponse, RicaricaResponse, BoutiqueResponse con mapping toResponse() nei service

[x] ExportService restituiva file vuoto per ADMIN (boutiqueId null)
aggiunto utenteId al generaReport, per ADMIN aggrega le ricariche di tutte le sue boutique

[x] SUPER_ADMIN NPE su eliminaRicarica e modificaRicarica
aggiunto bypass ruolo con short-circuit in RicaricaService, ruolo passato dal controller

[x] ContatoreFatturaService — race condition su creazione contatore
estratto in service dedicato con @Transactional(MANDATORY) e @Lock(PESSIMISTIC_WRITE)
constraint UNIQUE su (admin_id, anno) come ulteriore protezione

[x] RicaricaService — modificaRicarica/eliminaRicarica falliscono per ADMIN
implementati modificaRicaricaAdmin e eliminaRicaricaAdmin con routing per ruolo (switch)
check ownership: r.getBoutique().getAdmin().getId().equals(utenteId)

[x] DashboardController — NPE per ADMIN su GET /riepilogo (boutiqueId null)
endpoint /admin e /riepilogo unificati in /riepilogo con routing per ruolo nel controller

[x] DashboardService — entità Utente detached in getRiepilogoAdmin
sostituito new Utente() + setId() con boutiqueRepository.findByAdminId(adminId)

[x] ExportService — entità Utente detached in generaReport
sostituito new Utente() + setId() con boutiqueRepository.findByAdminId(utenteId)

[x] JwtFilter — token invalido (parsabile ma firma errata) trattato come anonimo invece di 401
aggiunto sendError(SC_UNAUTHORIZED) + return nel ramo isTokenValido == false

[x] RicaricaService — campo note mai salvato in popolaDatiRicarica
aggiunto r.setNote(request.getNote())

[x] RicaricaService.eliminaRicaricaSuperAdmin — due query inutili (existsById + deleteById)
sostituito con findById().orElseThrow() + deleteById()

[x] ContatoreFatturaService — race condition su primo contatore a inizio anno
aggiunto inizializzaContatore() chiamato da creaAdmin e DataInitializer
generaNumero usa orElseThrow() — il record è garantito esistere
inizializzaContatore usa Propagation.REQUIRES_NEW per commit immediato

[x] SecurityConfig — endpoint dashboard disallineati dopo unificazione
sostituiti /dashboard/admin e /dashboard/riepilogo con /dashboard/
ruoli: SUPER_ADMIN, ADMIN, DIPENDENTE

[x] DataInitializerService — System.out.println sostituito con @Slf4j + log.info()

[x] FatturaService — emettiFattura non bloccava correttamente le note di credito (AVOIR)
il check stato != BOZZA blocca già correttamente qualsiasi tentativo di riemissione

[x] FatturaRepository.existsByNumero è globale (non scoped per admin) — era codice morto
metodo rimosso dal repository; il repository espone solo findByAdminId e findByBoutiqueId

[x] FatturaController — modificaFattura, emettiFattura, eliminaFattura non passavano ruolo al service
tutti e tre i metodi passano principal.getRuolo() allineati con il pattern di RicaricaController

[x] CreaRicaricaRequest — validazione mancante a livello DTO
aggiunti @NotBlank su numero, @Positive su giga, @Positive su costoEffettivo/costoCliente quando manuale=true
aggiunto @Valid su @RequestBody nel controller

[x] CreaFatturaRequest e RigaFatturaRequest — validazione incompleta
aggiunti @Valid su lista righe nel DTO e @Valid su @RequestBody nel controller (FatturaController già usa @Valid)

[x] UtenteController — POST /api/v2/utenti/admin senza doppia protezione
aggiunto @PreAuthorize("hasRole('SUPER_ADMIN')") sul controller (defense-in-depth)

[x] SecurityConfig — incoerenza permessi fatture
GET /api/v2/fatture/ era aperto a SUPER_ADMIN ma POST/PUT/DELETE/PATCH no
risolto: matcher unificato .requestMatchers("/api/v2/fatture/").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")

[ ] DashboardService — getRiepilogoBoutique non valida che la boutique appartenga al dipendente
nota: boutiqueId dal JWT è affidabile, manca solo defense-in-depth
soluzione: query JPQL con doppio filtro boutique_id + utente associato

[ ] JwtFilter — eccezioni JWT senza correlazione con la request
soluzione: includere request URI / IP nel log, usare MDC per tracciabilità

[ ] JwtService — nessuna invalidazione token
effetto: dopo cambio password o logout il vecchio token resta valido fino a scadenza
soluzione: blacklist in Redis o riduzione durata + refresh token

[ ] DataInitializer — attivo anche in produzione (vedi sezione Sicurezza & Qualità)


---

### SUPER_ADMIN — Funzionalità da Completare

[ ] Logica Listino SuperAdmin: Il POST /tariffe effettuato da un SUPER_ADMIN viene accettato (200 OK), ma il sistema non dovrebbe permettere a questo ruolo di possedere un listino proprio. Va implementato un blocco o una gestione per cui il SuperAdmin possa operare solo sui listini degli Admin.

[x] RicaricaService — bypass ownership implementato (ruolo passato dal token)

[ ] TariffaService — modificaTariffa ed eliminaTariffa rifiutano il SUPER_ADMIN
causa: check tariffa.getAdmin().getId().equals(adminId) fallisce
soluzione: bypass ruolo identico a RicaricaService

[ ] TariffaService — salvaOAggiorna e getListinoCompleto usano adminId del SUPER_ADMIN
soluzione: SUPER_ADMIN passa adminId esplicito nel body

[x] FatturaService — verificaOwnership rifiutava il SUPER_ADMIN
verificaOwnership() fa return immediato se ruolo == "SUPER_ADMIN"

[x] FatturaService — getFatture restituiva lista vuota per il SUPER_ADMIN
nel ramo SUPER_ADMIN usa fatturaRepository.findAll()

[x] FatturaService — emettiFattura/eliminaFattura bloccate per SUPER_ADMIN
entrambi chiamano verificaOwnership() che bypassa SUPER_ADMIN — nessun intervento aggiuntivo necessario

[ ] DashboardService — getRiepilogoAdmin restituisce vuoto per il SUPER_ADMIN
soluzione: per SUPER_ADMIN usare boutiqueRepository.findAll()

[ ] ExportService — generaReport produce file vuoto per SUPER_ADMIN
soluzione: per SUPER_ADMIN aggregare tutte le ricariche del sistema

[ ] BoutiqueService — nessun percorso SUPER_ADMIN su getBoutiqueByAdmin
nota: SUPER_ADMIN ha già /tutte; valutare se serve filtrare per adminId specifico

[ ] DatiAziendaService — nessun intervento necessario
SecurityConfig limita /api/v2/azienda/ solo ad ADMIN, corretto by design


---

### 🏗️ Infrastruttura

[x] Separare DataInitializer con @Profile("dev")
[ ] Configurare profilo produzione (application-prod.properties)
[ ] Configurare PostgreSQL in produzione (ora probabilmente H2 o configurazione locale)
[ ] Logging strutturato — aggiungere @Slf4j nei service principali
[ ] Gestione upload logo azienda — endpoint multipart, salvataggio su disco o storage


### NOTE
ricorda di cambiare il db in update nel proprieties

[NOTA TEST] Verificare la tenuta del sistema con payload di login massivi (DoS bait) e la corretta propagazione dei messaggi di errore (es. il messaggio "Boutique non trovata" che differisce per lunghezza dai 400 standard).

[APERTO] Bug Sconto Negativo: La remiseGlobale non viene validata alla creazione/modifica della fattura.
Il sistema blocca correttamente l'EMISSIONE se totaleNet < 0 (check in emettiFattura),
ma permette di salvare una BOZZA con sconto eccessivo.
Da fare: aggiungere validazione @PositiveOrZero su remiseGlobale nel DTO e/o check nel service
che remiseGlobale <= totaleHT prima di salvare.

[RISOLTO] Bug Paradosso Avoir: Il sistema bloccava la creazione di un AVOIR a partire da un AVOIR.
Risolto in gestisciAvoirOrigine() e creaAvoir() con check esplicito origine.getTipo() == TipoDocumento.AVOIR.

[RISOLTO] Bug NPE per assenza di Validazione: GlobalExceptionHandler gestisce MethodArgumentNotValidException → 400.
FatturaController usa @Valid su tutti i @RequestBody.

[RISOLTO] Bug Errori 500 su Type Mismatch: GlobalExceptionHandler gestisce HttpMessageNotReadableException
e MethodArgumentTypeMismatchException → 400 Bad Request.

[RISOLTO] Bug Enum Parsing: Jackson non riconosceva enum non validi (es. Operatore "SPACEX").
Catturato da HttpMessageNotReadableException nel GlobalExceptionHandler → 400 con messaggio generico.

[APERTO] Bug 500 su parametri mancanti nell'export: GET /api/v2/export/ricariche senza dal/al
(o con solo uno dei due) restituisce 500 invece di 400.
Causa: GlobalExceptionHandler non gestisce MissingServletRequestParameterException,
che Spring lancia quando un @RequestParam obbligatorio è assente.
Fix: aggiungere @ExceptionHandler(MissingServletRequestParameterException.class)
nel GlobalExceptionHandler → return 400 con messaggio "Parametro mancante: {name}"