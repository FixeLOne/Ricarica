package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.dto.FatturaResponse;
import lx.gestionale.fattura.dto.RiepilogoTvaResponse;
import lx.gestionale.fattura.riga.dto.RigaFatturaResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FatturaMapper {

    private final FatturaCalcoloService fatturaCalcoloService;

    public FatturaResponse toResponse(Fattura fattura) {
        List<RigaFatturaResponse> righeResponse = fattura.getRighe().stream()
                .map(r -> new RigaFatturaResponse(
                        r.getId(),
                        r.getReference(),
                        r.getDescrizione(),
                        r.getQuantita(),
                        r.getPrezzoUnitarioHT(),
                        r.getAliquotaTVA(),
                        r.getScontoPercentuale(),
                        r.getMontanteHT()
                ))
                .collect(Collectors.toList());

        List<RiepilogoTvaResponse> riepilogoTva = fatturaCalcoloService.calcolaRiepilogoTva(fattura).stream()
                .map(r -> new RiepilogoTvaResponse(r.aliquota(), r.imponibile(), r.imposta()))
                .collect(Collectors.toList());

        return new FatturaResponse(
                fattura.getId(),
                fattura.getNumero(),
                fattura.getTipo(),
                fattura.getStato(),
                fattura.getDataEmissione(),
                fattura.getDataCreazione(),
                fattura.getDataUltimaModifica(),
                fattura.getNomeCliente(),
                fattura.getIndirizzoCliente(),
                fattura.getMatriculeFiscaleCliente(),
                fattura.isTimbreFiscal(),
                fattura.getTimbreFiscalMontant(),
                fattura.isLogoIntestazioneVisibile(),
                fattura.isLogoWatermarkVisibile(),
                fattura.getRemiseGlobale(),
                fattura.getTotaleHT(),
                fattura.getTotaleTVA(),
                fattura.getTotaleNet(),
                fattura.getBoutique() != null ? fattura.getBoutique().getId() : null,
                fattura.getBoutique() != null ? fattura.getBoutique().getNome() : null,
                righeResponse,
                riepilogoTva,
                fattura.getFatturaOrigine() != null ? fattura.getFatturaOrigine().getId() : null,
                fattura.getFatturaOrigine() != null ? fattura.getFatturaOrigine().getNumero() : null
        );
    }
}
