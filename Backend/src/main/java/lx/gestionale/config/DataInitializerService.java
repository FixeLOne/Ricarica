package lx.gestionale.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lx.gestionale.fattura.Fattura;
import lx.gestionale.fattura.FatturaService;
import lx.gestionale.fattura.TipoDocumento;
import lx.gestionale.fattura.dto.CreaFatturaRequest;
import lx.gestionale.fattura.datiazienda.DatiAzienda;
import lx.gestionale.fattura.datiazienda.DatiAziendaRepository;
import lx.gestionale.fattura.dto.FatturaResponse;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaRepository;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
class DataInitializerService {

    private final TariffaRepository tariffaRepository;
    private final UtenteRepository utenteRepository;
    private final BoutiqueRepository boutiqueRepository;
    private final PasswordEncoder passwordEncoder;
    private final FatturaService fatturaService;
    private final DatiAziendaRepository datiAziendaRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void eseguiInizializzazione() {
        if (utenteRepository.count() > 0) {
            log.info("[DEV] Database gia inizializzato, skip.");
            return;
        }

        log.info("[DEV] Avvio inizializzazione database demo...");

        Utente superAdmin = creaUtente("Super Admin", "superadmin", "superadmin123", Ruolo.SUPER_ADMIN, null);
        Utente adminA = creaUtente("Admin A", "adminA", "adminA123", Ruolo.ADMIN, null);
        Utente adminB = creaUtente("Admin B", "adminB", "adminB123", Ruolo.ADMIN, null);
        Utente adminC = creaUtente("Admin C", "adminC", "adminC123", Ruolo.ADMIN, null);

        Boutique boutiqueA1 = creaBoutique("Boutique A1", "Tunisi", adminA, true);
        Boutique boutiqueA2 = creaBoutique("Boutique A2", "Sfax", adminA, false);
        Boutique boutiqueB1 = creaBoutique("Boutique B1", "Sousse", adminB, true);
        Boutique boutiqueB2 = creaBoutique("Boutique B2", "Monastir", adminB, false);

        creaUtente("Dipendente A1", "dipA1", "dipA1123", Ruolo.DIPENDENTE, boutiqueA1);
        creaUtente("Dipendente A2", "dipA2", "dipA2123", Ruolo.DIPENDENTE, boutiqueA2);
        creaUtente("Dipendente B1", "dipB1", "dipB1123", Ruolo.DIPENDENTE, boutiqueB1);
        creaUtente("Dipendente B2", "dipB2", "dipB2123", Ruolo.DIPENDENTE, boutiqueB2);

        // AdminA ha i contatti facoltativi compilati, AdminB no: sono i due modi
        // in cui puo presentarsi il piede della fattura. AdminC resta senza dati
        // azienda, ed e il caso "primo accesso" da configurare.
        salvaDatiAzienda(adminA, "Sahara Telecom SARL", "12 Avenue Habib Bourguiba, 1000 Tunis",
                "1234567/A/M/000", "+216 71 123 456", "contact@saharatelecom.tn", "www.saharatelecom.tn");
        salvaDatiAzienda(adminB, "Medina Mobile SUARL", "45 Rue de la Kasbah, 4000 Sousse",
                "7654321/B/M/000", null, null, null);

        salvaTariffeAdminA(adminA);
        salvaTariffeAdminB(adminB);
        salvaFattureDemo(adminA, adminB, boutiqueA1, boutiqueB1);
        sparpagliaTimestampDemo();

        log.info("[DEV] Database inizializzato.");
        log.info("[DEV]   Utenti   : {} | adminA | adminB | adminC | dipA1 | dipA2 | dipB1 | dipB2", superAdmin.getUsername());
        log.info("[DEV]   Boutique : A1(id={},fatture=ON) | A2(id={},fatture=OFF) | B1(id={},fatture=ON) | B2(id={},fatture=OFF)",
                boutiqueA1.getId(), boutiqueA2.getId(), boutiqueB1.getId(), boutiqueB2.getId());
        log.info("[DEV]   Tariffe  : AdminA=21 | AdminB=6 | AdminC=0");
        log.info("[DEV]   Azienda  : AdminA=completa | AdminB=senza contatti | AdminC=da configurare");
        log.info("[DEV]   Fatture  : AdminA=5 documenti | AdminB=1 documento");
    }

    /**
     * I documenti demo nascono tutti nel medesimo istante: la colonna
     * "modificato" della lista mostrerebbe cinque volte la stessa ora e non si
     * capirebbe che la lista e ordinata per ultimo salvataggio. Qui li si
     * distribuisce sull'orario di lavoro del rispettivo giorno di emissione.
     *
     * Va in UPDATE diretto perche @UpdateTimestamp sovrascriverebbe il valore
     * a ogni save. Serve solo al seed di sviluppo.
     */
    private void sparpagliaTimestampDemo() {
        entityManager.createQuery("select f from Fattura f", Fattura.class)
                .getResultList()
                .forEach(fattura -> {
                    int seme = fattura.getId().intValue();
                    // Mai nel futuro: per un documento emesso oggi l'orario di
                    // ufficio potrebbe non essere ancora arrivato.
                    LocalDateTime istante = min(
                            fattura.getDataEmissione().atTime(9 + seme % 8, (seme * 17) % 60),
                            LocalDateTime.now());
                    entityManager.createQuery(
                                    "update Fattura f set f.dataCreazione = :istante, f.dataUltimaModifica = :istante where f.id = :id")
                            .setParameter("istante", istante)
                            .setParameter("id", fattura.getId())
                            .executeUpdate();
                });
    }

