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

    @Query("SELECT r FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo BETWEEN :dal AND :al AND r.eliminato = false")
    List<Ricarica> findByBoutiqueIdAndDataSoloBetween(@Param("boutiqueId") Long boutiqueId, @Param("dal") LocalDate dal, @Param("al") LocalDate al);

    @Query("SELECT COALESCE(SUM(r.profitto), 0) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data AND r.eliminato = false")
    BigDecimal sumProfittoByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data AND r.eliminato = false")
    long countRicaricheByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    Page<Ricarica> findByBoutiqueAdminId(Long adminId, Pageable pageable);
    Page<Ricarica> findByBoutiqueId(Long boutiqueId, Pageable pageable);

    //CONTATORE OGGI — esclude eliminate
    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data AND r.eliminato = false")
    long countByBoutiqueIdAndDataSolo(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.boutique.admin.id = :adminId AND r.dataSolo = :data AND r.eliminato = false")
    long countByBoutiqueAdminIdAndDataSolo(@Param("adminId") Long adminId, @Param("data") LocalDate data);

    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.dataSolo = :data AND r.eliminato = false")
    long countByDataSolo(@Param("data") LocalDate data);

    // STATS OGGI — esclude eliminate
    @Query("SELECT COALESCE(SUM(r.giga), 0) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data AND r.eliminato = false")
    double sumGigaByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    @Query("SELECT r.operatore, COUNT(r) FROM Ricarica r WHERE r.boutique.id = :boutiqueId AND r.dataSolo = :data AND r.eliminato = false GROUP BY r.operatore")
    List<Object[]> countPerOperatoreByBoutiqueAndData(@Param("boutiqueId") Long boutiqueId, @Param("data") LocalDate data);

    @Query("SELECT COALESCE(SUM(r.giga), 0) FROM Ricarica r WHERE r.boutique.admin.id = :adminId AND r.dataSolo = :data AND r.eliminato = false")
    double sumGigaByAdminAndData(@Param("adminId") Long adminId, @Param("data") LocalDate data);

    @Query("SELECT r.operatore, COUNT(r) FROM Ricarica r WHERE r.boutique.admin.id = :adminId AND r.dataSolo = :data AND r.eliminato = false GROUP BY r.operatore")
    List<Object[]> countPerOperatoreByAdminAndData(@Param("adminId") Long adminId, @Param("data") LocalDate data);

    @Query("SELECT COALESCE(SUM(r.giga), 0) FROM Ricarica r WHERE r.dataSolo = :data AND r.eliminato = false")
    double sumGigaByData(@Param("data") LocalDate data);

    @Query("SELECT r.operatore, COUNT(r) FROM Ricarica r WHERE r.dataSolo = :data AND r.eliminato = false GROUP BY r.operatore")
    List<Object[]> countPerOperatoreByData(@Param("data") LocalDate data);
}
