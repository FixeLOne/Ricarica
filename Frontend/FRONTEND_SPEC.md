## Stack

- **Framework:** React 19 + Vite 8
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 + shadcn/ui (preset Nova, libreria Radix)
- **Animazioni:** Framer Motion
- **Form:** React Hook Form + Zod
- **Grafici:** Recharts
- **HTTP:** Axios (già configurato in `src/api/axiosClient.js`)
- **State globale:** React Context (AuthContext + ThemeContext)

---

## Struttura Cartelle

```
src/
├── api/
│   ├── axiosClient.js
│   ├── authApi.js
│   ├── dashboardApi.js
│   ├── ricaricheApi.js
│   ├── fattureApi.js
│   ├── boutiqueApi.js
│   ├── tariffaApi.js
│   ├── utenteApi.js
│   ├── exportApi.js
│   └── aziendaApi.js
├── components/
│   ├── ui/                  ← shadcn/ui (Button, Input, Table, Modal, Toast...)
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   └── AppLayout.jsx
│   └── shared/
│       ├── PageHeader.jsx
│       ├── DataTable.jsx
│       ├── StatCard.jsx
│       ├── ConfirmDialog.jsx
│       ├── ThemeToggle.jsx
│       └── ErrorMessage.jsx
├── context/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── hooks/
│   ├── useAuth.js
│   └── usePagination.js
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dipendente/
│   │   └── DashboardDipendente.jsx
│   ├── ricariche/
│   │   └── RicarichePage.jsx         ← unica pagina per tutti i ruoli
│   ├── fatture/
│   │   ├── FattureListPage.jsx
│   │   └── FatturaEditorPage.jsx
│   ├── admin/
│   │   ├── DashboardAdmin.jsx
│   │   ├── TariffePage.jsx
│   │   ├── BoutiquePage.jsx
│   │   ├── AziendaPage.jsx
│   │   └── ExportPage.jsx
│   └── superadmin/
│       ├── DashboardSuperAdmin.jsx
│       ├── AdminListPage.jsx
│       └── BoutiqueTuttePage.jsx
├── lib/
│   ├── operatori.js
│   └── utils.js
└── router/
    ├── AppRouter.jsx
    └── ProtectedRoute.jsx
```

---

## Stato Implementazione Attuale

Aggiornato al 27/05/2026.

- Implementato: login, layout principale, sidebar/topbar, tema, pagina ricariche, pagina tariffe base.
- Placeholder/work in progress: dashboard dipendente/admin/superadmin, fatture, editor fattura, boutique, tutte le boutique, azienda, export, gestione admin.
- `SUPER_ADMIN` è tracciato nel contratto ma non è prioritario: i problemi specifici di selezione `adminId` e creazione ricariche sono backlog non urgente.
- La pagina `/azienda` resta solo ADMIN; il `GET /azienda` via API è invece intenzionalmente accessibile anche ai DIPENDENTI per generare fatture con i dati pubblici dell'azienda.

---

## Autenticazione e AuthContext

Al login il backend restituisce:
```json
{ "token": "...", "username": "...", "ruolo": "DIPENDENTE|ADMIN|SUPER_ADMIN", "boutiqueId": 1 }
```

`AuthContext` deve:
- Salvare token, username, ruolo, boutiqueId in `localStorage`
- Esporre `login(username, password)`, `logout()`, `utente`, `isLogged`
- `axiosClient.js` legge già il token da `localStorage` automaticamente
- Su 401 (non login) `axiosClient.js` fa già `localStorage.clear()` + redirect `/login`

---

## Ruoli e Accesso alle Pagine

| Pagina | DIPENDENTE | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|
| `/login` | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ |
| `/ricariche` | ✅ | ✅ | ✅ |
| `/fatture` | ✅ | ✅ | ✅ |
| `/tariffe` | ❌ | ✅ | ✅ |
| `/boutique` | ❌ | ✅ | ✅ |
| `/export` | ❌ | ✅ | ✅ |
| `/azienda` | ❌ | ✅ | ❌ |
| `/admin-list` | ❌ | ❌ | ✅ |
| `/boutique/tutte` | ❌ | ❌ | ✅ |

