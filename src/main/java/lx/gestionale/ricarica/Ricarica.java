package lx.gestionale.ricarica;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.NumberFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
public class Ricarica {

    // ----------------------Campi di Identificazione e Tempo----------------------
    @Id // Dichiara che è la Primary Key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Dice al DB di generarlo in automatico
    private Long id;

    private LocalDateTime dataOra;

    private LocalDate dataSolo; // Ottimizzato per le query della dashboard

    // ----------------------Dati della Transazione (Input Utente)----------------------

    @NumberFormat
    private String numero;

    @Enumerated(EnumType.STRING)
    private Operatore operatore;

    @Column(nullable = false)
    private double giga;

    // ----------------------Dati Finanziari (Contabilità)----------------------

    private BigDecimal costoEffettivo;

    private BigDecimal costoCliente;

    private BigDecimal profitto;

    //------------------------  EXTRA -------------------------------------------

    private String note;

    private Integer IdUtente;



    // -------------------------------- LOGICA DI BUSINESS AUTOMATICA ----------------------

    // Questo metodo viene eseguito da Spring in automatico
    // ogni volta che viene salvata o modificata una ricarica nel db.
    @PrePersist
    @PreUpdate
    private void calcolaProfitto() {
        if (this.costoCliente != null && this.costoEffettivo != null) {
            this.profitto = this.costoCliente.subtract(this.costoEffettivo);
        }
    }
}