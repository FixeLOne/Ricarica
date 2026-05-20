package lx.gestionale.dashboard;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dashboard.dto.DashboardRiepilogo;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.RicaricaRepository;
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

    public List<DashboardAdminRiepilogo> getRiepilogoAdmin(Long adminId, String ruolo) {
        LocalDate oggi = LocalDate.now();
        return resolveBoutiques(adminId, ruolo).stream()
                .map(b -> costruisciRiepilogo(b, oggi))
                .collect(Collectors.toList());
    }

    private List<Boutique> resolveBoutiques(Long adminId, String ruolo) {
        return "SUPER_ADMIN".equals(ruolo)
                ? boutiqueRepository.findAll()
                : boutiqueRepository.findByAdminId(adminId);
    }

    private DashboardAdminRiepilogo costruisciRiepilogo(Boutique b, LocalDate data) {
        BigDecimal profitto = ricaricaRepository.sumProfittoByBoutiqueAndData(b.getId(), data);
        long conteggio = ricaricaRepository.countRicaricheByBoutiqueAndData(b.getId(), data);
        return new DashboardAdminRiepilogo(b.getId(), b.getNome(), conteggio,
                profitto != null ? profitto : BigDecimal.ZERO);
    }
    public DashboardRiepilogo getRiepilogoOggi(Long boutiqueId) {
        LocalDate oggi = LocalDate.now();

        BigDecimal profitto = ricaricaRepository.sumProfittoByBoutiqueAndData(boutiqueId, oggi);
        long conteggio = ricaricaRepository.countRicaricheByBoutiqueAndData(boutiqueId, oggi);

        BigDecimal profittoSicuro = (profitto != null) ? profitto : BigDecimal.ZERO;

        return new DashboardRiepilogo(conteggio, profittoSicuro);
    }
}