Nota: i dipendenti non accedono alla pagina di gestione `/azienda`, ma possono chiamare `GET /azienda` dal flusso fatture quando serve mostrare intestazione/logo aziendale sui documenti.

---

## API — Endpoint Attivi

### Auth
| Metodo | Endpoint | Note |
|---|---|---|
| POST | `/auth/login` | `{ username, password }` → `{ token, username, ruolo, boutiqueId }` |

### Dashboard
| Metodo | Endpoint | Risposta |
|---|---|---|
| GET | `/dashboard/riepilogo` | DIPENDENTE: `DashboardRiepilogo` / ADMIN+SUPER_ADMIN: `DashboardAdminRiepilogo[]` |

### Ricariche
| Metodo | Endpoint | Note |
|---|---|---|
| GET | `/ricariche?page=0&size=20&sort=dataOra,desc` | Filtra per ruolo dal JWT |
| POST | `/ricariche` | Crea ricarica |
| PUT | `/ricariche/{id}` | Modifica |
| DELETE | `/ricariche/{id}` | Elimina |

### Fatture
| Metodo | Endpoint | Note |
|---|---|---|
| GET | `/fatture?page=0&size=20&sort=dataEmissione,desc` | Filtra per ruolo |
| GET | `/fatture/{id}` | Dettaglio con righe |
| POST | `/fatture` | Crea documento |
| PUT | `/fatture/{id}` | Modifica (solo BOZZA) |
| PATCH | `/fatture/{id}/emetti` | BOZZA → EMESSA |
| POST | `/fatture/{id}/avoir` | Crea nota credito |
| DELETE | `/fatture/{id}` | Elimina (solo BOZZA) |

### Boutique
| Metodo | Endpoint | Ruoli | Note |
|---|---|---|---|
| GET | `/boutique` | ADMIN | Boutique dell'admin loggato |
| GET | `/boutique/tutte` | SUPER_ADMIN | Tutte le boutique |
| GET | `/boutique/{id}` | ADMIN, SUPER_ADMIN | Singola boutique |
| POST | `/boutique` | ADMIN | Crea boutique + account dipendente |
| PATCH | `/boutique/{id}/fatture?abilitato=true\|false` | ADMIN | Abilita/disabilita fatture |

### Tariffe
| Metodo | Endpoint | Ruoli | Note |
|---|---|---|---|
| GET | `/tariffe` | ADMIN, SUPER_ADMIN | Accetta `?adminId=` (solo SUPER_ADMIN) |
| POST | `/tariffe` | ADMIN, SUPER_ADMIN | Upsert per operatore+giga |
| PUT | `/tariffe/{id}` | ADMIN, SUPER_ADMIN | Modifica |
| DELETE | `/tariffe/{id}` | ADMIN, SUPER_ADMIN | Elimina |

### Export
| Metodo | Endpoint | Ruoli | Note |
|---|---|---|---|
| GET | `/export/ricariche?dal=YYYY-MM-DD&al=YYYY-MM-DD` | ADMIN, SUPER_ADMIN | Risposta: blob `.xlsx` da scaricare |

### Azienda
| Metodo | Endpoint | Ruoli | Note |
|---|---|---|---|
| GET | `/azienda` | ADMIN, DIPENDENTE | Dati azienda pubblici per intestazione fatture; per DIPENDENTE devono essere quelli dell'admin proprietario della boutique |
| PUT | `/azienda` | ADMIN             | Upsert       |

### Utenti
| Metodo | Endpoint | Ruoli | Note |
|---|---|---|---|
| POST | `/utenti/admin` | SUPER_ADMIN | Crea nuovo Admin |

---

## DTO — Struttura Dati

### Login
```js
// Request
{ username: string, password: string }
// Response
{ token: string, username: string, ruolo: string, boutiqueId: number | null }
```

### DashboardRiepilogo (DIPENDENTE)
```js
{
  totaleOperazioni: number,
  profittoTotale: string   // BigDecimal → string
}
```

