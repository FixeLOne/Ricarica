package lx.gestionale.fattura.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lx.gestionale.fattura.AliquoteTvaTunisia;

import java.math.BigDecimal;

public class AliquotaTvaAmmessaValidator implements ConstraintValidator<AliquotaTvaAmmessa, BigDecimal> {

    @Override
    public boolean isValid(BigDecimal value, ConstraintValidatorContext context) {
        return AliquoteTvaTunisia.contiene(value);
    }
}
