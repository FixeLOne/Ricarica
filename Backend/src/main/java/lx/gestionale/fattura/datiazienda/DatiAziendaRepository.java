package lx.gestionale.fattura.datiazienda;

import lx.gestionale.utente.Utente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DatiAziendaRepository extends JpaRepository<DatiAzienda, Long> {

    Optional<DatiAzienda> findByAdmin(Utente admin);
}