### DashboardAdminRiepilogo (ADMIN / SUPER_ADMIN)
```js
// Array di:
{
  boutiqueId: number,
  nome: string,
  totaleOperazioni: number,
  profittoTotale: string
}
```

### RicaricaResponse
```js
{
  id: number,
          dataOra: string,         // ISO datetime — mostrare data + orario
          dataSolo: string,        // ISO date — ignorare in UI, usato solo internamente
          numero: string,          // 8 cifre
          operatore: string,       // "OOREDOO" | "ORANGE" | "TELECOM" | "FISSO"
          giga: string,            // BigDecimal → string
          costoEffettivo: string,
          costoCliente: string,
          profitto: string,
          note: string | null,
          manuale: boolean,       // true solo per inserimenti liberi/manuali
          boutiqueId: number,
          boutiqueNome: string     // nome del negozio — mostrare solo per ADMIN e SUPER_ADMIN
}
```

### CreaRicaricaRequest
```js
{
  numero: string,          // 8 cifre, @NotBlank
          giga: number,            // @Positive
          manuale: boolean,
          costoEffettivo?: number, // solo se manuale=true
          costoCliente?: number,   // solo se manuale=true
          note?: string,
          boutiqueId?: number      // obbligatorio per ADMIN (selezione boutique nel form), ignorato per DIPENDENTE
}
```

### FatturaResponse
```js
{
  id: number,
  numero: string,                // es. "FAC-2025-0001"
  tipo: string,                  // "FATTURA"|"BON_DE_LIVRAISON"|"DEVIS"|"AVOIR"
  stato: string,                 // "BOZZA"|"EMESSA"|"ANNULLATA"
  dataEmissione: string,         // ISO date
  nomeCliente: string | null,
  timbreFiscal: boolean,
  remiseGlobale: string,         // BigDecimal
  totaleHT: string,
  totaleTVA: string,
  totaleNet: string,
  nomeBoutique: string | null,   // ⚠️ nome stringa, NON boutiqueId
  righe: RigaFatturaResponse[],
  fatturaOrigineNumero: string | null  // valorizzato solo per AVOIR
}
```

### CreaFatturaRequest
```js
{
  tipo: string,                  // @NotNull
  dataEmissione?: string,        // ISO date, default oggi
  nomeCliente?: string,          // opzionale, max 150 char, no < >
  timbreFiscal?: boolean,        // default false
  remiseGlobale: number,         // @NotNull, @DecimalMin(0)
  righe: RigaFatturaRequest[],   // @NotEmpty
  fatturaOrigineId?: number,     // solo per AVOIR
  boutiqueId?: number            // obbligatorio per ADMIN, ignorato per DIPENDENTE
}
```

### RigaFatturaRequest
```js
{
  descrizione: string,           // @NotBlank, no < >
  quantita: number,              // @Positive, BigDecimal
  prezzoUnitarioHT: number,      // @PositiveOrZero
  aliquotaTVA: number            // 0–100
}
```

### RigaFatturaResponse
```js
{
  id: number,
  descrizione: string,
  quantita: string,              // BigDecimal
  prezzoUnitarioHT: string,
  aliquotaTVA: string,
  montanteHT: string
}
```

### BoutiqueResponse
```js
{
  id: number,
  nome: string,
  città: string,                 // attenzione: accento sulla i
  fattureAbilitate: boolean
  // ⚠️ NON ha adminId
}
```

### CreaBoutiqueRequest
```js
{
    nome: string,                  // @NotBlank
        città: string,                 // @NotBlank — con accento
        nomeAccount: string,           // @NotBlank
        usernameAccount: string,       // @NotBlank, 3–50 char
        passwordAccount: string,       // @NotBlank, min 8 char
        fattureAbilitate?: boolean     // default false — se omesso il backend usa false
}
```

### TariffaResponse
```js
{
  id: number,
  operatore: string | null,      // null = tariffa generica/standard
  giga: string,                  // BigDecimal
  costoAcquisto: string,
  prezzoVendita: string
  // ⚠️ NON ha adminId
}
```

