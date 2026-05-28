package lx.gestionale.fattura;

import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FatturaCalcoloService {

    @Value("${fattura.timbre-fiscal.valore:1.000}")
    private BigDecimal timbreValore;

    public RigaFattura creaRiga(RigaFatturaRequest request, Fattura fattura) {
        RigaFattura riga = new RigaFattura();
        riga.setDescrizione(request.getDescrizione());
        riga.setQuantita(request.getQuantita());
        riga.setPrezzoUnitarioHT(request.getPrezzoUnitarioHT());
        riga.setAliquotaTVA(request.getAliquotaTVA());
        riga.setMontanteHT(request.getQuantita().multiply(request.getPrezzoUnitarioHT()));
        riga.setFattura(fattura);
        return riga;
    }

    public RigaFattura copiaRiga(RigaFattura originale, Fattura fattura) {
        RigaFattura riga = new RigaFattura();
        riga.setDescrizione(originale.getDescrizione());
        riga.setQuantita(originale.getQuantita());
        riga.setPrezzoUnitarioHT(originale.getPrezzoUnitarioHT());
        riga.setAliquotaTVA(originale.getAliquotaTVA());
        riga.setMontanteHT(originale.getMontanteHT());
        riga.setFattura(fattura);
        return riga;
    }

    public void calcolaTotali(Fattura fattura) {
        BigDecimal totaleHT = fattura.getRighe().stream()
                .map(RigaFattura::getMontanteHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totaleTVA = fattura.getRighe().stream()
                .map(r -> r.getMontanteHT()
                        .multiply(r.getAliquotaTVA())
                        .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totaleNet = totaleHT
                .subtract(fattura.getRemiseGlobale())
                .add(totaleTVA)
                .add(fattura.isTimbreFiscal() ? timbreValore : BigDecimal.ZERO);

        if (totaleNet.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Lo sconto globale non può superare il totale. Il totale netto non può essere negativo.");
        }

        fattura.setTotaleHT(totaleHT);
        fattura.setTotaleTVA(totaleTVA);
        fattura.setTotaleNet(totaleNet);
    }
}
