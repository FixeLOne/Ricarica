package lx.gestionale.dashboard;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dashboard.dto.DashboardRiepilogo;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.RicaricaRepository;
import lx.gestionale.utente.Utente;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RicaricaRepository ricaricaRepository;

    private final BoutiqueRepository boutiqueRepository;

    public List<DashboardAdminRiepilogo> getRiepilogoAdmin(Long adminId) {
        LocalDate oggi = LocalDate.now();
        Utente admin = new Utente();
        admin.setId(adminId);

        return boutiqueRepository.findByAdmin(admin).stream()
                .map(b -> {
                    BigDecimal profitto = ricaricaRepository.sumProfittoByBoutiqueAndData(b.getId(), oggi);
                    long conteggio = ricaricaRepository.countRicaricheByBoutiqueAndData(b.getId(), oggi);
                    return new DashboardAdminRiepilogo(
                            b.getId(),
                            b.getNome(),
                            conteggio,
                            profitto != null ? profitto : BigDecimal.ZERO
                    );
                })
                .collect(Collectors.toList());
    }

    public DashboardRiepilogo getRiepilogoOggi(Long boutiqueId) {
        LocalDate oggi = LocalDate.now();

        BigDecimal profitto = ricaricaRepository.sumProfittoByBoutiqueAndData(boutiqueId, oggi);
        long conteggio = ricaricaRepository.countRicaricheByBoutiqueAndData(boutiqueId, oggi);

        BigDecimal profittoSicuro = (profitto != null) ? profitto : BigDecimal.ZERO;

        return new DashboardRiepilogo(conteggio, profittoSicuro);
    }
}
