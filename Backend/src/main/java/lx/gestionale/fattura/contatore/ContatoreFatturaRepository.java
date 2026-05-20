package lx.gestionale.fattura.contatore;

import lx.gestionale.utente.Utente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ContatoreFatturaRepository extends JpaRepository<ContatoreFattura, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ContatoreFattura c WHERE c.admin = :admin AND c.anno = :anno")
    Optional<ContatoreFattura> findByAdminAndAnno(@Param("admin") Utente admin, @Param("anno") int anno);
}