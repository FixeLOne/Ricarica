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

    public DashboardRiepilogo getRiepilogoOggi() {
        LocalDate oggi = LocalDate.now();

        // Recuperiamo i dati dal DB
        BigDecimal profitto = ricaricaRepository.sumProfittoByData(oggi);
        long conteggio = ricaricaRepository.countRicaricheByData(oggi);

        // Gestiamo il caso in cui non ci siano ricariche (SUM restituisce null)
        BigDecimal profittoSicuro = (profitto != null) ? profitto : BigDecimal.ZERO;

        return new DashboardRiepilogo(conteggio, profittoSicuro);
    }
}
