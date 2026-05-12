package lx.gestionale.fattura;

import lx.gestionale.utente.Utente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface ContatoreFatturaRepository extends JpaRepository<ContatoreFattura, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ContatoreFattura> findByAdminAndAnno(Utente admin, int anno);
}