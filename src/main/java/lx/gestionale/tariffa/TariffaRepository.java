package lx.gestionale.tariffa;

import lx.gestionale.ricarica.Operatore;
import lx.gestionale.utente.Utente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TariffaRepository extends JpaRepository<Tariffa, Long> {

    Optional<Tariffa> findByOperatoreAndGigaAndAdmin(Operatore operatore, double giga, Utente admin);

    Optional<Tariffa> findByOperatoreIsNullAndGigaAndAdmin(double giga, Utente admin);

    List<Tariffa> findByAdmin(Utente admin);
}
