package lx.gestionale.export;

import lombok.RequiredArgsConstructor;
import lx.gestionale.export.dto.ExportFileResponse;
import lx.gestionale.eccezioni.ExportException;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.ricarica.Ricarica;
import lx.gestionale.ricarica.RicaricaService;
import lx.gestionale.utente.Utente;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final RicaricaService ricaricaService;

    private final BoutiqueRepository boutiqueRepository;

    private static final DateTimeFormatter FMT_DATA_ORA  = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter FMT_DATA_FILE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final long MAX_GIORNI_RANGE = 366;

    // ==========================================================
    // METODO PRINCIPALE CHIAMATO DAL CONTROLLER
    // ==========================================================


    public ExportFileResponse generaReport(LocalDate dal, LocalDate al, Long boutiqueId, Long utenteId) {
        validaRange(dal, al);

        List<Ricarica> ricariche;
        if (boutiqueId != null) {
            ricariche = ricaricaService.getRicaricheTra(boutiqueId, dal, al);
        } else {
            Utente admin = new Utente();
            admin.setId(utenteId);
            ricariche = boutiqueRepository.findByAdmin(admin).stream()
                    .flatMap(b -> ricaricaService.getRicaricheTra(b.getId(), dal, al).stream())
                    .collect(Collectors.toList());
        }

        String nomeFile = "Report_Recharges_" + dal.format(FMT_DATA_FILE) + "_" + al.format(FMT_DATA_FILE) + ".xlsx";
        try {
            ByteArrayInputStream stream = generaExcelRicariche(ricariche, dal, al);
            String disposition = ContentDisposition.attachment()
                    .filename(nomeFile)
                    .build().toString();
            return new ExportFileResponse(stream, disposition);
        } catch (IOException e) {
            throw new ExportException("Errore durante la creazione del file Excel", e);
        }
    }

    // ==========================================================
    // VALIDAZIONE
    // ==========================================================

    private void validaRange(LocalDate dal, LocalDate al) {
        if (dal.isAfter(al)) {
            throw new IllegalArgumentException("'dal' non può essere successivo ad 'al'");
        }
        if (al.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("'al' non può essere una data futura");
        }
        if (ChronoUnit.DAYS.between(dal, al) > MAX_GIORNI_RANGE) {
            throw new IllegalArgumentException("Il range massimo consentito è " + MAX_GIORNI_RANGE + " giorni");
        }
    }

    // ==========================================================
    // COSTRUZIONE WORKBOOK
    // ==========================================================

    private ByteArrayInputStream generaExcelRicariche(List<Ricarica> ricariche, LocalDate dal, LocalDate al) throws IOException {

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ExcelStyleFactory stili = new ExcelStyleFactory(workbook);
            String nomeSheet = dal.equals(al)
                    ? "Report " + dal.format(FMT_DATA_FILE)
                    : "Report " + dal.format(FMT_DATA_FILE) + " - " + al.format(FMT_DATA_FILE);
            Sheet sheet = workbook.createSheet(nomeSheet);

            scriviIntestazioni(sheet, stili);
            int ultimaRiga = scriviDati(sheet, ricariche, stili);
            scriviTotali(sheet, ultimaRiga, ricariche, stili);

            impostaLarghezzeColonne(sheet);
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // ==========================================================
    // INTESTAZIONI
    // ==========================================================

    private void scriviIntestazioni(Sheet sheet, ExcelStyleFactory stili) {
        String[] colonne = {"Date et Heure", "Numéro", "Opérateur", "Gigas", "Dépense Magasin", "Payé par Client", "Bénéfice Net"};
        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(22);
        CellStyle stileHeader = stili.creaStileHeader();
        for (int i = 0; i < colonne.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(colonne[i]);
            cell.setCellStyle(stileHeader);
        }
    }

    // ==========================================================
    // RIGHE DATI
    // ==========================================================

    private int scriviDati(Sheet sheet, List<Ricarica> ricariche, ExcelStyleFactory stili) {
        CellStyle stileRiga = stili.creaStileRiga();
        CellStyle stileData = stili.creaStileData();
        Map<Operatore, CellStyle> stiliOp = stili.creaStiliOperatore();

        int rigaIdx = 1;
        for (Ricarica r : ricariche) {
            scriviSingolaRicarica(sheet.createRow(rigaIdx++), r, stileRiga, stileData, stiliOp);
        }
        return rigaIdx;
    }

    private void scriviSingolaRicarica(Row row, Ricarica r,
                                       CellStyle stileRiga, CellStyle stileData,
                                       Map<Operatore, CellStyle> stiliOp) {
        Cell cOra = row.createCell(0);
        cOra.setCellValue(r.getDataOra() != null ? r.getDataOra().format(FMT_DATA_ORA) : "N/D");
        cOra.setCellStyle(stileData);

        Cell cNum = row.createCell(1);
        cNum.setCellValue(sanificaTesto(r.getNumero()));
        cNum.setCellStyle(stileRiga);

        Cell cOp = row.createCell(2);
        cOp.setCellValue(r.getOperatore() != null ? r.getOperatore().toString() : "N/D");
        cOp.setCellStyle(stiliOp.getOrDefault(r.getOperatore(), stileRiga));

        Cell cGiga = row.createCell(3);
        cGiga.setCellValue(r.getGiga() + " Go");
        cGiga.setCellStyle(stileRiga);

        scriviCellaDT(row, 4, r.getCostoEffettivo(), stileRiga);
        scriviCellaDT(row, 5, r.getCostoCliente(),   stileRiga);
        scriviCellaDT(row, 6, r.getProfitto(),        stileRiga);
    }

    // ==========================================================
    // RIGA TOTALI
    // ==========================================================

    private void scriviTotali(Sheet sheet, int rowIdx, List<Ricarica> ricariche, ExcelStyleFactory stili) {
        Row rigaTot = sheet.createRow(rowIdx + 1);
        rigaTot.setHeightInPoints(20);

        CellStyle stileTot      = stili.creaStileTotali();
        CellStyle stileTotLabel = stili.creaStileTotaliLabel();

        Cell label = rigaTot.createCell(2);
        label.setCellValue("TOTAL: " + ricariche.size() + " recharges");
        label.setCellStyle(stileTotLabel);

        Cell cGigaTot = rigaTot.createCell(3);
        cGigaTot.setCellValue(calcolaTotaleGiga(ricariche) + " Go");
        cGigaTot.setCellStyle(stileTot);

        scriviCellaDT(rigaTot, 4, calcolaTotaleCosto(ricariche),    stileTot);
        scriviCellaDT(rigaTot, 5, calcolaTotaleVendita(ricariche),  stileTot);
        scriviCellaDT(rigaTot, 6, calcolaTotaleProfitto(ricariche), stileTot);
    }

    // ==========================================================
    // LAYOUT
    // ==========================================================

    private void impostaLarghezzeColonne(Sheet sheet) {
        int[] larghezze = {5800, 4000, 4500, 4000, 5500, 5500, 5000};
        for (int i = 0; i < larghezze.length; i++) {
            sheet.setColumnWidth(i, larghezze[i]);
        }
    }

    // ==========================================================
    // CALCOLI
    // ==========================================================

    private double calcolaTotaleGiga(List<Ricarica> ricariche) {
        return ricariche.stream()
                .mapToDouble(Ricarica::getGiga)
                .sum();
    }

    private BigDecimal calcolaTotaleCosto(List<Ricarica> ricariche) {
        return ricariche.stream()
                .map(r -> getValoreSicuro(r.getCostoEffettivo()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcolaTotaleVendita(List<Ricarica> ricariche) {
        return ricariche.stream()
                .map(r -> getValoreSicuro(r.getCostoCliente()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcolaTotaleProfitto(List<Ricarica> ricariche) {
        return ricariche.stream()
                .map(r -> getValoreSicuro(r.getProfitto()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ==========================================================
    // UTILITY
    // ==========================================================

    private void scriviCellaDT(Row row, int col, BigDecimal valore, CellStyle stile) {
        Cell cell = row.createCell(col);
        cell.setCellValue(getValoreSicuro(valore).setScale(2, RoundingMode.HALF_UP).toPlainString() + " DT");
        cell.setCellStyle(stile);
    }

    private BigDecimal getValoreSicuro(BigDecimal valore) {
        return Objects.requireNonNullElse(valore, BigDecimal.ZERO);
    }

    private String sanificaTesto(String testo) {
        if (testo == null || testo.isBlank()) return "";
        return testo.matches("^[=+\\-@].*") ? "'" + testo : testo;
    }
}