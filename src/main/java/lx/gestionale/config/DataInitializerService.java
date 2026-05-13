package lx.gestionale.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lx.gestionale.fattura.contatore.ContatoreFatturaService;
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

        log.info("[DEV] Avvio inizializzazione database...");

        // ── 1. CREAZIONE UTENTI (SUPER_ADMIN E ADMIN) ────────────────────────
        Utente superAdmin = creaUtente("Super Admin", "superadmin", "superadmin123", Ruolo.SUPER_ADMIN, null);
        Utente adminA = creaUtente("Admin A", "adminA", "adminA123", Ruolo.ADMIN, null);
        Utente adminB = creaUtente("Admin B", "adminB", "adminB123", Ruolo.ADMIN, null);

        // ── 2. CREAZIONE BOUTIQUE ─────────────────────────────────────────────
        Boutique boutiqueA1 = creaBoutique("Boutique A1", "Tunisi", adminA, true);
        Boutique boutiqueA2 = creaBoutique("Boutique A2", "Sfax", adminA, false);
        Boutique boutiqueB1 = creaBoutique("Boutique B1", "Sousse", adminB, true);

        // ── 3. CREAZIONE DIPENDENTI ───────────────────────────────────────────
        // Nota: Il dipendente deve avere il riferimento alla boutique
        creaUtente("Dipendente A1", "dipA1", "dipA1123", Ruolo.DIPENDENTE, boutiqueA1);
        creaUtente("Dipendente A2", "dipA2", "dipA2123", Ruolo.DIPENDENTE, boutiqueA2);
        creaUtente("Dipendente B1", "dipB1", "dipB1123", Ruolo.DIPENDENTE, boutiqueB1);

        // ── 4. CREAZIONE TARIFFE PER ADMIN A ──────────────────────────────────
        salvaTariffa(adminA, Operatore.ooredoo, 5.0, "3.500", "5.000");
        salvaTariffa(adminA, Operatore.ooredoo, 10.0, "6.500", "9.000");
        salvaTariffa(adminA, Operatore.orange, 5.0, "3.000", "4.500");
        salvaTariffa(adminA, Operatore.orange, 25.0, "7.500", "10.000");
        salvaTariffa(adminA, Operatore.telecom, 10.0, "5.000", "7.500");
        salvaTariffa(adminA, Operatore.fisso, 5.0, "2.500", "4.000");
        salvaTariffa(adminA, null, 10.0, "5.500", "8.000"); // Tariffa fallback

        // ── 5. CREAZIONE TARIFFE PER ADMIN B ──────────────────────────────────
        salvaTariffa(adminB, Operatore.ooredoo, 10.0, "6.000", "8.500");
        salvaTariffa(adminB, Operatore.orange, 10.0, "6.200", "9.000");
        salvaTariffa(adminB, null, 10.0, "5.000", "7.500");

        log.info("[DEV] Database inizializzato con successo.");
    }

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
        t.setGiga(giga);
        t.setCostoAcquisto(new BigDecimal(costo));
        t.setPrezzoVendita(new BigDecimal(vendita));
        tariffaRepository.save(t);
    }
}
