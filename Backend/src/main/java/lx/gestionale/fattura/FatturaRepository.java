package lx.gestionale.fattura;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface FatturaRepository extends JpaRepository<Fattura, Long> {

    Page<Fattura> findByAdminId(Long adminId, Pageable pageable);

    Page<Fattura> findByBoutiqueId(Long boutiqueId, Pageable pageable);

    @Query("""
            select f
            from Fattura f
            left join f.boutique b
            where (:adminId is null or f.admin.id = :adminId)
              and (:boutiqueId is null or b.id = :boutiqueId)
              and (:stato is null or f.stato = :stato)
              and (:tipo is null or f.tipo = :tipo)
              and (:dal is null or f.dataEmissione >= :dal)
              and (:al is null or f.dataEmissione <= :al)
              and (
                    :search is null
                    or lower(f.numero) like :search
                    or lower(coalesce(f.nomeCliente, '')) like :search
                    or lower(coalesce(b.nome, '')) like :search
              )
            """)
    Page<Fattura> cerca(
            @Param("adminId") Long adminId,
            @Param("boutiqueId") Long boutiqueId,
            @Param("stato") StatoFattura stato,
            @Param("tipo") TipoDocumento tipo,
            @Param("dal") LocalDate dal,
            @Param("al") LocalDate al,
            @Param("search") String search,
            Pageable pageable
    );
}
