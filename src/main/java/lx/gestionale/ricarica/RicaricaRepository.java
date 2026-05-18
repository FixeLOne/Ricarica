package lx.gestionale.ricarica;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RicaricaRepository extends JpaRepository<Ricarica, Long> {

    List<Ricarica> findByBoutiqueIdAndDataSoloBetween(Long boutiqueId, LocalDate dal, LocalDate al);

    @Query("SELECT COALESCE(SUM(r.profitto), 0) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data")
    BigDecimal sumProfittoByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data")
    long countRicaricheByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    Page<Ricarica> findByBoutiqueAdminId(Long adminId, Pageable pageable);
    Page<Ricarica> findByBoutiqueId(Long boutiqueId, Pageable pageable);
}
