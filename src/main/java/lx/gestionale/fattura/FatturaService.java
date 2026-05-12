package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.dto.*;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FatturaService {

    private final FatturaRepository fatturaRepository;
    private final ContatoreFatturaService contatoreFatturaService;
    private final BoutiqueRepository boutiqueRepository;
    private final UtenteRepository utenteRepository;

    @Value("${fattura.timbre-fiscal.valore:1.000}")
    private BigDecimal timbreValore;

    // ── Crea fattura ──────────────────────────────────────────────────────────

    @Transactional
    public FatturaResponse creaFattura(CreaFatturaRequest request, Long utenteId, Long boutiqueId) {
        Utente admin;
        Boutique boutique = null;

        if (boutiqueId != null) {
            // ── DIPENDENTE ─────────────────────────────────────────────────────
            // Il boutiqueId viene dal token JWT: non è manipolabile dal client.
            // Non usiamo MAI request.getBoutiqueId() per i dipendenti.
            boutique = boutiqueRepository.findById(boutiqueId)
                    .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));
            if (!boutique.isFattureAbilitate()) {
                throw new IllegalArgumentException("Le fatture non sono abilitate per questa boutique");
            }
            admin = boutique.getAdmin();

        } else {
            // ── ADMIN ──────────────────────────────────────────────────────────
            admin = utenteRepository.findById(utenteId)
                    .orElseThrow(() -> new IllegalArgumentException("Admin non trovato"));

            // L'Admin può facoltativamente assegnare la fattura a una sua boutique
            // passando boutiqueId nel body della request.
            if (request.getBoutiqueId() != null) {
                boutique = boutiqueRepository.findById(request.getBoutiqueId())
                        .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));

                // SICUREZZA: verifica che la boutique appartenga all'admin del token.
                // Senza questo controllo, un admin potrebbe creare fatture
                // su boutique di altri admin passando un ID arbitrario nel body.
                if (!boutique.getAdmin().getId().equals(utenteId)) {
                    throw new IllegalArgumentException("Non hai i permessi su questa boutique");
                }

                if (!boutique.isFattureAbilitate()) {
                    throw new IllegalArgumentException("Le fatture non sono abilitate per questa boutique");
                }
            }
        }

        String numero = contatoreFatturaService.generaNumero(admin, request.getTipo());
        Fattura fattura = new Fattura();
        fattura.setNumero(numero);
        fattura.setTipo(request.getTipo());
        fattura.setStato(StatoFattura.BOZZA);
        fattura.setDataEmissione(request.getDataEmissione());
        fattura.setNomeCliente(request.getNomeCliente());
        fattura.setTimbreFiscal(request.isTimbreFiscal());
        fattura.setRemiseGlobale(request.getRemiseGlobale());
        fattura.setAdmin(admin);
        fattura.setBoutique(boutique); // null se l'Admin non ha specificato una boutique

        if (request.getTipo() == TipoDocumento.AVOIR && request.getFatturaOrigineId() != null) {
            Fattura origine = trovaFattura(request.getFatturaOrigineId());
            if (origine.getStato() != StatoFattura.EMESSA) {
                throw new IllegalArgumentException("Si può emettere un Avoir solo su fatture EMESSE");
            }
            fattura.setFatturaOrigine(origine);
        }

        request.getRighe().stream()
                .map(r -> buildRiga(r, fattura))
                .forEach(fattura.getRighe()::add);

        calcolaTotali(fattura);
        fatturaRepository.save(fattura);
        return toResponse(fattura);
    }

    // ── Modifica fattura ──────────────────────────────────────────────────────

    @Transactional
    public FatturaResponse modificaFattura(Long id, CreaFatturaRequest request, Long utenteId, Long boutiqueId) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId);

        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture in stato BOZZA possono essere modificate");
        }

        fattura.setDataEmissione(request.getDataEmissione());
        fattura.setNomeCliente(request.getNomeCliente());
        fattura.setTimbreFiscal(request.isTimbreFiscal());
        fattura.setRemiseGlobale(request.getRemiseGlobale());

        fattura.getRighe().clear();
        request.getRighe().stream()
                .map(r -> buildRiga(r, fattura))
                .forEach(fattura.getRighe()::add);

        calcolaTotali(fattura);
        fatturaRepository.save(fattura);
        return toResponse(fattura);
    }

    // ── Emetti fattura ────────────────────────────────────────────────────────

    @Transactional
    public FatturaResponse emettiFattura(Long id, Long utenteId, Long boutiqueId) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId);

        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture in stato BOZZA possono essere emesse");
        }

        fattura.setStato(StatoFattura.EMESSA);
        fatturaRepository.save(fattura);
        return toResponse(fattura);
    }

    // ── Crea Avoir ────────────────────────────────────────────────────────────

    @Transactional
    public FatturaResponse creaAvoir(Long fatturaOrigineId, Long utenteId, Long boutiqueId) {
        Fattura origine = trovaFattura(fatturaOrigineId);
        verificaOwnership(origine, utenteId, boutiqueId);

        if (origine.getStato() != StatoFattura.EMESSA) {
            throw new IllegalArgumentException("Si può emettere un Avoir solo su fatture EMESSE");
        }

        String numero = contatoreFatturaService.generaNumero(origine.getAdmin(), TipoDocumento.AVOIR);
        Fattura avoir = new Fattura();
        avoir.setNumero(numero);
        avoir.setTipo(TipoDocumento.AVOIR);
        avoir.setStato(StatoFattura.EMESSA);
        avoir.setDataEmissione(LocalDate.now());
        avoir.setNomeCliente(origine.getNomeCliente());
        avoir.setTimbreFiscal(origine.isTimbreFiscal());
        avoir.setRemiseGlobale(origine.getRemiseGlobale());
        avoir.setAdmin(origine.getAdmin());
        avoir.setBoutique(origine.getBoutique());
        avoir.setFatturaOrigine(origine);

        origine.getRighe().stream()
                .map(r -> buildRigaDaEsistente(r, avoir))
                .forEach(avoir.getRighe()::add);

        calcolaTotali(avoir);

        origine.setStato(StatoFattura.ANNULLATA);
        fatturaRepository.save(origine);
        fatturaRepository.save(avoir);
        return toResponse(avoir);
    }

    // ── Lista fatture ─────────────────────────────────────────────────────────

    public List<FatturaResponse> getFatture(Long utenteId, Long boutiqueId) {
        List<Fattura> fatture = boutiqueId != null
                ? fatturaRepository.findByBoutiqueId(boutiqueId)
                : fatturaRepository.findByAdminId(utenteId);
        return fatture.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Fattura per ID ────────────────────────────────────────────────────────

    public FatturaResponse getFatturaById(Long id, Long utenteId, Long boutiqueId) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId);
        return toResponse(fattura);
    }

    // ── Elimina fattura ───────────────────────────────────────────────────────

    @Transactional
    public void eliminaFattura(Long id, Long utenteId, Long boutiqueId) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId);
        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture BOZZA possono essere eliminate. Per annullare una fattura emessa, emettere un Avoir.");
        }
        fatturaRepository.deleteById(id);
    }

    // ── Privati ───────────────────────────────────────────────────────────────

    private RigaFattura buildRiga(RigaFatturaRequest r, Fattura fattura) {
        RigaFattura riga = new RigaFattura();
        riga.setDescrizione(r.getDescrizione());
        riga.setQuantita(r.getQuantita());
        riga.setPrezzoUnitarioHT(r.getPrezzoUnitarioHT());
        riga.setAliquotaTVA(r.getAliquotaTVA());
        riga.setMontanteHT(r.getQuantita().multiply(r.getPrezzoUnitarioHT()));
        riga.setFattura(fattura);
        return riga;
    }

    private RigaFattura buildRigaDaEsistente(RigaFattura r, Fattura fattura) {
        RigaFattura riga = new RigaFattura();
        riga.setDescrizione(r.getDescrizione());
        riga.setQuantita(r.getQuantita());
        riga.setPrezzoUnitarioHT(r.getPrezzoUnitarioHT());
        riga.setAliquotaTVA(r.getAliquotaTVA());
        riga.setMontanteHT(r.getMontanteHT());
        riga.setFattura(fattura);
        return riga;
    }

    private void calcolaTotali(Fattura fattura) {
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

        fattura.setTotaleHT(totaleHT);
        fattura.setTotaleTVA(totaleTVA);
        fattura.setTotaleNet(totaleNet);
    }

    private void verificaOwnership(Fattura fattura, Long utenteId, Long boutiqueId) {
        if (boutiqueId != null) {
            // ── DIPENDENTE ─────────────────────────────────────────────────────
            // Verifica che la fattura appartenga alla boutique del token.
            if (fattura.getBoutique() == null || !fattura.getBoutique().getId().equals(boutiqueId)) {
                throw new IllegalArgumentException("Non hai i permessi per accedere a questa fattura");
            }
            // Catena boutique → admin: difesa in profondità contro incongruenze dei dati.
            // Garantisce che anche se un boutiqueId fosse stato assegnato erroneamente,
            // la boutique appartenga comunque all'admin corretto.
            if (!fattura.getBoutique().getAdmin().getId().equals(fattura.getAdmin().getId())) {
                throw new IllegalStateException("Incongruenza tra boutique e admin sulla fattura: ID " + fattura.getId());
            }

        } else {
            // ── ADMIN ──────────────────────────────────────────────────────────
            // Il campo admin è sempre valorizzato alla creazione (sia per fatture
            // orfane che per fatture con boutique), quindi questo check copre entrambi i casi.
            if (!fattura.getAdmin().getId().equals(utenteId)) {
                throw new IllegalArgumentException("Non hai i permessi per accedere a questa fattura");
            }
        }
    }

    private Fattura trovaFattura(Long id) {
        return fatturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fattura con ID " + id + " non trovata"));
    }

    private FatturaResponse toResponse(Fattura f) {
        List<RigaFatturaResponse> righeResponse = f.getRighe().stream()
                .map(r -> new RigaFatturaResponse(
                        r.getId(),
                        r.getDescrizione(),
                        r.getQuantita(),
                        r.getPrezzoUnitarioHT(),
                        r.getAliquotaTVA(),
                        r.getMontanteHT()
                ))
                .collect(Collectors.toList());

        return new FatturaResponse(
                f.getId(),
                f.getNumero(),
                f.getTipo(),
                f.getStato(),
                f.getDataEmissione(),
                f.getNomeCliente(),
                f.isTimbreFiscal(),
                f.getRemiseGlobale(),
                f.getTotaleHT(),
                f.getTotaleTVA(),
                f.getTotaleNet(),
                f.getBoutique() != null ? f.getBoutique().getNome() : null,
                righeResponse,
                f.getFatturaOrigine() != null ? f.getFatturaOrigine().getNumero() : null
        );
    }
}