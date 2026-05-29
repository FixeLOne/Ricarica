package lx.gestionale.fattura;

import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FatturaCalcoloService {

    private static final BigDecimal CENTO = BigDecimal.valueOf(100);
    private static final int SCALA_IMPORTI = 3;

    @Value("${fattura.timbre-fiscal.valore:1.000}")
    private BigDecimal timbreValore;

    public RigaFattura creaRiga(RigaFatturaRequest request, Fattura fattura) {
        BigDecimal scontoPercentuale = valoreOrZero(request.getScontoPercentuale());
        BigDecimal montanteLordo = request.getQuantita().multiply(request.getPrezzoUnitarioHT());
        BigDecimal montanteNetto = applicaScontoRiga(montanteLordo, scontoPercentuale);

        verificaAliquotaTva(request.getAliquotaTVA());

        RigaFattura riga = new RigaFattura();
        riga.setReference(normalizzaTesto(request.getReference()));
        riga.setDescrizione(request.getDescrizione());
        riga.setQuantita(request.getQuantita());
        riga.setPrezzoUnitarioHT(request.getPrezzoUnitarioHT());
        riga.setAliquotaTVA(request.getAliquotaTVA());
        riga.setScontoPercentuale(scontoPercentuale);
        riga.setMontanteHT(montanteNetto);
        riga.setFattura(fattura);
        return riga;
    }

    public RigaFattura copiaRiga(RigaFattura originale, Fattura fattura) {
        RigaFattura riga = new RigaFattura();
        riga.setReference(originale.getReference());
        riga.setDescrizione(originale.getDescrizione());
        riga.setQuantita(originale.getQuantita());
        riga.setPrezzoUnitarioHT(originale.getPrezzoUnitarioHT());
        riga.setAliquotaTVA(originale.getAliquotaTVA());
        riga.setScontoPercentuale(originale.getScontoPercentuale());
        riga.setMontanteHT(originale.getMontanteHT());
        riga.setFattura(fattura);
        return riga;
    }

    public void calcolaTotali(Fattura fattura) {
        fattura.getRighe().forEach(r -> verificaAliquotaTva(r.getAliquotaTVA()));

        BigDecimal totaleHT = fattura.getRighe().stream()
                .map(RigaFattura::getMontanteHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totaleTVA = fattura.getRighe().stream()
                .map(this::calcolaTvaRiga)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remiseGlobale = valoreOrZero(fattura.getRemiseGlobale());
        if (remiseGlobale.compareTo(totaleHT) > 0) {
            throw new IllegalArgumentException("La remise globale non puo superare il totale HT.");
        }

        BigDecimal timbreApplicato = fattura.isTimbreFiscal() ? timbreValore : BigDecimal.ZERO;
        BigDecimal totaleNet = totaleHT
                .subtract(remiseGlobale)
                .add(totaleTVA)
                .add(timbreApplicato);

        fattura.setRemiseGlobale(remiseGlobale);
        fattura.setTimbreFiscalMontant(scalaImporto(timbreApplicato));
        fattura.setTotaleHT(scalaImporto(totaleHT));
        fattura.setTotaleTVA(scalaImporto(totaleTVA));
        fattura.setTotaleNet(scalaImporto(totaleNet));
    }

    private BigDecimal applicaScontoRiga(BigDecimal montanteLordo, BigDecimal scontoPercentuale) {
        if (scontoPercentuale.compareTo(BigDecimal.ZERO) == 0) {
            return scalaImporto(montanteLordo);
        }
        BigDecimal moltiplicatore = BigDecimal.ONE.subtract(scontoPercentuale.divide(CENTO, 6, RoundingMode.HALF_UP));
        return scalaImporto(montanteLordo.multiply(moltiplicatore));
    }

    private BigDecimal calcolaTvaRiga(RigaFattura riga) {
        return riga.getMontanteHT()
                .multiply(riga.getAliquotaTVA())
                .divide(CENTO, SCALA_IMPORTI, RoundingMode.HALF_UP);
    }

    private BigDecimal valoreOrZero(BigDecimal valore) {
        return valore == null ? BigDecimal.ZERO : valore;
    }

    private BigDecimal scalaImporto(BigDecimal valore) {
        return valore.setScale(SCALA_IMPORTI, RoundingMode.HALF_UP);
    }

    private void verificaAliquotaTva(BigDecimal aliquotaTVA) {
        if (!AliquoteTvaTunisia.contiene(aliquotaTVA)) {
            throw new IllegalArgumentException("Aliquota TVA non ammessa. Valori consentiti: " + AliquoteTvaTunisia.VALORI_AMMESSI);
        }
    }

    private String normalizzaTesto(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
