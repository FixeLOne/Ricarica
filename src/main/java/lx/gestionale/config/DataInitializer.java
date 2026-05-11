package lx.gestionale.config;

import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaRepository;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(TariffaRepository tariffaRepository,
                                   UtenteRepository utenteRepository,
                                   BoutiqueRepository boutiqueRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            inizializzaTariffe(tariffaRepository);
            inizializzaUtenti(utenteRepository, boutiqueRepository, passwordEncoder);
        };
    }

    private void inizializzaTariffe(TariffaRepository repo) {
        if (repo.count() > 0) return;

        Tariffa t1 = new Tariffa();
        t1.setOperatore(Operatore.orange);
        t1.setGiga(25.0);
        t1.setCostoAcquisto(new BigDecimal("7.50"));
        t1.setPrezzoVendita(new BigDecimal("10.00"));
        repo.save(t1);

        Tariffa t2 = new Tariffa();
        t2.setOperatore(null);
        t2.setGiga(50.0);
        t2.setCostoAcquisto(new BigDecimal("14.00"));
        t2.setPrezzoVendita(new BigDecimal("18.00"));
        repo.save(t2);

        System.out.println("✅ [SISTEMA] Listino prezzi inizializzato");
    }

    private void inizializzaUtenti(UtenteRepository utenteRepo,
                                   BoutiqueRepository boutiqueRepo,
                                   PasswordEncoder encoder) {
        if (utenteRepo.count() > 0) return;

        // SUPER_ADMIN
        Utente superAdmin = new Utente();
        superAdmin.setNome("Super Admin");
        superAdmin.setUsername("superadmin");
        superAdmin.setPassword(encoder.encode("superadmin123"));
        superAdmin.setRuolo(Ruolo.SUPER_ADMIN);
        utenteRepo.save(superAdmin);

        // ADMIN
        Utente admin = new Utente();
        admin.setNome("Zio Admin");
        admin.setUsername("admin");
        admin.setPassword(encoder.encode("admin123"));
        admin.setRuolo(Ruolo.ADMIN);
        utenteRepo.save(admin);

        // BOUTIQUE
        Boutique boutique = new Boutique();
        boutique.setNome("Boutique Centrale");
        boutique.setCittà("Tunisi");
        boutique.setAdmin(admin);
        boutiqueRepo.save(boutique);

        // DIPENDENTE
        Utente dipendente = new Utente();
        dipendente.setNome("Mario Rossi");
        dipendente.setUsername("dipendente");
        dipendente.setPassword(encoder.encode("dipendente123"));
        dipendente.setRuolo(Ruolo.DIPENDENTE);
        dipendente.setBoutique(boutique);
        utenteRepo.save(dipendente);

        System.out.println("✅ [SISTEMA] Utenti inizializzati");
    }
}