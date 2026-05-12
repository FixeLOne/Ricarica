package lx.gestionale.dashboard;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.DashboardRiepilogo;
import lx.gestionale.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v2/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/riepilogo")
    public DashboardRiepilogo getRiepilogoOggi(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.getRiepilogoOggi(principal.getBoutiqueId());
    }

    @GetMapping("/admin")
    public ResponseEntity<List<DashboardAdminRiepilogo>> getRiepilogoAdmin(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getRiepilogoAdmin(principal.getUtenteId()));
    }
}
