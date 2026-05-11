package lx.gestionale.ricarica;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface RicaricaRepository extends JpaRepository<Ricarica, Long> {

    List<Ricarica> findByBoutiqueIdAndDataSoloBetween(Long boutiqueId, LocalDate dal, LocalDate al);

    @Query("SELECT SUM(r.profitto) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data")
    BigDecimal sumProfittoByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data")
    long countRicaricheByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);
}