### CreaTariffaRequest
```js
{
  operatore?: string,            // nullable = tariffa standard
  giga: number,                  // @Positive, @NotNull
  costoAcquisto: number,         // @Positive, max 8 interi 3 decimali
  prezzoVendita: number,         // @Positive, deve essere >= costoAcquisto
  adminId?: number               // solo SUPER_ADMIN, altrimenti null
}
```

### DatiAziendaResponse
```js
{
  ragioneSociale: string,
  indirizzo: string,
  matriculeFiscale: string,
  logo: string | null            // base64
}
```
I dati azienda sono considerati pubblici ai fini dei documenti emessi. Non trattarli come dato sensibile nella UI; resta sensibile solo la modifica, riservata ad ADMIN.

### DatiAziendaRequest
```js
{
  ragioneSociale: string,        // @NotBlank
  indirizzo: string,             // @NotBlank
  matriculeFiscale: string,      // @NotBlank
  logo?: string                  // base64, nullable
}
```

---

## Logica Operatori Tunisia

```js
// src/lib/operatori.js
export const OPERATORI = {
  "2": "OOREDOO", "4": "OOREDOO",
  "5": "ORANGE",
  "9": "TELECOM",
  "3": "FISSO"
};

export const COLORI_OPERATORE = {
  OOREDOO: { bg: "bg-red-100",    text: "text-red-700" },
  ORANGE:  { bg: "bg-orange-100", text: "text-orange-700" },
  TELECOM: { bg: "bg-blue-100",   text: "text-blue-700" },
  FISSO:   { bg: "bg-green-100",  text: "text-green-700" },
};
```

---

## Design System — Palette B (Stone + Amber)

### Tema Light (default)
```
Sfondo app:        #FFFBF0   (amber-50)
Sidebar:           #1C1917   (stone-900)
Card/Panel:        #FFFFFF
Bordi caldi:       #FDE68A   (amber-200)
Bordi neutri:      #E7E5E4   (stone-200)
Testo primario:    #1C1917   (stone-900)
Testo secondario:  #78716C   (stone-500)
Accento:           #F59E0B   (amber-500)
Accento hover:     #D97706   (amber-600)
Successo:          #10B981   (emerald-500)
Errore:            #EF4444   (red-500)
Warning:           #F97316   (orange-500)
```

### Tema Dark
```
Sfondo app:        #1C1917   (stone-900)
Sidebar:           #0C0A09   (stone-950)
Card/Panel:        #292524   (stone-800)
Bordi:             #44403C   (stone-700)
Testo primario:    #FAFAF9   (stone-50)
Testo secondario:  #A8A29E   (stone-400)
Accento:           #FBBF24   (amber-400)
Accento hover:     #F59E0B   (amber-500)
Successo:          #34D399   (emerald-400)
Errore:            #F87171   (red-400)
```

### Dark Mode
- Classe `dark` su `<html>` — shadcn/ui nativamente supportato
- `ThemeContext` salva preferenza in `localStorage` chiave `theme`
- `ThemeToggle.jsx` nella Topbar
- `tailwind.config.js`: `darkMode: 'class'`

### Tipografia
- Font: **Geist** — sans-serif moderno
- Fallback: `system-ui, sans-serif`

### Componenti shadcn/ui installati
`button`, `input`, `label`, `table`, `dialog`, `sheet`, `sonner`, `badge`,
`card`, `select`, `textarea`, `separator`, `skeleton`, `dropdown-menu`, `tooltip`

### Animazioni Framer Motion
- Entrata pagina: `fade + translateY(8px → 0)`, 0.25s easeOut
- Card hover: `scale(1.015)`, 0.15s
- Modal: `fade + scale(0.96 → 1)`, 0.2s
- Sidebar mobile drawer: `translateX(-100% → 0)`, 0.25s

---

## Layout Responsive

| Breakpoint | Sidebar |
|---|---|
| `lg` ≥1024px | Fissa laterale 220px |
| `md` 768–1023px | Collassata a icone 64px |
| `sm` <768px | Nascosta, hamburger → Sheet drawer |