    private static LocalDateTime min(LocalDateTime a, LocalDateTime b) {
        return a.isBefore(b) ? a : b;
    }

    private void salvaDatiAzienda(Utente admin, String ragioneSociale, String indirizzo, String matriculeFiscale,
                                  String telefono, String email, String sitoWeb) {
        DatiAzienda dati = new DatiAzienda();
        dati.setAdmin(admin);
        dati.setRagioneSociale(ragioneSociale);
        dati.setIndirizzo(indirizzo);
        dati.setMatriculeFiscale(matriculeFiscale);
        dati.setTelefono(telefono);
        dati.setEmail(email);
        dati.setSitoWeb(sitoWeb);
        datiAziendaRepository.save(dati);
    }

    private void salvaTariffeAdminA(Utente admin) {
        salvaTariffa(admin, Operatore.ooredoo, 5.0, "3.200", "4.800");
        salvaTariffa(admin, Operatore.ooredoo, 10.0, "6.500", "9.000");
        salvaTariffa(admin, Operatore.ooredoo, 25.0, "14.000", "19.000");
        salvaTariffa(admin, Operatore.ooredoo, 50.0, "20.000", "25.000");
        salvaTariffa(admin, Operatore.ooredoo, 100.0, "40.000", "48.000");

        salvaTariffa(admin, Operatore.orange, 5.0, "3.000", "4.500");
        salvaTariffa(admin, Operatore.orange, 10.0, "6.000", "9.000");
        salvaTariffa(admin, Operatore.orange, 25.0, "13.000", "18.000");
        salvaTariffa(admin, Operatore.orange, 50.0, "22.000", "28.000");

        salvaTariffa(admin, Operatore.telecom, 5.0, "2.800", "4.200");
        salvaTariffa(admin, Operatore.telecom, 10.0, "5.000", "7.500");
        salvaTariffa(admin, Operatore.telecom, 20.0, "8.000", "12.000");

        salvaTariffa(admin, Operatore.fisso, 5.0, "2.500", "4.000");
        salvaTariffa(admin, Operatore.fisso, 10.0, "4.500", "7.000");

        salvaTariffa(admin, null, 15.0, "6.000", "9.000");
        salvaTariffa(admin, null, 13.0, "6.000", "9.000");
        salvaTariffa(admin, null, 12.0, "6.000", "9.000");
        salvaTariffa(admin, null, 11.0, "6.000", "9.000");
        salvaTariffa(admin, null, 17.0, "6.000", "9.000");
        salvaTariffa(admin, null, 122.0, "6.000", "9.000");
        salvaTariffa(admin, null, 1500.0, "6.000", "9.000");
    }

    private void salvaTariffeAdminB(Utente admin) {
        salvaTariffa(admin, Operatore.ooredoo, 10.0, "6.000", "8.500");
        salvaTariffa(admin, Operatore.ooredoo, 50.0, "22.000", "27.000");
        salvaTariffa(admin, Operatore.orange, 10.0, "6.200", "9.000");
        salvaTariffa(admin, Operatore.orange, 25.0, "13.500", "18.500");
        salvaTariffa(admin, Operatore.telecom, 10.0, "5.200", "7.800");
        salvaTariffa(admin, null, 10.0, "5.000", "7.500");
    }

