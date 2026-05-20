package lx.gestionale.fattura;

import lx.gestionale.utente.Utente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FatturaRepository extends JpaRepository<Fattura, Long> {

    // Admin — vede tutte le sue fatture
    Page<Fattura> findByAdminId(Long adminId, Pageable pageable);

    // Dipendente — vede solo quelle della sua boutique
    Page<Fattura> findByBoutiqueId(Long boutiqueId, Pageable pageable);

}