**Pagine ottimizzate mobile** (card invece di tabelle):
- `/dashboard` — stat card impilate
- `/export` — solo date picker + bottone

**Pagine desktop-only** (scroll orizzontale su mobile):
- `/ricariche`, `/fatture`, `/tariffe`

---

## Pagine — Dettaglio

### LoginPage (`/login`)
- Form centrato, logo RechargeNet
- Campi: username, password (toggle visibilità)
- Errore backend mostrato inline
- Redirect post-login → `/dashboard` per tutti i ruoli

### Dashboard
**DIPENDENTE:** card `totaleOperazioni` (DIPENDENTE vede solo la card totaleOperazioni, il profitto non viene mostrato)

**ADMIN:** stat aggregate + tabella boutique con `nome`, `totaleOperazioni`, `profittoTotale`

**SUPER_ADMIN:** stesso layout ADMIN su tutte le boutique del sistema

### RicarichePage (`/ricariche`)
- Tabella paginata 20/pagina: `dataOra`, `numero`, `operatore` (badge colorato), `giga`, `costoCliente`, `profitto`
- Pulsante "Nuova Ricarica" → drawer con form
- Azioni riga: modifica, elimina (confirm dialog)
- Form: `numero` (8 cifre), `giga`, toggle `manuale` → se true mostra `costoEffettivo` + `costoCliente` + (note opzionale)
- Colonne tabella: dataOra (data + orario), numero, operatore (badge colorato),
    giga, costoCliente, profitto, boutiqueNome
- La colonna boutiqueNome è visibile solo per ADMIN e SUPER_ADMIN
- Form creazione per ADMIN: aggiungere select boutique (popolare con GET /boutique),
  il valore selezionato va inviato come boutiqueId nel body
- Form modifica: stesso drawer del form creazione, precompilato con i dati
   della riga selezionata (nessuna chiamata extra al backend —
   usare i dati già in memoria dalla tabella)
- Campo `manuale`: usare sempre il boolean ricevuto dal backend. Non dedurre mai la modalità da `costoEffettivo`, perché anche le ricariche automatiche hanno costo effettivo.
- UX backlog: per ADMIN separare "Vista boutique" (filtro lista/stats) da "Boutique della ricarica" (valore del form), perché oggi il selector ha doppio significato operativo.
- UX backlog: Rapid dovrebbe salvare solo quando il numero ha 8 cifre valide, o mostrare uno stato "pronto" molto evidente.
- UX backlog: su mobile/tablet la tabella desktop può clipparsi; prevedere lista/card o overflow esplicito.

### FatturePage (`/fatture`)
- Tabella: `numero`, `tipo` (badge), `stato` (badge colorato), `dataEmissione`, `nomeCliente`, `totaleNet`, `nomeBoutique`
- Azioni per stato:
  - BOZZA: modifica, emetti, elimina
  - EMESSA: crea avoir, visualizza
  - ANNULLATA: solo visualizza
- Dettaglio: righe, totali HT/TVA/Netto, timbre fiscal, `fatturaOrigineNumero` se AVOIR
- ADMIN deve selezionare `boutiqueId` nel form creazione
- La colonna nomeBoutique è visibile solo per ADMIN e SUPER_ADMIN
- Logo azienda: caricare con GET /azienda al mount della pagina editor,
    mostrare come watermark (position: absolute, opacity: 0.08) dietro il contenuto del documento

### TariffePage (`/tariffe`) — ADMIN, SUPER_ADMIN
- Tabella: `operatore` (null → "Standard"), `giga`, `costoAcquisto`, `prezzoVendita`, margine calcolato client-side
- Validazione client: `prezzoVendita >= costoAcquisto`
- Backlog UI: aggiungere colonna margine e margine %, evidenza per margini bassi/zero, ricerca per GB, ordinamento e indicazione più chiara del fallback "Default".
- Backlog coerenza: il frontend oggi accetta `0` per costi/prezzi, il backend usa `@Positive`; decidere se zero è ammesso e allineare schema Zod/DTO.
- SUPER_ADMIN: selezione `adminId` e chiamate `getTariffe(adminId)`/save con `adminId` sono backlog non urgente.

