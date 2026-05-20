package lx.gestionale.dashboard;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dashboard.dto.DashboardRiepilogo;
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

    /**
     * DIPENDENTE  → riepilogo della propria boutique (boutiqueId dal token)
     * ADMIN       → riepilogo aggregato di tutte le sue boutique
     * SUPER_ADMIN → aggrega tutte le boutique del sistema
     */
    @GetMapping("/riepilogo")
    public ResponseEntity<?> getRiepilogo(@AuthenticationPrincipal UserPrincipal principal) {
        if ("DIPENDENTE".equals(principal.getRuolo())) {
            DashboardRiepilogo riepilogo = dashboardService.getRiepilogoOggi(principal.getBoutiqueId());
            return ResponseEntity.ok(riepilogo);
        }
        List<DashboardAdminRiepilogo> riepilogo = dashboardService.getRiepilogoAdmin(principal.getUtenteId(), principal.getRuolo());
        return ResponseEntity.ok(riepilogo);
    }
}