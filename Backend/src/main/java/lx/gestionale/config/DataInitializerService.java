package lx.gestionale.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaRepository;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
class DataInitializerService {

    private final TariffaRepository tariffaRepository;
    private final UtenteRepository utenteRepository;
    private final BoutiqueRepository boutiqueRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void eseguiInizializzazione() {
        if (utenteRepository.count() > 0) {
            log.info("[DEV] Database già inizializzato, skip.");
            return;
        }

        log.info("[DEV] Avvio inizializzazione database MAESTRO AUDIT...");

        // ═══════════════════════════════════════════════════════════════
        // 1. UTENTI DI SISTEMA
        //    - 1 SuperAdmin
        //    - 3 Admin (A, B, C dove C è senza boutique attive)
        // ═══════════════════════════════════════════════════════════════
        Utente superAdmin = creaUtente("Super Admin",  "superadmin", "superadmin123", Ruolo.SUPER_ADMIN, null);
        Utente adminA     = creaUtente("Admin A",      "adminA",     "adminA123",     Ruolo.ADMIN,       null);
        Utente adminB     = creaUtente("Admin B",      "adminB",     "adminB123",     Ruolo.ADMIN,       null);
        Utente adminC     = creaUtente("Admin C",      "adminC",     "adminC123",     Ruolo.ADMIN,       null); // nessuna boutique

        // ═══════════════════════════════════════════════════════════════
        // 2. BOUTIQUE
        //    Admin A → 2 boutique (A1 con fatture, A2 senza fatture)
        //    Admin B → 2 boutique (B1 con fatture, B2 senza fatture)
        //    Admin C → nessuna boutique (per testare dashboard vuota)
        // ═══════════════════════════════════════════════════════════════
        Boutique boutiqueA1 = creaBoutique("Boutique A1", "Tunisi",    adminA, true);   // id prevedibile: 1
        Boutique boutiqueA2 = creaBoutique("Boutique A2", "Sfax",      adminA, false);  // id: 2 — fatture DISABLED
        Boutique boutiqueB1 = creaBoutique("Boutique B1", "Sousse",    adminB, true);   // id: 3
        Boutique boutiqueB2 = creaBoutique("Boutique B2", "Monastir",  adminB, false);  // id: 4 — fatture DISABLED

        // ═══════════════════════════════════════════════════════════════
        // 3. DIPENDENTI (2 per ogni boutique attiva)
        // ═══════════════════════════════════════════════════════════════
        // Boutique A1 (fatture ON) — 2 dipendenti
        creaUtente("Dipendente A1", "dipA1", "dipA1123", Ruolo.DIPENDENTE, boutiqueA1);
        creaUtente("Dipendente A1b", "dipA1b", "dipA1b123", Ruolo.DIPENDENTE, boutiqueA1);

        // Boutique A2 (fatture OFF) — 1 dipendente
        creaUtente("Dipendente A2", "dipA2", "dipA2123", Ruolo.DIPENDENTE, boutiqueA2);

        // Boutique B1 (fatture ON) — 2 dipendenti
        creaUtente("Dipendente B1", "dipB1", "dipB1123", Ruolo.DIPENDENTE, boutiqueB1);
        creaUtente("Dipendente B1b", "dipB1b", "dipB1b123", Ruolo.DIPENDENTE, boutiqueB1);

        // Boutique B2 (fatture OFF) — 1 dipendente
        creaUtente("Dipendente B2", "dipB2", "dipB2123", Ruolo.DIPENDENTE, boutiqueB2);

        // ═══════════════════════════════════════════════════════════════
        // 4. TARIFFE ADMIN A — listino completo con tutte le combinazioni
        //    Copre: tutti gli operatori, più tagli di giga, fallback null
        // ═══════════════════════════════════════════════════════════════

        // — Ooredoo —
        salvaTariffa(adminA, Operatore.ooredoo,  5.0,  "3.200",  "4.800");
        salvaTariffa(adminA, Operatore.ooredoo, 10.0,  "6.500",  "9.000");
        salvaTariffa(adminA, Operatore.ooredoo, 25.0, "14.000", "19.000");
        salvaTariffa(adminA, Operatore.ooredoo, 50.0, "20.000", "25.000");
        salvaTariffa(adminA, Operatore.ooredoo,100.0, "40.000", "48.000");

        // — Orange —
        salvaTariffa(adminA, Operatore.orange,   5.0,  "3.000",  "4.500");
        salvaTariffa(adminA, Operatore.orange,  10.0,  "6.000",  "9.000");
        salvaTariffa(adminA, Operatore.orange,  25.0, "13.000", "18.000");
        salvaTariffa(adminA, Operatore.orange,  50.0, "22.000", "28.000");

        // — Telecom —
        salvaTariffa(adminA, Operatore.telecom,  5.0,  "2.800",  "4.200");
        salvaTariffa(adminA, Operatore.telecom, 10.0,  "5.000",  "7.500");
        salvaTariffa(adminA, Operatore.telecom, 20.0,  "8.000", "12.000");

        // — Fisso —
        salvaTariffa(adminA, Operatore.fisso,    5.0,  "2.500",  "4.000");
        salvaTariffa(adminA, Operatore.fisso,   10.0,  "4.500",  "7.000");

        // — Fallback (operatore null, usato quando non esiste corrispondenza esatta) —
        salvaTariffa(adminA, null, 15.0, "6.000", "9.000");

        // ═══════════════════════════════════════════════════════════════
        // 5. TARIFFE ADMIN B — listino ridotto (test isolamento tariffe)
        // ═══════════════════════════════════════════════════════════════

        // — Ooredoo —
        salvaTariffa(adminB, Operatore.ooredoo, 10.0, "6.000",  "8.500");
        salvaTariffa(adminB, Operatore.ooredoo, 50.0, "22.000", "27.000");

        // — Orange —
        salvaTariffa(adminB, Operatore.orange,  10.0, "6.200",  "9.000");
        salvaTariffa(adminB, Operatore.orange,  25.0, "13.500", "18.500");

        // — Telecom —
        salvaTariffa(adminB, Operatore.telecom, 10.0, "5.200",  "7.800");

        // — Fallback —
        salvaTariffa(adminB, null, 10.0, "5.000", "7.500");

        // ═══════════════════════════════════════════════════════════════
        // 6. TARIFFE ADMIN C — nessuna (per testare listino vuoto e
        //    comportamento del fallback quando non esiste nemmeno quello)
        // ═══════════════════════════════════════════════════════════════
        // (nessuna tariffa volutamente)

        log.info("[DEV] ✔ Database inizializzato — MAESTRO AUDIT.");
        log.info("[DEV]   Utenti   : superadmin | adminA | adminB | adminC | dipA1 | dipA1b | dipA2 | dipB1 | dipB1b | dipB2");
        log.info("[DEV]   Boutique : A1(id=1,fatture=ON) | A2(id=2,fatture=OFF) | B1(id=3,fatture=ON) | B2(id=4,fatture=OFF)");
        log.info("[DEV]   Tariffe  : AdminA=15 | AdminB=6 | AdminC=0");
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private Utente creaUtente(String nome, String username, String password, Ruolo ruolo, Boutique boutique) {
        Utente u = new Utente();
        u.setNome(nome);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(password));
        u.setRuolo(ruolo);
        u.setBoutique(boutique);
        return utenteRepository.save(u);
    }

    private Boutique creaBoutique(String nome, String citta, Utente admin, boolean fattureAbilitate) {
        Boutique b = new Boutique();
        b.setNome(nome);
        b.setCittà(citta);
        b.setAdmin(admin);
        b.setFattureAbilitate(fattureAbilitate);
        return boutiqueRepository.save(b);
    }

    private void salvaTariffa(Utente admin, Operatore operatore, double giga, String costo, String vendita) {
        Tariffa t = new Tariffa();
        t.setAdmin(admin);
        t.setOperatore(operatore);
        t.setGiga(BigDecimal.valueOf(giga));
        t.setCostoAcquisto(new BigDecimal(costo));
        t.setPrezzoVendita(new BigDecimal(vendita));
        tariffaRepository.save(t);
    }
}