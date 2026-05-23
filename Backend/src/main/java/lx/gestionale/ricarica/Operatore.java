package lx.gestionale.ricarica;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Operatore {
    ooredoo,
    orange,
    telecom,
    fisso;

    @JsonValue
    public String toJson() {
        return this.name().toUpperCase();
    }
}
