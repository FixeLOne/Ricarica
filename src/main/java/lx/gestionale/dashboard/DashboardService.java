package lx.gestionale.dashboard;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.DashboardRiepilogo;
import lx.gestionale.ricarica.RicaricaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RicaricaRepository ricaricaRepository;

    public DashboardRiepilogo getRiepilogoOggi(Long boutiqueId) {
        LocalDate oggi = LocalDate.now();

        BigDecimal profitto = ricaricaRepository.sumProfittoByBoutiqueAndData(boutiqueId, oggi);
        long conteggio = ricaricaRepository.countRicaricheByBoutiqueAndData(boutiqueId, oggi);

        BigDecimal profittoSicuro = (profitto != null) ? profitto : BigDecimal.ZERO;

        return new DashboardRiepilogo(conteggio, profittoSicuro);
    }
}
