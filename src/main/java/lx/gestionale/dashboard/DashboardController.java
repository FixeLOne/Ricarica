package lx.gestionale.dashboard;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.DashboardRiepilogo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/riepilogo")
    public DashboardRiepilogo getRiepilogoOggi() {
        return dashboardService.getRiepilogoOggi();
    }
}
