package lx.gestionale.fattura;

import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FatturaCalcoloServiceTest {

    private FatturaCalcoloService service;

    @BeforeEach
    void setUp() {
        service = new FatturaCalcoloService();
        ReflectionTestUtils.setField(service, "timbreValore", new BigDecimal("1.000"));
    }

    @Test
    void calcolaRigaConScontoPercentualeETimbreFiscal() {
        Fattura fattura = new Fattura();
        fattura.setTimbreFiscal(true);
        fattura.setRemiseGlobale(BigDecimal.ZERO);

        RigaFattura riga = service.creaRiga(riga("REF-1", "2", "100.000", "19", "10.00"), fattura);
        fattura.getRighe().add(riga);

        service.calcolaTotali(fattura);

        assertThat(riga.getReference()).isEqualTo("REF-1");
        assertThat(riga.getScontoPercentuale()).isEqualByComparingTo("10.00");
        assertThat(riga.getMontanteHT()).isEqualByComparingTo("180.000");
        assertThat(fattura.getTotaleHT()).isEqualByComparingTo("180.000");
        assertThat(fattura.getTotaleTVA()).isEqualByComparingTo("34.200");
        assertThat(fattura.getTimbreFiscalMontant()).isEqualByComparingTo("1.000");
        assertThat(fattura.getTotaleNet()).isEqualByComparingTo("215.200");
    }

    @Test
    void rifiutaAliquotaTvaNonAmmessa() {
        Fattura fattura = new Fattura();

        assertThatThrownBy(() -> service.creaRiga(riga(null, "1", "100.000", "20", "0.00"), fattura))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Aliquota TVA non ammessa");
    }

    @Test
    void calcolaTvaDopoRemiseGlobaleSullaBaseImponibileNetta() {
        Fattura fattura = new Fattura();
        fattura.setTimbreFiscal(true);
        fattura.setRemiseGlobale(new BigDecimal("3283.500"));
        fattura.getRighe().add(service.creaRiga(riga(null, "1", "25250.000", "13", "0.00"), fattura));

        service.calcolaTotali(fattura);

        assertThat(fattura.getTotaleHT()).isEqualByComparingTo("25250.000");
        assertThat(fattura.getRemiseGlobale()).isEqualByComparingTo("3283.500");
        assertThat(fattura.getTotaleTVA()).isEqualByComparingTo("2855.645");
        assertThat(fattura.getTimbreFiscalMontant()).isEqualByComparingTo("1.000");
        assertThat(fattura.getTotaleNet()).isEqualByComparingTo("24823.145");
    }

    @Test
    void ripartisceRemiseGlobaleProporzionalmenteTraAliquoteDiverse() {
        Fattura fattura = new Fattura();
        fattura.setRemiseGlobale(new BigDecimal("30.000"));
        fattura.getRighe().add(service.creaRiga(riga(null, "1", "100.000", "19", "0.00"), fattura));
        fattura.getRighe().add(service.creaRiga(riga(null, "1", "200.000", "7", "0.00"), fattura));

        service.calcolaTotali(fattura);

        assertThat(fattura.getTotaleHT()).isEqualByComparingTo("300.000");
        assertThat(fattura.getTotaleTVA()).isEqualByComparingTo("29.700");
        assertThat(fattura.getTotaleNet()).isEqualByComparingTo("299.700");
    }

    @Test
    void rifiutaRemiseGlobaleMaggioreDelTotaleHt() {
        Fattura fattura = new Fattura();
        fattura.setRemiseGlobale(new BigDecimal("101.000"));
        fattura.getRighe().add(service.creaRiga(riga(null, "1", "100.000", "19", "0.00"), fattura));

        assertThatThrownBy(() -> service.calcolaTotali(fattura))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("remise globale");
    }

    private RigaFatturaRequest riga(
            String reference,
            String quantita,
            String prezzoUnitarioHT,
            String aliquotaTVA,
            String scontoPercentuale
    ) {
        RigaFatturaRequest request = new RigaFatturaRequest();
        request.setReference(reference);
        request.setDescrizione("Articolo");
        request.setQuantita(new BigDecimal(quantita));
        request.setPrezzoUnitarioHT(new BigDecimal(prezzoUnitarioHT));
        request.setAliquotaTVA(new BigDecimal(aliquotaTVA));
        request.setScontoPercentuale(new BigDecimal(scontoPercentuale));
        return request;
    }
}