### BoutiquePage (`/boutique`) — ADMIN / `/boutique/tutte` — SUPER_ADMIN
- Lista boutique con `nome`, `città`, `fattureAbilitate`
- Toggle inline per `fattureAbilitate` → chiama `PATCH /boutique/{id}/fatture?abilitato=`
- Pulsante "Nuova Boutique" → form con: `nome`, `città`, `nomeAccount`, `usernameAccount`, `passwordAccount`
- Il form di creazione include il toggle fattureAbilitate (default false).
- Il toggle inline nella lista rimane disponibile per modificarlo dopo la creazione tramite PATCH /boutique/{id}/fatture?abilitato=

### ExportPage (`/export`) — ADMIN, SUPER_ADMIN
- Date picker `dal` / `al`
- Validazioni client: range max 366 giorni, `al` non futuro
- Risposta: blob binario → `URL.createObjectURL()` per download diretto `.xlsx`

### AziendaPage (`/azienda`) — ADMIN
- Form: `ragioneSociale`, `indirizzo`, `matriculeFiscale`, upload logo (base64)
- GET al mount per precompilare, PUT al salvataggio (upsert)

### AdminListPage (`/admin-list`) — SUPER_ADMIN
- Form crea admin: `username`, `password`
- POST `/utenti/admin`
- ⚠️ Endpoint GET lista admin non disponibile — solo creazione

---

## Problemi Noti

- Critico backend: `RicaricaService` deve validare ownership quando un ADMIN passa `boutiqueId` come filtro su lista/stats/count.
- Non urgente SUPER_ADMIN: tariffe frontend non passano ancora `adminId`; creazione ricarica backend non passa il ruolo al service.
- Coerenza tariffe: decidere se costi/prezzi a zero sono validi. O backend passa a `@PositiveOrZero`, o frontend blocca `0`.
- Qualità frontend: `npm run lint` fallisce con errori Fast Refresh, import inutilizzati, `idx` inutilizzato e `__dirname` non definito nella config ESLint.
- Pagine incomplete: dashboard, fatture, boutique, azienda, export e gestione admin sono ancora placeholder o parziali.

---

## Gestione Errori UI

Il backend restituisce:
```json
{ "errore": "messaggio descrittivo" }
```

- `400` → messaggio inline nel form o toast warning
- `401` → axiosClient gestisce (redirect login)
- `403` → toast "Non hai i permessi per questa operazione"
- `500` → toast "Errore del server, riprova"

---

## Note per Claude Code

1. **Non toccare il backend** — nessuna modifica a file Java, properties o cartelle Spring Boot
2. I file `*Api.js` in `src/api/` sono il contratto — non inventare endpoint non presenti qui
3. Il token JWT dura **8 ore** — no refresh token
4. `boutiqueId` nel JWT è `null` per ADMIN e SUPER_ADMIN, valorizzato solo per DIPENDENTE
5. Il profitto è calcolato dal backend — non ricalcolarlo lato frontend
6. Tutti i `BigDecimal` arrivano come **string** dal backend — usare `parseFloat()` prima di operazioni matematiche
7. Numeri telefono sempre **8 cifre**, solo Tunisia
8. Valute in **DT** — mostrare con 3 decimali (`toFixed(3)`)
9. Dark mode con classe `dark` su `<html>` — usare sempre varianti `dark:` Tailwind
10. Su mobile (<768px) sidebar = Sheet drawer — non usare `position: fixed` per la sidebar
11. `città` nei DTO boutique ha l'**accento** — rispettare esattamente il nome del campo
12. Export risponde con **blob binario** — gestire con `responseType: 'blob'` in axios e `URL.createObjectURL()`
13. Timbre fiscal = 1.000 DT fisso per documento — usare questo valore
        per il calcolo del preview live nel form fattura:
        totaleNet = totaleHT + totaleTVA + (timbreFiscal ? 1.000 : 0) - remiseGlobale
