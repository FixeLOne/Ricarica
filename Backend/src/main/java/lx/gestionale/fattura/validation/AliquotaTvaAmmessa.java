package lx.gestionale.fattura.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = AliquotaTvaAmmessaValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface AliquotaTvaAmmessa {

    String message() default "Aliquota TVA non ammessa. Valori consentiti: 0, 7, 13, 19";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
