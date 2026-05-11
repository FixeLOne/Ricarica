package lx.gestionale.export;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.ExportFileResponse;
import lx.gestionale.security.UserPrincipal;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v2/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    private static final String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @GetMapping("/ricariche")
    public ResponseEntity<Resource> downloadExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate al,
            @AuthenticationPrincipal UserPrincipal principal) { // <-- 1. CATTURIAMO L'UTENTE

        // 2. PASSIAMO L'ID DELLA BOUTIQUE AL SERVICE
        ExportFileResponse report = exportService.generaReport(dal, al, principal.getBoutiqueId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, report.contentDisposition())
                .contentType(MediaType.parseMediaType(EXCEL_TYPE))
                .body(new InputStreamResource(report.stream()));
    }
}