    private void salvaFattureDemo(Utente adminA, Utente adminB, Boutique boutiqueA1, Boutique boutiqueB1) {
        creaDocumentoDemo(adminA, null, TipoDocumento.DEVIS,
                cliente("Studio Medina", "Rue Ibn Khaldoun 8, 1002 Tunis", "0912345/A/M/000"),
                LocalDate.now().minusDays(9), false,
                List.of(riga("Consulenza configurazione gestionale", "1", "180.000", "19")));

        creaDocumentoDemo(adminA, boutiqueA1, TipoDocumento.FACTURE,
                cliente("Clinique El Amal", "Rue de la Sante 45, 3000 Sfax", "7654321/B/C/000"),
                LocalDate.now().minusDays(6), true,
                List.of(
                        riga("SRV-DATA", "Recharge data business", "2", "75.000", "19", "5.00"),
                        riga("Supporto punto vendita", "1", "35.000", "19")
                ));

        FatturaResponse emessaA = emettiDocumentoDemo(creaDocumentoDemo(
                adminA,
                boutiqueA1,
                TipoDocumento.FACTURE,
                cliente("Hotel Carthage", "Avenue de la Republique 120, 2016 Carthage", "4455667/D/E/000"),
                LocalDate.now().minusDays(4),
                true,
                List.of(riga("Pacchetto ricariche corporate", "3", "120.000", "19"))
        ), adminA);

        // Volutamente senza dati B2B: rappresenta la vendita al banco, dove
        // il cliente non fornisce indirizzo e matricule fiscale.
        FatturaResponse annullataA = emettiDocumentoDemo(creaDocumentoDemo(
                adminA,
                boutiqueA1,
                TipoDocumento.FACTURE,
                cliente("Client avoir demo"),
                LocalDate.now().minusDays(2),
                true,
                List.of(riga("Servizio annullato", "1", "95.000", "19"))
        ), adminA);
        fatturaService.creaAvoir(annullataA.getId(), adminA.getId(), null, Ruolo.ADMIN.name());

        emettiDocumentoDemo(creaDocumentoDemo(
                adminB,
                boutiqueB1,
                TipoDocumento.FACTURE,
                cliente("Sousse Market", "Avenue Habib Bourguiba 3, 4000 Sousse", "8899001/F/G/000"),
                LocalDate.now().minusDays(1),
                true,
                List.of(riga("Fornitura SIM e servizi", "4", "42.000", "19"))
        ), adminB);

        if (emessaA.getId() == null) {
            throw new IllegalStateException("Seed fatture non riuscito");
        }
    }

    /** Cliente demo: solo nome (vendita al banco) oppure completo di dati B2B. */
    private record ClienteDemo(String nome, String indirizzo, String matriculeFiscale) {
    }

    private ClienteDemo cliente(String nome) {
        return new ClienteDemo(nome, null, null);
    }

    private ClienteDemo cliente(String nome, String indirizzo, String matriculeFiscale) {
        return new ClienteDemo(nome, indirizzo, matriculeFiscale);
    }

    private FatturaResponse creaDocumentoDemo(
            Utente admin,
            Boutique boutique,
            TipoDocumento tipo,
            ClienteDemo cliente,
            LocalDate data,
            boolean timbreFiscal,
            List<RigaFatturaRequest> righe
    ) {
        CreaFatturaRequest request = new CreaFatturaRequest();
        request.setTipo(tipo);
        request.setDataEmissione(data);
        request.setNomeCliente(cliente.nome());
        request.setIndirizzoCliente(cliente.indirizzo());
        request.setMatriculeFiscaleCliente(cliente.matriculeFiscale());
        request.setTimbreFiscal(timbreFiscal);
        request.setRemiseGlobale(BigDecimal.ZERO);
        request.setBoutiqueId(boutique != null ? boutique.getId() : null);
        request.setRighe(righe);
        return fatturaService.creaFattura(request, admin.getId(), null, Ruolo.ADMIN.name());
    }

    private FatturaResponse emettiDocumentoDemo(FatturaResponse fattura, Utente admin) {
        return fatturaService.emettiFattura(fattura.getId(), admin.getId(), null, Ruolo.ADMIN.name());
    }

    private RigaFatturaRequest riga(String descrizione, String quantita, String prezzoUnitarioHT, String aliquotaTVA) {
        return riga(null, descrizione, quantita, prezzoUnitarioHT, aliquotaTVA, "0.00");
    }

    private RigaFatturaRequest riga(
            String reference,
            String descrizione,
            String quantita,
            String prezzoUnitarioHT,
            String aliquotaTVA,
            String scontoPercentuale
    ) {
        RigaFatturaRequest request = new RigaFatturaRequest();
        request.setReference(reference);
        request.setDescrizione(descrizione);
        request.setQuantita(new BigDecimal(quantita));
        request.setPrezzoUnitarioHT(new BigDecimal(prezzoUnitarioHT));
        request.setAliquotaTVA(new BigDecimal(aliquotaTVA));
        request.setScontoPercentuale(new BigDecimal(scontoPercentuale));
        return request;
    }

    private Utente creaUtente(String nome, String username, String password, Ruolo ruolo, Boutique boutique) {
        Utente utente = new Utente();
        utente.setNome(nome);
        utente.setUsername(username);
        utente.setPassword(passwordEncoder.encode(password));
        utente.setRuolo(ruolo);
        utente.setBoutique(boutique);
        return utenteRepository.save(utente);
    }

    private Boutique creaBoutique(String nome, String citta, Utente admin, boolean fattureAbilitate) {
        Boutique boutique = new Boutique();
        boutique.setNome(nome);
        boutique.setCitta(citta);
        boutique.setAdmin(admin);
        boutique.setFattureAbilitate(fattureAbilitate);
        return boutiqueRepository.save(boutique);
    }

    private void salvaTariffa(Utente admin, Operatore operatore, double giga, String costo, String vendita) {
        Tariffa tariffa = new Tariffa();
        tariffa.setAdmin(admin);
        tariffa.setOperatore(operatore);
        tariffa.setGiga(BigDecimal.valueOf(giga));
        tariffa.setCostoAcquisto(new BigDecimal(costo));
        tariffa.setPrezzoVendita(new BigDecimal(vendita));
        tariffaRepository.save(tariffa);
    }
}
