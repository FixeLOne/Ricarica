package lx.gestionale.tariffa;

import lx.gestionale.ricarica.Operatore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TariffaRepository extends JpaRepository<Tariffa, Long> {

    Optional<Tariffa> findByOperatoreAndGiga(Operatore operatore, double giga);

    // Cerca la tariffa STANDARD (quella che vale per tutti).
    // Presuppone che nel DB la tariffa standard abbia la colonna 'operatore' a NULL
    Optional<Tariffa> findByOperatoreIsNullAndGiga(double giga);
}
