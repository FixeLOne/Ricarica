package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.contatore.ContatoreFatturaService;
import lx.gestionale.fattura.dto.CreaFatturaRequest;
import lx.gestionale.fattura.dto.FatturaResponse;
import lx.gestionale.fattura.dto.FiltroFatture;
import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.utente.Utente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FatturaService {

    private final FatturaRepository fatturaRepository;
    private final ContatoreFatturaService contatoreFatturaService;
    private final FatturaAccessService fatturaAccessService;
    private final FatturaCalcoloService fatturaCalcoloService;
    private final FatturaMapper fatturaMapper;

    @Transactional
    public FatturaResponse creaFattura(CreaFatturaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        validaDocumento(request);
        validaCreazioneDiretta(request);

        FatturaAccessService.ContestoCreazione contesto =
                fatturaAccessService.risolviContestoCreazione(request, utenteId, boutiqueId);

        List<RigaFattura> righe = request.getRighe().stream()
                .map(r -> fatturaCalcoloService.creaRiga(r, null))
                .collect(Collectors.toList());

        return assemblaSalvaErispondi(
                numeroBozza(),
                request.getTipo(),
                StatoFattura.BOZZA,
                request.getDataEmissione(),
                request.getNomeCliente(),
                request.isTimbreFiscal(),
                request.isLogoIntestazioneVisibile(),
                request.isLogoWatermarkVisibile(),
                request.getRemiseGlobale(),
                contesto.admin(),
                contesto.boutique(),
                null,
                righe
        );
    }

    @Transactional
    public FatturaResponse modificaFattura(Long id, CreaFatturaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        validaDocumento(request);
        Fattura fattura = fatturaAccessService.richiediFatturaAccessibile(id, utenteId, boutiqueId, ruolo);

        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture in stato BOZZA possono essere modificate");
        }

        fattura.setDataEmissione(request.getDataEmissione());
        fattura.setNomeCliente(request.getNomeCliente());
        fattura.setTimbreFiscal(request.isTimbreFiscal());
        fattura.setLogoIntestazioneVisibile(request.isLogoIntestazioneVisibile());
        fattura.setLogoWatermarkVisibile(request.isLogoWatermarkVisibile());
        fattura.setRemiseGlobale(request.getRemiseGlobale());

        fattura.getRighe().clear();
        request.getRighe().stream()
                .map(r -> fatturaCalcoloService.creaRiga(r, fattura))
                .forEach(fattura.getRighe()::add);

        fatturaCalcoloService.calcolaTotali(fattura);
        fatturaRepository.save(fattura);
        return fatturaMapper.toResponse(fattura);
    }

    @Transactional
    public FatturaResponse emettiFattura(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = fatturaAccessService.richiediFatturaAccessibile(id, utenteId, boutiqueId, ruolo);

        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture in stato BOZZA possono essere emesse");
        }

        String numeroReale = contatoreFatturaService.generaNumero(fattura.getAdmin(), fattura.getTipo());
        fattura.setNumero(numeroReale);
        fattura.setStato(StatoFattura.EMESSA);

        fatturaRepository.save(fattura);
        return fatturaMapper.toResponse(fattura);
    }

    @Transactional
    public FatturaResponse creaAvoir(Long fatturaOrigineId, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura origine = fatturaAccessService.richiediFatturaAccessibile(fatturaOrigineId, utenteId, boutiqueId, ruolo);
        validaOrigineAvoir(origine);

        List<RigaFattura> righe = origine.getRighe().stream()
                .map(r -> fatturaCalcoloService.copiaRiga(r, null))
                .collect(Collectors.toList());

        String numero = contatoreFatturaService.generaNumero(origine.getAdmin(), TipoDocumento.AVOIR);

        origine.setStato(StatoFattura.ANNULLATA);
        fatturaRepository.save(origine);

        return assemblaSalvaErispondi(
                numero,
                TipoDocumento.AVOIR,
                StatoFattura.EMESSA,
                LocalDate.now(),
                origine.getNomeCliente(),
                origine.isTimbreFiscal(),
                origine.isLogoIntestazioneVisibile(),
                origine.isLogoWatermarkVisibile(),
                origine.getRemiseGlobale(),
                origine.getAdmin(),
                origine.getBoutique(),
                origine,
                righe
        );
    }

    @Transactional(readOnly = true)
    public Page<FatturaResponse> getFatture(Long utenteId, Long boutiqueId, String ruolo, Pageable pageable, FiltroFatture filtro) {
        validaFiltro(filtro);
        return fatturaAccessService.trovaFattureAccessibili(utenteId, boutiqueId, ruolo, pageable, filtro)
                .map(fatturaMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public FatturaResponse getFatturaById(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = fatturaAccessService.richiediFatturaAccessibile(id, utenteId, boutiqueId, ruolo);
        return fatturaMapper.toResponse(fattura);
    }

    @Transactional
    public void eliminaFattura(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = fatturaAccessService.richiediFatturaAccessibile(id, utenteId, boutiqueId, ruolo);
        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture BOZZA possono essere eliminate. Per annullare una fattura emessa, emettere un Avoir.");
        }
        fatturaRepository.deleteById(id);
    }

    private void validaOrigineAvoir(Fattura origine) {
        if (origine.getStato() != StatoFattura.EMESSA) {
            throw new IllegalArgumentException("Si puo emettere un Avoir solo su fatture EMESSE");
        }
        if (origine.getTipo() == TipoDocumento.AVOIR) {
            throw new IllegalArgumentException("Non e possibile emettere un Avoir su un altro Avoir");
        }
    }

    private void validaCreazioneDiretta(CreaFatturaRequest request) {
        if (request.getTipo() == TipoDocumento.AVOIR) {
            throw new IllegalArgumentException("Un Avoir va creato da una fattura emessa usando l'endpoint /fatture/{id}/avoir");
        }
    }

    private void validaDocumento(CreaFatturaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Documento obbligatorio");
        }
        if (request.getTipo() == null) {
            throw new IllegalArgumentException("Il tipo documento e obbligatorio");
        }
        if (request.getDataEmissione() == null) {
            throw new IllegalArgumentException("La data documento e obbligatoria");
        }
        if (request.getRemiseGlobale() == null) {
            throw new IllegalArgumentException("La remise globale e obbligatoria");
        }
        if (request.getRighe() == null || request.getRighe().isEmpty()) {
            throw new IllegalArgumentException("La fattura deve avere almeno una riga");
        }
    }

    private void validaFiltro(FiltroFatture filtro) {
        if (filtro.dal() != null && filtro.al() != null && filtro.dal().isAfter(filtro.al())) {
            throw new IllegalArgumentException("La data iniziale non puo essere successiva alla data finale");
        }
    }

    private FatturaResponse assemblaSalvaErispondi(
            String numero,
            TipoDocumento tipo,
            StatoFattura stato,
            LocalDate dataEmissione,
            String nomeCliente,
            boolean timbreFiscal,
            boolean logoIntestazioneVisibile,
            boolean logoWatermarkVisibile,
            BigDecimal remiseGlobale,
            Utente admin,
            Boutique boutique,
            Fattura fatturaOrigine,
            List<RigaFattura> righe) {

        Fattura fattura = new Fattura();
        fattura.setNumero(numero);
        fattura.setTipo(tipo);
        fattura.setStato(stato);
        fattura.setDataEmissione(dataEmissione);
        fattura.setNomeCliente(nomeCliente);
        fattura.setTimbreFiscal(timbreFiscal);
        fattura.setLogoIntestazioneVisibile(logoIntestazioneVisibile);
        fattura.setLogoWatermarkVisibile(logoWatermarkVisibile);
        fattura.setRemiseGlobale(remiseGlobale);
        fattura.setAdmin(admin);
        fattura.setBoutique(boutique);
        fattura.setFatturaOrigine(fatturaOrigine);

        righe.forEach(r -> {
            r.setFattura(fattura);
            fattura.getRighe().add(r);
        });

        fatturaCalcoloService.calcolaTotali(fattura);
        fatturaRepository.save(fattura);
        return fatturaMapper.toResponse(fattura);
    }

    private String numeroBozza() {
        return "BOZZA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
