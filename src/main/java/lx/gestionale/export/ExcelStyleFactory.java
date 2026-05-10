package lx.gestionale.export;

import lx.gestionale.ricarica.Operatore;
import org.apache.poi.ss.usermodel.*;

import java.util.Map;

/**
 * Classe responsabile esclusivamente della creazione degli stili POI.
 * Usa IndexedColors standard per massima compatibilità con qualsiasi versione di POI.
 */
public class ExcelStyleFactory {

    private final Workbook wb;

    public ExcelStyleFactory(Workbook wb) {
        this.wb = wb;
    }

    // ==========================================================
    // STILI PUBBLICI
    // ==========================================================

    public CellStyle creaStileHeader() {
        CellStyle stile = creaBase();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        stile.setFont(font);
        stile.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
        stile.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        stile.setAlignment(HorizontalAlignment.CENTER);
        stile.setVerticalAlignment(VerticalAlignment.CENTER);
        return stile;
    }

    public CellStyle creaStileRiga() {
        CellStyle stile = creaBase();
        stile.setAlignment(HorizontalAlignment.CENTER);
        return stile;
    }

    public CellStyle creaStileData() {
        CellStyle stile = creaBase();
        stile.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
        stile.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        stile.setAlignment(HorizontalAlignment.CENTER);
        return stile;
    }

    public CellStyle creaStileTotali() {
        CellStyle stile = creaBase();
        Font font = wb.createFont();
        font.setBold(true);
        stile.setFont(font);
        stile.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        stile.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        stile.setAlignment(HorizontalAlignment.CENTER);
        return stile;
    }

    public CellStyle creaStileTotaliLabel() {
        CellStyle stile = creaBase();
        Font font = wb.createFont();
        font.setBold(true);
        stile.setFont(font);
        stile.setAlignment(HorizontalAlignment.RIGHT);
        return stile;
    }

    public Map<Operatore, CellStyle> creaStiliOperatore() {
        return Map.of(
                Operatore.ooredoo, creaStileOperatore(IndexedColors.RED),
                Operatore.orange,  creaStileOperatore(IndexedColors.ORANGE),
                Operatore.telecom, creaStileOperatore(IndexedColors.ROYAL_BLUE),
                Operatore.fisso,   creaStileOperatore(IndexedColors.GREEN)
        );
    }

    // ==========================================================
    // METODI PRIVATI DI SUPPORTO
    // ==========================================================

    private CellStyle creaStileOperatore(IndexedColors colore) {
        CellStyle stile = creaBase();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(colore.getIndex());
        stile.setFont(font);
        stile.setAlignment(HorizontalAlignment.CENTER);
        return stile;
    }

    private CellStyle creaBase() {
        return wb.createCellStyle();
    }
}