package lx.gestionale.dto;

import java.io.ByteArrayInputStream;

public record ExportFileResponse(ByteArrayInputStream stream, String contentDisposition) {
}
