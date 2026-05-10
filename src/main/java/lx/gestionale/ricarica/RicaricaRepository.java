package lx.gestionale.ricarica;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface RicaricaRepository extends JpaRepository<Ricarica, Long> {

    List<Ricarica> findByDataSolo(LocalDate data);

    @Query("SELECT SUM(r.profitto) FROM Ricarica r WHERE r.dataSolo = :data")
    BigDecimal sumProfittoByData(LocalDate data);

    @Query("SELECT COUNT(r) FROM Ricarica r WHERE r.dataSolo = :data")
    long countRicaricheByData(LocalDate data);

    List<Ricarica> findByDataSoloBetween(LocalDate dal, LocalDate al);
    //@Param ovunque dice claude chiedere a gemini
}
