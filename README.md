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

## TODO — Backlog Feature

Aggiungere nuove voci liberamente in fondo a ogni sezione.
Formato: `[ ]` da fare — `[x]` fatto — `[-]` scartato con motivazione.

---

### 🧾 Fatture

```
[ ] Entity Fattura — legata a Boutique, visibile all'Admin proprietario
[ ] Entity RigaFattura — OneToMany con Fattura (descrizione, qty, prezzo HT, aliquota TVA)
[ ] Entity DatiAzienda — OneToOne con Utente Admin
      campi: ragione sociale, indirizzo, matricule fiscale, logo (base64 nel DB)
      nota: OneToOne — un Admin ha una sola ragione sociale; base64 scelto per semplicità cloud (1-2 loghi, S3 overkill)
[ ] Tipi documento: Facture, Bon de livraison, Devis, Avoir
      nota: Avoir sostituisce il soft delete — per annullare si emette un Avoir
[ ] Numerazione automatica annuale per Admin: FAC-YYYY-NNNN
      nota: contatore unico per Admin, non per Boutique (stesso numero aziendale)
[ ] Timbre fiscal — toggle on/off, valore fisso configurabile
[ ] Remise globale — sconto in DT sul totale documento
[ ] Calcolo automatico: Totale HT, TVA per riga, Timbre, Netto a Pagare
[ ] Export PDF — valutare Apache PDFBox (licenza libera) vs iText (licenza da verificare)
[ ] Watermark/logo aziendale nell'anteprima PDF
[ ] Endpoint: GET /api/v2/fatture (lista per boutique o per admin)
[ ] Endpoint: POST /api/v2/fatture
[ ] Endpoint: GET /api/v2/fatture/{id}
[ ] Endpoint: DELETE /api/v2/fatture/{id} — solo se status = BOZZA, altrimenti emettere Avoir
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

### 🔒 Sicurezza & Qualità

```
[ ] Sostituire allowedOrigins("*") con URL frontend in produzione
[ ] Valutare blacklist token JWT per invalidazione anticipata (es. cambio password)
[ ] Aggiungere @NotBlank / @Valid sui DTO che ancora mancano di validazione (CreaRicaricaRequest)
[-] Soft delete Ricarica — SCARTATO: in contabilità tunisina si emette Avoir, non si cancella
[ ] DataInitializer — rimuovere o disabilitare prima del deploy in produzione
      nota: usare profilo Spring @Profile("dev") per isolarlo
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
