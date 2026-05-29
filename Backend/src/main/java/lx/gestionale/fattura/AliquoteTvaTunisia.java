package lx.gestionale.fattura;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

public final class AliquoteTvaTunisia {

    private static final Set<BigDecimal> ALIQUOTE = Set.of(
            BigDecimal.ZERO,
            BigDecimal.valueOf(7),
            BigDecimal.valueOf(13),
            BigDecimal.valueOf(19)
    );

    public static final String VALORI_AMMESSI = "0, 7, 13, 19";

    private AliquoteTvaTunisia() {
    }

    public static boolean contiene(BigDecimal aliquota) {
        if (aliquota == null) {
            return true;
        }
        return ALIQUOTE.contains(normalizza(aliquota));
    }

    public static String valoriAmmessi() {
        return ALIQUOTE.stream()
                .sorted()
                .map(BigDecimal::toPlainString)
                .collect(Collectors.joining(", "));
    }

    private static BigDecimal normalizza(BigDecimal valore) {
        return valore.stripTrailingZeros();
    }
}
