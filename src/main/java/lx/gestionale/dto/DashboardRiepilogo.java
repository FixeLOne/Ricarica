package lx.gestionale.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DashboardRiepilogo {
    private long totaleOperazioni;
    private BigDecimal profittoTotale;

}