package lx.gestionale.config;

import lx.gestionale.ricarica.Operatore;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(TariffaRepository repository) {
        return args -> {
            // Se il listino è vuoto, inseriamo i dati base
            if (repository.count() == 0) {

                // 1. Tariffa specifica (es. Orange 25GB)
                Tariffa t1 = new Tariffa();
                t1.setOperatore(Operatore.orange);
                t1.setGiga(25.0);
                t1.setCostoAcquisto(new BigDecimal("7.50"));
                t1.setPrezzoVendita(new BigDecimal("10.00"));
                repository.save(t1);

                // 2. Tariffa STANDARD per tutti (es. 50GB)
                Tariffa t2 = new Tariffa();
                t2.setOperatore(null); // NULL significa "valido per tutti gli operatori"
                t2.setGiga(50.0);
                t2.setCostoAcquisto(new BigDecimal("14.00"));
                t2.setPrezzoVendita(new BigDecimal("18.00"));
                repository.save(t2);

                System.out.println("✅ [SISTEMA] Listino prezzi inizializzato con successo!");
            }
        };
    }
}