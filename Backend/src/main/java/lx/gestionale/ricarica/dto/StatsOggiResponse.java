package lx.gestionale.ricarica.dto;

import java.util.Map;

public record StatsOggiResponse(
        long countOggi,
        long countIeri,
        double gbTotali,
        Map<String, Long> perOperatore
) {}
