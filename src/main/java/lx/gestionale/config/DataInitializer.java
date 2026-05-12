package lx.gestionale.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    /**
     * Il CommandLineRunner viene eseguito all'avvio dell'applicazione.
     * Delega il lavoro al servizio transazionale per evitare errori di sessione/database.
     */
    @Bean
    CommandLineRunner initDatabase(DataInitializerService initializerService) {
        return args -> initializerService.eseguiInizializzazione();
    }
}

