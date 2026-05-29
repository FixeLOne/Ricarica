package lx.gestionale.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lx.gestionale.fattura.FatturaService;
import lx.gestionale.fattura.TipoDocumento;
import lx.gestionale.fattura.dto.CreaFatturaRequest;
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

        salvaTariffeAdminA(adminA);
        salvaTariffeAdminB(adminB);
        salvaFattureDemo(adminA, adminB, boutiqueA1, boutiqueB1);

        log.info("[DEV] Database inizializzato.");
        log.info("[DEV]   Utenti   : {} | adminA | adminB | adminC | dipA1 | dipA2 | dipB1 | dipB2", superAdmin.getUsername());
        log.info("[DEV]   Boutique : A1(id={},fatture=ON) | A2(id={},fatture=OFF) | B1(id={},fatture=ON) | B2(id={},fatture=OFF)",
                boutiqueA1.getId(), boutiqueA2.getId(), boutiqueB1.getId(), boutiqueB2.getId());
        log.info("[DEV]   Tariffe  : AdminA=21 | AdminB=6 | AdminC=0");
        log.info("[DEV]   Fatture  : AdminA=5 documenti | AdminB=1 documento");
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
        creaDocumentoDemo(adminA, null, TipoDocumento.DEVIS, "Studio Medina", LocalDate.now().minusDays(9), false,
                List.of(riga("Consulenza configurazione gestionale", "1", "180.000", "19")));

        creaDocumentoDemo(adminA, boutiqueA1, TipoDocumento.FACTURE, "Clinique El Amal", LocalDate.now().minusDays(6), true,
                List.of(
                        riga("SRV-DATA", "Recharge data business", "2", "75.000", "19", "5.00"),
                        riga("Supporto punto vendita", "1", "35.000", "19")
                ));

        FatturaResponse emessaA = emettiDocumentoDemo(creaDocumentoDemo(
                adminA,
                boutiqueA1,
                TipoDocumento.FACTURE,
                "Hotel Carthage",
                LocalDate.now().minusDays(4),
                true,
                List.of(riga("Pacchetto ricariche corporate", "3", "120.000", "19"))
        ), adminA);

        FatturaResponse annullataA = emettiDocumentoDemo(creaDocumentoDemo(
                adminA,
                boutiqueA1,
                TipoDocumento.FACTURE,
                "Client avoir demo",
                LocalDate.now().minusDays(2),
                true,
                List.of(riga("Servizio annullato", "1", "95.000", "19"))
        ), adminA);
        fatturaService.creaAvoir(annullataA.getId(), adminA.getId(), null, Ruolo.ADMIN.name());

        emettiDocumentoDemo(creaDocumentoDemo(
                adminB,
                boutiqueB1,
                TipoDocumento.FACTURE,
                "Sousse Market",
                LocalDate.now().minusDays(1),
                true,
                List.of(riga("Fornitura SIM e servizi", "4", "42.000", "19"))
        ), adminB);

        if (emessaA.getId() == null) {
            throw new IllegalStateException("Seed fatture non riuscito");
        }
    }

    private FatturaResponse creaDocumentoDemo(
            Utente admin,
            Boutique boutique,
            TipoDocumento tipo,
            String cliente,
            LocalDate data,
            boolean timbreFiscal,
            List<RigaFatturaRequest> righe
    ) {
        CreaFatturaRequest request = new CreaFatturaRequest();
        request.setTipo(tipo);
        request.setDataEmissione(data);
        request.setNomeCliente(cliente);
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
        boutique.setCittà(citta);
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
