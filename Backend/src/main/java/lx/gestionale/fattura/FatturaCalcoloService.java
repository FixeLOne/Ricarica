package lx.gestionale.fattura;

import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        BigDecimal remiseGlobale = valoreOrZero(fattura.getRemiseGlobale());
        if (remiseGlobale.compareTo(totaleHT) > 0) {
            throw new IllegalArgumentException("La remise globale non puo superare il totale HT.");
        }

        BigDecimal totaleHTNet = totaleHT.subtract(remiseGlobale);
        BigDecimal totaleTVA = calcolaTvaSuBaseNetta(fattura, totaleHT, remiseGlobale);
        BigDecimal timbreApplicato = fattura.isTimbreFiscal() ? timbreValore : BigDecimal.ZERO;
        BigDecimal totaleNet = totaleHTNet
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

    private BigDecimal calcolaTvaSuBaseNetta(Fattura fattura, BigDecimal totaleHT, BigDecimal remiseGlobale) {
        return calcolaRiepilogoTva(fattura, totaleHT, remiseGlobale).stream()
                .map(RigaRiepilogoTva::imposta)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Dettaglio per aliquota: base imponibile (al netto della quota di remise
     * globale ripartita in proporzione) e imposta. E la stessa scomposizione
     * usata per il totale TVA, esposta perche il documento possa stamparne il
     * riepilogo quando ci sono piu aliquote.
     */
    public List<RigaRiepilogoTva> calcolaRiepilogoTva(Fattura fattura) {
        BigDecimal totaleHT = fattura.getRighe().stream()
                .map(RigaFattura::getMontanteHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return calcolaRiepilogoTva(fattura, totaleHT, valoreOrZero(fattura.getRemiseGlobale()));
    }

    private List<RigaRiepilogoTva> calcolaRiepilogoTva(Fattura fattura, BigDecimal totaleHT, BigDecimal remiseGlobale) {
        if (totaleHT.compareTo(BigDecimal.ZERO) == 0) {
            return List.of();
        }

        Map<BigDecimal, BigDecimal> basiPerAliquota = fattura.getRighe().stream()
                .collect(Collectors.groupingBy(
                        riga -> riga.getAliquotaTVA().stripTrailingZeros(),
                        Collectors.mapping(RigaFattura::getMontanteHT, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        return basiPerAliquota.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    BigDecimal baseHT = entry.getValue();
                    BigDecimal quotaRemise = remiseGlobale
                            .multiply(baseHT)
                            .divide(totaleHT, 6, RoundingMode.HALF_UP);
                    BigDecimal baseNetta = baseHT.subtract(quotaRemise);
                    return new RigaRiepilogoTva(
                            entry.getKey(),
                            scalaImporto(baseNetta),
                            calcolaTvaAliquota(baseHT, entry.getKey(), totaleHT, remiseGlobale)
                    );
                })
                .toList();
    }

    /** Riga del riepilogo TVA calcolata dal dominio (aliquota, base, imposta). */
    public record RigaRiepilogoTva(BigDecimal aliquota, BigDecimal imponibile, BigDecimal imposta) {
    }

    private BigDecimal calcolaTvaAliquota(BigDecimal baseHT, BigDecimal aliquotaTVA, BigDecimal totaleHT, BigDecimal remiseGlobale) {
        BigDecimal quotaRemise = remiseGlobale
                .multiply(baseHT)
                .divide(totaleHT, 6, RoundingMode.HALF_UP);
        BigDecimal baseNetta = baseHT.subtract(quotaRemise);

        return baseNetta
                .multiply(aliquotaTVA)
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
