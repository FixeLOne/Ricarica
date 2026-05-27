package lx.gestionale.negozio;

import lx.gestionale.utente.Utente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoutiqueRepository extends JpaRepository<Boutique, Long> {

    List<Boutique> findByAdmin(Utente admin);

    List<Boutique> findByAdminId(Long adminId);

    boolean existsByNomeAndAdmin(String nome, Utente admin);

    boolean existsByNomeAndAdminIdAndIdNot(String nome, Long adminId, Long id);
}
