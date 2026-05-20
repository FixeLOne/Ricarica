package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.contatore.ContatoreFatturaService;
import lx.gestionale.fattura.dto.*;
import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;
import lx.gestionale.fattura.riga.dto.RigaFatturaResponse;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    public FatturaResponse creaFattura(CreaFatturaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        // Risolvi admin e boutique dal contesto del chiamante
        AdminBoutiquePair pair = risolviAmministratore(request, utenteId, boutiqueId);

        // Se è un AVOIR, annulla la fattura origine
        Fattura fatturaOrigine = gestisciAvoirOrigine(request, utenteId, boutiqueId, ruolo);

        // Costruisci le righe dalla request
        List<RigaFattura> righe = request.getRighe().stream()
                .map(r -> buildRiga(r, null))
                .collect(Collectors.toList());

        StatoFattura stato = request.getTipo() == TipoDocumento.AVOIR
                ? StatoFattura.EMESSA
                : StatoFattura.BOZZA;

        // Genera un numero random per la bozza
        String numero = (stato == StatoFattura.EMESSA)
                ? contatoreFatturaService.generaNumero(pair.admin(), request.getTipo())
                : "BOZZA-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Per un AVOIR la data è sempre oggi, non quella passata nella request
        LocalDate dataEmissione = request.getTipo() == TipoDocumento.AVOIR
                ? LocalDate.now()
                : request.getDataEmissione();

        return assemblaSalvaErispondi(
                numero,
                request.getTipo(),
                stato,
                dataEmissione,
                request.getNomeCliente(),
                request.isTimbreFiscal(),
                request.getRemiseGlobale(),
                pair.admin(),
                pair.boutique(),
                fatturaOrigine,
                righe
        );
    }

    /**
     * Risolve admin e boutique in base a chi sta chiamando:
     * - dipendente (boutiqueId != null): la boutique è quella del token, l'admin è il suo admin
     * - admin diretto: l'admin è l'utente corrente, la boutique è opzionale dalla request
     */
    private AdminBoutiquePair risolviAmministratore(CreaFatturaRequest request, Long utenteId, Long boutiqueId) {
        if (boutiqueId != null) {
            Boutique boutique = caricaBoutiqueAbilitata(boutiqueId);
            return new AdminBoutiquePair(boutique.getAdmin(), boutique);
        }

        Utente admin = utenteRepository.findById(utenteId)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trovato"));

        if (request.getBoutiqueId() == null) {
            return new AdminBoutiquePair(admin, null);
        }

        Boutique boutique = caricaBoutiqueAbilitata(request.getBoutiqueId());
        if (!boutique.getAdmin().getId().equals(utenteId)) {
            throw new IllegalArgumentException("Non hai i permessi su questa boutique");
        }
        return new AdminBoutiquePair(admin, boutique);
    }

    /**
     * Se la request è di tipo AVOIR e porta un ID origine, carica la fattura,
     * verifica i permessi, e la porta in stato ANNULLATA.
     * Restituisce null se non è un AVOIR o non c'è un origine.
     */
    private Fattura gestisciAvoirOrigine(CreaFatturaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        if (request.getTipo() != TipoDocumento.AVOIR || request.getFatturaOrigineId() == null) {
            return null;
        }

        Fattura origine = trovaFattura(request.getFatturaOrigineId());
        verificaOwnership(origine, utenteId, boutiqueId, ruolo);

        if (origine.getStato() != StatoFattura.EMESSA) {
            throw new IllegalArgumentException("Si può emettere un Avoir solo su fatture EMESSE");
        }
        if (origine.getTipo() == TipoDocumento.AVOIR) {
            throw new IllegalArgumentException("Non è possibile emettere un Avoir su un altro Avoir");
        }

        origine.setStato(StatoFattura.ANNULLATA);
        fatturaRepository.save(origine);
        return origine;
    }

    /** Carica una boutique e verifica che le fatture siano abilitate. */
    private Boutique caricaBoutiqueAbilitata(Long boutiqueId) {
        Boutique boutique = boutiqueRepository.findById(boutiqueId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));
        if (!boutique.isFattureAbilitate()) {
            throw new IllegalArgumentException("Le fatture non sono abilitate per questa boutique");
        }
        return boutique;
    }

    // ── Modifica fattura ──────────────────────────────────────────────────────

    @Transactional
    public FatturaResponse modificaFattura(Long id, CreaFatturaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId, ruolo);

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
    public FatturaResponse emettiFattura(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId, ruolo);

        if (fattura.getStato() != StatoFattura.BOZZA) {
            throw new IllegalArgumentException("Solo le fatture in stato BOZZA possono essere emesse");
        }

        String numeroReale = contatoreFatturaService.generaNumero(fattura.getAdmin(), fattura.getTipo());
        fattura.setNumero(numeroReale);

        fattura.setStato(StatoFattura.EMESSA);
        fatturaRepository.save(fattura);
        return toResponse(fattura);
    }

    // ── Crea Avoir (da fattura esistente, copia automatica delle righe) ───────

    @Transactional
    public FatturaResponse creaAvoir(Long fatturaOrigineId, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura origine = trovaFattura(fatturaOrigineId);
        verificaOwnership(origine, utenteId, boutiqueId, ruolo);

        if (origine.getStato() != StatoFattura.EMESSA) {
            throw new IllegalArgumentException("Si può emettere un Avoir solo su fatture EMESSE");
        }
        if (origine.getTipo() == TipoDocumento.AVOIR) {
            throw new IllegalArgumentException("Non è possibile emettere un Avoir su un altro Avoir");
        }

        List<RigaFattura> righe = origine.getRighe().stream()
                .map(r -> buildRigaDaEsistente(r, null))
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
                origine.getRemiseGlobale(),
                origine.getAdmin(),
                origine.getBoutique(),
                origine,
                righe
        );
    }

    // ── Lista fatture ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<FatturaResponse> getFatture(Long utenteId, Long boutiqueId, String ruolo, Pageable pageable) {
        Page<Fattura> fatture = switch (ruolo) {
            case "SUPER_ADMIN" -> fatturaRepository.findAll(pageable);
            case "ADMIN"       -> fatturaRepository.findByAdminId(utenteId, pageable);
            case "DIPENDENTE"  -> fatturaRepository.findByBoutiqueId(boutiqueId, pageable);
            default            -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        };
        return fatture.map(this::toResponse);
    }

    // ── Fattura per ID ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FatturaResponse getFatturaById(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId, ruolo);
        return toResponse(fattura);
    }

    // ── Elimina fattura ───────────────────────────────────────────────────────

    @Transactional
    public void eliminaFattura(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId, ruolo);
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

        if (totaleNet.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Lo sconto globale non può superare il totale. Il totale netto non può essere negativo.");
        }

        fattura.setTotaleHT(totaleHT);
        fattura.setTotaleTVA(totaleTVA);
        fattura.setTotaleNet(totaleNet);
    }

    private void verificaOwnership(Fattura fattura, Long utenteId, Long boutiqueId, String ruolo) {
        if ("SUPER_ADMIN".equals(ruolo)) {
            return;
        }
        if (boutiqueId != null) {
            if (fattura.getBoutique() == null || !fattura.getBoutique().getId().equals(boutiqueId)) {
                throw new IllegalArgumentException("Non hai i permessi per accedere a questa fattura");
            }
            if (!fattura.getBoutique().getAdmin().getId().equals(fattura.getAdmin().getId())) {
                throw new IllegalStateException("Incongruenza tra boutique e admin sulla fattura: ID " + fattura.getId());
            }
        } else {
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

    private FatturaResponse assemblaSalvaErispondi(
            String numero,
            TipoDocumento tipo,
            StatoFattura stato,
            LocalDate dataEmissione,
            String nomeCliente,
            boolean timbreFiscal,
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
        fattura.setRemiseGlobale(remiseGlobale);
        fattura.setAdmin(admin);
        fattura.setBoutique(boutique);
        fattura.setFatturaOrigine(fatturaOrigine);

        righe.forEach(r -> {
            r.setFattura(fattura);
            fattura.getRighe().add(r);
        });

        calcolaTotali(fattura);
        fatturaRepository.save(fattura);
        return toResponse(fattura);
    }

    // ── Record di supporto ────────────────────────────────────────────────────

    private record AdminBoutiquePair(Utente admin, Boutique boutique) {}
}