package lx.gestionale.fattura.contatore;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.TipoDocumento;
import lx.gestionale.utente.Utente;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ContatoreFatturaService {

    private final ContatoreFatturaRepository contatoreFatturaRepository;

    /**
     * Genera il prossimo numero documento per l'admin e il tipo indicati.
     * MANDATORY: questo metodo deve essere chiamato all'interno di una transazione
     * già aperta (quella di FatturaService). Se viene invocato fuori transazione
     * Spring lancia IllegalTransactionStateException — comportamento voluto,
     * perché il contatore con lock pessimistico non ha senso fuori transazione.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public String generaNumero(Utente admin, TipoDocumento tipo) {
        int anno = LocalDate.now().getYear();

        ContatoreFattura contatore = contatoreFatturaRepository.findByAdminAndAnno(admin, anno)
                .orElseGet(() -> {
                    ContatoreFattura nuovo = new ContatoreFattura();
                    nuovo.setAdmin(admin);
                    nuovo.setAnno(anno);
                    return contatoreFatturaRepository.save(nuovo);
                });
        contatore.setUltimoNumero(contatore.getUltimoNumero() + 1);
        contatoreFatturaRepository.save(contatore);

        String prefisso = switch (tipo) {
            case FACTURE -> "FAC";
            case BON_DE_LIVRAISON -> "BL";
            case DEVIS -> "DEV";
            case AVOIR -> "AV";
        };

        return String.format("%s-%d-%04d", prefisso, anno, contatore.getUltimoNumero());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void inizializzaContatore(Utente admin) {
        int anno = LocalDate.now().getYear();
        if (contatoreFatturaRepository.findByAdminAndAnno(admin, anno).isEmpty()) {
            ContatoreFattura nuovo = new ContatoreFattura();
            nuovo.setAdmin(admin);
            nuovo.setAnno(anno);
            contatoreFatturaRepository.save(nuovo);
        }
    }
}