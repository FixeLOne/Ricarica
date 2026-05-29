package lx.gestionale.fattura.datiazienda;

import lx.gestionale.fattura.datiazienda.dto.DatiAziendaResponse;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueAccessService;
import lx.gestionale.negozio.BoutiqueServizio;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DatiAziendaServiceTest {

    private DatiAziendaRepository datiAziendaRepository;
    private UtenteRepository utenteRepository;
    private BoutiqueAccessService boutiqueAccessService;
    private DatiAziendaService service;

    @BeforeEach
    void setUp() {
        datiAziendaRepository = mock(DatiAziendaRepository.class);
        utenteRepository = mock(UtenteRepository.class);
        boutiqueAccessService = mock(BoutiqueAccessService.class);
        service = new DatiAziendaService(datiAziendaRepository, utenteRepository, boutiqueAccessService);
    }

    @Test
    void adminLeggeIPropriDatiAziendali() {
        Utente admin = utente(10L, Ruolo.ADMIN);
        DatiAzienda dati = datiAzienda(admin);

        when(utenteRepository.findById(10L)).thenReturn(Optional.of(admin));
        when(datiAziendaRepository.findByAdmin(admin)).thenReturn(Optional.of(dati));

        DatiAziendaResponse response = service.getDatiAccessibili(10L, null, "ADMIN");

        assertThat(response.getRagioneSociale()).isEqualTo("RechargeNet Admin");
        verify(boutiqueAccessService, never()).richiediBoutiqueConServizioAttivo(
                null,
                10L,
                null,
                "ADMIN",
                BoutiqueServizio.FATTURE
        );
    }

    @Test
    void dipendenteLeggeIDatiDellAdminProprietarioDellaBoutique() {
        Utente admin = utente(10L, Ruolo.ADMIN);
        Boutique boutique = boutique(1L, admin);
        DatiAzienda dati = datiAzienda(admin);

        when(boutiqueAccessService.richiediBoutiqueConServizioAttivo(
                1L,
                20L,
                1L,
                "DIPENDENTE",
                BoutiqueServizio.FATTURE
        )).thenReturn(boutique);
        when(utenteRepository.findById(10L)).thenReturn(Optional.of(admin));
        when(datiAziendaRepository.findByAdmin(admin)).thenReturn(Optional.of(dati));

        DatiAziendaResponse response = service.getDatiAccessibili(20L, 1L, "DIPENDENTE");

        assertThat(response.getRagioneSociale()).isEqualTo("RechargeNet Admin");
        assertThat(response.getMatriculeFiscale()).isEqualTo("1234567/A/M/000");
    }

    @Test
    void dipendenteSenzaFattureAbilitateNonLeggeIDatiAziendali() {
        when(boutiqueAccessService.richiediBoutiqueConServizioAttivo(
                2L,
                20L,
                2L,
                "DIPENDENTE",
                BoutiqueServizio.FATTURE
        )).thenThrow(new IllegalArgumentException("Le fatture non sono abilitate per questa boutique"));

        assertThatThrownBy(() -> service.getDatiAccessibili(20L, 2L, "DIPENDENTE"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fatture non sono abilitate");

        verify(datiAziendaRepository, never()).findByAdmin(any(Utente.class));
    }

    private Utente utente(Long id, Ruolo ruolo) {
        Utente utente = new Utente();
        utente.setId(id);
        utente.setRuolo(ruolo);
        return utente;
    }

    private Boutique boutique(Long id, Utente admin) {
        Boutique boutique = new Boutique();
        boutique.setId(id);
        boutique.setAdmin(admin);
        boutique.setAttiva(true);
        boutique.setFattureAbilitate(true);
        return boutique;
    }

    private DatiAzienda datiAzienda(Utente admin) {
        DatiAzienda dati = new DatiAzienda();
        dati.setAdmin(admin);
        dati.setRagioneSociale("RechargeNet Admin");
        dati.setIndirizzo("Rue de la Liberte, Tunis");
        dati.setMatriculeFiscale("1234567/A/M/000");
        dati.setLogo("base64");
        return dati;
    }
}
