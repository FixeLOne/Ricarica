package lx.gestionale.fattura;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RigaFatturaRepository extends JpaRepository<RigaFattura, Long> {
    // gestito tramite cascata da Fattura, nessuna query custom necessaria
}