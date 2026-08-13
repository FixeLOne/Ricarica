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
     * Genera il prossimo numero della serie documentale (admin, anno, tipo).
     * MANDATORY: questo metodo deve essere chiamato all'interno di una transazione
     * già aperta (quella di FatturaService). Se viene invocato fuori transazione
     * Spring lancia IllegalTransactionStateException — comportamento voluto,
     * perché il contatore con lock pessimistico non ha senso fuori transazione.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public String generaNumero(Utente admin, TipoDocumento tipo) {
        int anno = LocalDate.now().getYear();

        // Il contatore dell'anno in corso esiste gia (inizializzaContatore lo
        // pre-crea alla nascita dell'admin) e la SELECT lo blocca in scrittura:
        // due emissioni contemporanee si serializzano. L'orElseGet copre il
        // primo documento dopo il cambio d'anno; li il vincolo di unicita fa da
        // rete, al costo di far fallire una delle due richieste in corsa.
        ContatoreFattura contatore = contatoreFatturaRepository.findByAdminAndAnnoAndTipo(admin, anno, tipo)
                .orElseGet(() -> creaContatore(admin, anno, tipo));
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
        for (TipoDocumento tipo : TipoDocumento.values()) {
            if (contatoreFatturaRepository.findByAdminAndAnnoAndTipo(admin, anno, tipo).isEmpty()) {
                creaContatore(admin, anno, tipo);
            }
        }
    }

    private ContatoreFattura creaContatore(Utente admin, int anno, TipoDocumento tipo) {
        ContatoreFattura nuovo = new ContatoreFattura();
        nuovo.setAdmin(admin);
        nuovo.setAnno(anno);
        nuovo.setTipo(tipo);
        return contatoreFatturaRepository.save(nuovo);
    }
}