package lx.gestionale.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DashboardAdminRiepilogo {
    private Long boutiqueId;
    private String boutiqueNome;
    private long totaleOperazioni;
    private BigDecimal profittoTotale;
}