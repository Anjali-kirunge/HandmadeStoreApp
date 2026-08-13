package com.handmade.store.controller;

import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.enums.Role;
import com.handmade.store.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/orders")
    public ResponseEntity<byte[]> exportOrdersReport(
            @RequestParam String format,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return buildResponse("orders", format,
                reportService.exportOrdersReport(format, keyword, status, from, to));
    }

    @GetMapping("/products")
    public ResponseEntity<byte[]> exportProductsReport(
            @RequestParam String format,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(defaultValue = "false") boolean lowStockOnly) {
        return buildResponse("products", format,
                reportService.exportProductsReport(format, keyword, status, lowStockOnly));
    }

    @GetMapping("/users")
    public ResponseEntity<byte[]> exportUsersReport(
            @RequestParam String format,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role role) {
        return buildResponse("users", format,
                reportService.exportUsersReport(format, keyword, role));
    }

    @GetMapping("/payments")
    public ResponseEntity<byte[]> exportPaymentsReport(
            @RequestParam String format,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return buildResponse("payments", format,
                reportService.exportPaymentsReport(format, status, from, to));
    }

    @GetMapping("/analytics")
    public ResponseEntity<byte[]> exportAnalyticsReport(
            @RequestParam String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return buildResponse("analytics", format,
                reportService.exportAnalyticsReport(format, from, to));
    }

    private ResponseEntity<byte[]> buildResponse(String type, String format, byte[] data) {
        String ext;
        MediaType mediaType;
        if ("csv".equalsIgnoreCase(format)) {
            ext = "csv";
            mediaType = new MediaType("text", "csv");
        } else if ("excel".equalsIgnoreCase(format)) {
            ext = "xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            ext = "pdf";
            mediaType = MediaType.APPLICATION_PDF;
        }

        String filename = "handmade-" + type + "-report." + ext;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(data);
    }
}
