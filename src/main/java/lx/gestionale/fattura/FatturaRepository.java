package lx.gestionale.fattura;

import lx.gestionale.utente.Utente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FatturaRepository extends JpaRepository<Fattura, Long> {

    // Admin — vede tutte le sue fatture
    List<Fattura> findByAdminId(Long adminId);

    // Dipendente — vede solo quelle della sua boutique
    List<Fattura> findByBoutiqueId(Long boutiqueId);

}