package com.handmade.store.service.impl;

import com.handmade.store.dto.analytics.AnalyticsResponse;
import com.handmade.store.dto.analytics.RevenueTrendPoint;
import com.handmade.store.dto.analytics.TopProductResponse;
import com.handmade.store.dto.order.AdminOrderResponse;
import com.handmade.store.dto.order.OrderItemResponse;
import com.handmade.store.dto.payment.PaymentAdminResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.enums.Role;
import com.handmade.store.entity.Payment;
import com.handmade.store.entity.RazorpayPayment;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.RazorpayPaymentRepository;
import com.handmade.store.service.AnalyticsService;
import com.handmade.store.service.OrderService;
import com.handmade.store.service.PaymentService;
import com.handmade.store.service.ProductService;
import com.handmade.store.service.ReportService;
import com.handmade.store.service.UserService;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final String CSV_EXT = "csv";
    private static final String EXCEL_EXT = "excel";

    private final OrderService orderService;
    private final ProductService productService;
    private final UserService userService;
    private final PaymentService paymentService;
    private final AnalyticsService analyticsService;
    private final PaymentRepository paymentRepository;
    private final RazorpayPaymentRepository razorpayPaymentRepository;

    public ReportServiceImpl(OrderService orderService,
                             ProductService productService,
                             UserService userService,
                             PaymentService paymentService,
                             AnalyticsService analyticsService,
                             PaymentRepository paymentRepository,
                             RazorpayPaymentRepository razorpayPaymentRepository) {
        this.orderService = orderService;
        this.productService = productService;
        this.userService = userService;
        this.paymentService = paymentService;
        this.analyticsService = analyticsService;
        this.paymentRepository = paymentRepository;
        this.razorpayPaymentRepository = razorpayPaymentRepository;
    }

    @Override
    public byte[] exportOrdersReport(String format, String keyword, OrderStatus status,
                                     LocalDate from, LocalDate to) {
        List<AdminOrderResponse> orders = orderService.getAllOrdersFiltered(keyword, status, 0, 100000)
                .getContent().stream()
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> from == null || !o.getCreatedAt().toLocalDate().isBefore(from))
                .filter(o -> to == null || !o.getCreatedAt().toLocalDate().isAfter(to))
                .collect(Collectors.toList());

        Map<Long, String> transactionIds = loadTransactionIds(orders);

        String[] headers = {"Order ID", "Date", "Customer", "Email", "Phone", "Items",
                "Item Details", "Subtotal", "Discount", "Shipping", "GST (18%)", "Total",
                "Order Status", "Payment Status", "Payment Method", "Transaction ID",
                "Tracking", "Shipping Address"};
        List<List<String>> rows = orders.stream().map(o -> {
            BigDecimal subtotal = orderSubtotal(o);
            BigDecimal total = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal discount = subtotal.compareTo(total) > 0 ? subtotal.subtract(total) : BigDecimal.ZERO;
            BigDecimal gst = gstAmount(subtotal.subtract(discount));

            return List.of(
                    String.valueOf(o.getId()),
                    dt(o.getCreatedAt()),
                    fullName(o.getUser() != null ? o.getUser().getFirstName() : "", o.getUser() != null ? o.getUser().getLastName() : ""),
                    o.getUser() != null ? safe(o.getUser().getEmail()) : "",
                    o.getUser() != null ? safe(o.getUser().getPhone()) : "",
                    String.valueOf(o.getItems() == null ? 0 : o.getItems().size()),
                    itemDetails(o),
                    money(subtotal),
                    discount.compareTo(BigDecimal.ZERO) > 0 ? money(discount) : "0.00",
                    "0.00",
                    money(gst),
                    money(total),
                    o.getOrderStatus() != null ? o.getOrderStatus().name() : "",
                    o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "",
                    o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "",
                    resolveTransactionId(o.getId(), transactionIds),
                    safe(o.getTrackingNumber()),
                    safe(o.getShippingAddress()));
        }).collect(Collectors.toList());

        return generate(format, "Orders Report", headers, rows);
    }

    @Override
    public byte[] exportProductsReport(String format, String keyword, ProductStatus status,
                                       boolean lowStockOnly) {
        List<ProductResponse> products = productService.getInventory(keyword, status, lowStockOnly,
                PageRequest.of(0, 100000)).getContent();

        String[] headers = {"Product ID", "Name", "SKU", "Category", "Price", "Discount Price",
                "Stock", "Status", "Featured", "Rating"};
        List<List<String>> rows = products.stream().map(p -> List.of(
                String.valueOf(p.getId()),
                safe(p.getName()),
                safe(p.getSku()),
                p.getCategory() != null ? safe(p.getCategory().getName()) : "",
                money(p.getPrice()),
                money(p.getDiscountPrice()),
                String.valueOf(p.getStockQuantity()),
                p.getStatus() != null ? p.getStatus().name() : "",
                Boolean.TRUE.equals(p.getIsFeatured()) ? "Yes" : "No",
                p.getRating() != null ? String.valueOf(p.getRating()) : ""))
                .collect(Collectors.toList());

        return generate(format, "Products Report", headers, rows);
    }

    @Override
    public byte[] exportUsersReport(String format, String keyword, Role role) {
        List<UserResponse> users = userService.searchUsers(keyword, 0, 100000).getContent().stream()
                .filter(u -> role == null || u.getRole() == role)
                .collect(Collectors.toList());

        String[] headers = {"User ID", "First Name", "Last Name", "Email", "Phone", "Role",
                "Enabled", "Joined"};
        List<List<String>> rows = users.stream().map(u -> List.of(
                String.valueOf(u.getId()),
                safe(u.getFirstName()),
                safe(u.getLastName()),
                safe(u.getEmail()),
                safe(u.getPhone()),
                u.getRole() != null ? u.getRole().name() : "",
                u.isEnabled() ? "Yes" : "No",
                dt(u.getCreatedAt())))
                .collect(Collectors.toList());

        return generate(format, "Users Report", headers, rows);
    }

    @Override
    public byte[] exportPaymentsReport(String format, PaymentStatus status,
                                       LocalDate from, LocalDate to) {
        List<PaymentAdminResponse> payments = paymentService.getAllPayments(0, 100000, status)
                .getContent().stream()
                .filter(p -> p.getCreatedAt() != null)
                .filter(p -> from == null || !p.getCreatedAt().toLocalDate().isBefore(from))
                .filter(p -> to == null || !p.getCreatedAt().toLocalDate().isAfter(to))
                .collect(Collectors.toList());

        String[] headers = {"Payment ID", "Order ID", "Customer", "Email", "Amount", "Method",
                "Status", "Transaction ID", "Session ID", "Date"};
        List<List<String>> rows = payments.stream().map(p -> List.of(
                String.valueOf(p.getId()),
                p.getOrderId() != null ? String.valueOf(p.getOrderId()) : "",
                fullName(p.getUser() != null ? p.getUser().getFirstName() : "", p.getUser() != null ? p.getUser().getLastName() : ""),
                p.getUser() != null ? safe(p.getUser().getEmail()) : "",
                money(p.getAmount()),
                p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "",
                p.getPaymentStatus() != null ? p.getPaymentStatus().name() : "",
                resolveTransactionId(p.getOrderId()),
                safe(p.getStripeSessionId()),
                dt(p.getCreatedAt())))
                .collect(Collectors.toList());

        return generate(format, "Payments Report", headers, rows);
    }

    @Override
    public byte[] exportAnalyticsReport(String format, LocalDate from, LocalDate to) {
        AnalyticsResponse analytics = analyticsService.getAnalytics(from, to, 10);

        String[] summaryHeaders = {"Metric", "Value"};
        List<List<String>> summaryRows = new ArrayList<>();
        summaryRows.add(List.of("Total Revenue", money(analytics.getSummary().getTotalRevenue())));
        summaryRows.add(List.of("Total Orders", String.valueOf(analytics.getSummary().getTotalOrders())));
        summaryRows.add(List.of("Total Customers", String.valueOf(analytics.getSummary().getTotalCustomers())));
        summaryRows.add(List.of("Total Sellers", String.valueOf(analytics.getSummary().getTotalSellers())));
        summaryRows.add(List.of("Total Products", String.valueOf(analytics.getSummary().getTotalProducts())));
        summaryRows.add(List.of("Today Revenue", money(analytics.getSummary().getTodayRevenue())));
        summaryRows.add(List.of("This Week Revenue", money(analytics.getSummary().getThisWeekRevenue())));
        summaryRows.add(List.of("This Month Revenue", money(analytics.getSummary().getThisMonthRevenue())));
        summaryRows.add(List.of("This Year Revenue", money(analytics.getSummary().getThisYearRevenue())));
        summaryRows.add(List.of("Average Order Value", money(analytics.getSummary().getAverageOrderValue())));

        List<List<String>> allRows = new ArrayList<>(summaryRows);
        String[] headers = concat(summaryHeaders, new String[]{"Label", "Revenue", "Orders"});

        if (CSV_EXT.equals(format)) {
            StringBuilder csv = new StringBuilder();
            csv.append("Handmade Store Analytics Report\n\n");
            csv.append(toCsv(List.of(summaryHeaders), summaryRows));
            csv.append("\nTop Products\n");
            csv.append(toCsv(List.of("Product", "Category", "Units Sold", "Revenue"),
                    analytics.getTopProducts().stream()
                            .map(tp -> List.of(safe(tp.getName()), safe(tp.getCategoryName()),
                                    String.valueOf(tp.getTotalQuantitySold()), money(tp.getRevenue())))
                            .collect(Collectors.toList())));
            csv.append("\nDaily Revenue (Last 10 Days)\n");
            csv.append(toCsv(List.of("Date", "Revenue", "Orders"),
                    analytics.getDailyRevenue().stream()
                            .skip(Math.max(0, analytics.getDailyRevenue().size() - 10))
                            .map(rt -> List.of(safe(rt.getLabel()), money(rt.getRevenue()), String.valueOf(rt.getOrders())))
                            .collect(Collectors.toList())));
            csv.append("\nMonthly Revenue\n");
            csv.append(toCsv(List.of("Month", "Revenue", "Orders"),
                    analytics.getMonthlyRevenue().stream()
                            .map(rt -> List.of(safe(rt.getLabel()), money(rt.getRevenue()), String.valueOf(rt.getOrders())))
                            .collect(Collectors.toList())));
            csv.append("\nYearly Revenue\n");
            csv.append(toCsv(List.of("Year", "Revenue", "Orders"),
                    analytics.getYearlyRevenue().stream()
                            .map(rt -> List.of(safe(rt.getLabel()), money(rt.getRevenue()), String.valueOf(rt.getOrders())))
                            .collect(Collectors.toList())));
            return csv.toString().getBytes(StandardCharsets.UTF_8);
        }

        String[] productHeaders = {"Top Product", "Category", "Units Sold", "Revenue"};
        List<List<String>> productRows = analytics.getTopProducts().stream()
                .map(tp -> List.of(safe(tp.getName()), safe(tp.getCategoryName()),
                        String.valueOf(tp.getTotalQuantitySold()), money(tp.getRevenue())))
                .collect(Collectors.toList());

        List<RevenueTrendPoint> monthly = analytics.getMonthlyRevenue();

        if (EXCEL_EXT.equals(format)) {
            try (XSSFWorkbook workbook = new XSSFWorkbook()) {
                Sheet summarySheet = workbook.createSheet("Summary");
                writeExcelSection(workbook, summarySheet, "Handmade Store Analytics Report",
                        summaryHeaders, summaryRows, 0);
                writeExcelSection(workbook, workbook.createSheet("Top Products"),
                        "Top Products", productHeaders, productRows, 0);
                writeExcelSection(workbook, workbook.createSheet("Monthly Revenue"),
                        "Monthly Revenue",
                        new String[]{"Month", "Revenue", "Orders"},
                        monthly.stream()
                                .map(rt -> List.of(safe(rt.getLabel()), money(rt.getRevenue()), String.valueOf(rt.getOrders())))
                                .collect(Collectors.toList()),
                        0);
                return toBytes(workbook);
            } catch (Exception e) {
                throw new RuntimeException("Failed to generate Excel report", e);
            }
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Handmade Store Analytics Report", FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(""));
            document.add(buildPdfTable(summaryHeaders, summaryRows));
            document.add(new Paragraph(""));
            document.add(new Paragraph("Top Products", FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 14)));
            document.add(buildPdfTable(productHeaders, productRows));
            document.add(new Paragraph(""));
            document.add(new Paragraph("Monthly Revenue", FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 14)));
            document.add(buildPdfTable(new String[]{"Month", "Revenue", "Orders"},
                    monthly.stream()
                            .map(rt -> List.of(safe(rt.getLabel()), money(rt.getRevenue()), String.valueOf(rt.getOrders())))
                            .collect(Collectors.toList())));
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private byte[] generate(String format, String title, String[] headers, List<List<String>> rows) {
        if (CSV_EXT.equals(format)) {
            return toCsv(List.of(headers), rows).getBytes(StandardCharsets.UTF_8);
        }

        if (EXCEL_EXT.equals(format)) {
            try (XSSFWorkbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet(title);
                writeExcelSection(workbook, sheet, title, headers, rows, 0);
                return toBytes(workbook);
            } catch (Exception e) {
                throw new RuntimeException("Failed to generate Excel report", e);
            }
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph(title, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(""));
            document.add(buildPdfTable(headers, rows));
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private void writeExcelSection(XSSFWorkbook workbook, Sheet sheet, String title,
                                   String[] headers, List<List<String>> rows, int startRow) {
        CellStyle titleStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        titleStyle.setFont(titleFont);

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.TEAL.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);

        Row titleRow = sheet.createRow(startRow);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(titleStyle);

        int headerRowIndex = startRow + 1;
        Row headerRow = sheet.createRow(headerRowIndex);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int dataRow = headerRowIndex + 1;
        for (List<String> rowData : rows) {
            Row row = sheet.createRow(dataRow++);
            for (int i = 0; i < headers.length && i < rowData.size(); i++) {
                row.createCell(i).setCellValue(rowData.get(i));
            }
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private PdfPTable buildPdfTable(String[] headers, List<List<String>> rows) {
        PdfPTable table = new PdfPTable(headers.length);
        table.setWidthPercentage(100);

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.addCell(cell);
        }

        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (List<String> rowData : rows) {
            for (int i = 0; i < headers.length; i++) {
                String value = i < rowData.size() ? rowData.get(i) : "";
                table.addCell(new PdfPCell(new Phrase(value, bodyFont)));
            }
        }
        return table;
    }

    private String toCsv(List<String> headers, List<List<String>> rows) {
        StringBuilder csv = new StringBuilder();
        csv.append(headers.stream().map(this::csvEscape).collect(Collectors.joining(",")));
        csv.append("\n");
        for (List<String> row : rows) {
            csv.append(row.stream().map(this::csvEscape).collect(Collectors.joining(",")));
            csv.append("\n");
        }
        return csv.toString();
    }

    private String csvEscape(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private byte[] toBytes(XSSFWorkbook workbook) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Excel workbook", e);
        }
    }

    private String[] concat(String[] first, String[] second) {
        String[] result = new String[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String fullName(String first, String last) {
        return (safe(first) + " " + safe(last)).trim();
    }

    private String money(BigDecimal value) {
        return value == null ? "" : value.toPlainString();
    }

    private String dt(LocalDateTime value) {
        return value == null ? "" : value.format(DATE_TIME);
    }

    private BigDecimal orderSubtotal(AdminOrderResponse order) {
        if (order.getItems() == null) {
            return BigDecimal.ZERO;
        }
        return order.getItems().stream()
                .map(OrderItemResponse::getPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String itemDetails(AdminOrderResponse order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return "";
        }
        return order.getItems().stream()
                .map(it -> {
                    String name = it.getProduct() != null ? it.getProduct().getName() : "Item";
                    String sku = it.getProduct() != null ? it.getProduct().getSku() : null;
                    String label = sku != null && !sku.isBlank() ? name + " (" + sku + ")" : name;
                    return label + " x" + it.getQuantity();
                })
                .collect(Collectors.joining("; "));
    }

    private BigDecimal gstAmount(BigDecimal payable) {
        return payable == null
                ? BigDecimal.ZERO
                : payable.multiply(new BigDecimal("18"))
                        .divide(new BigDecimal("118"), 2, RoundingMode.HALF_UP);
    }

    private Map<Long, String> loadTransactionIds(List<AdminOrderResponse> orders) {
        List<Long> orderIds = orders.stream()
                .map(AdminOrderResponse::getId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        if (orderIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }

        Map<Long, String> stripeByOrder = paymentRepository.findAllByOrderIdIn(orderIds).stream()
                .collect(Collectors.toMap(
                        p -> p.getOrder().getId(),
                        p -> p.getStripePaymentId(),
                        (a, b) -> a != null && !a.isBlank() ? a : b));

        Map<Long, String> razorpayByOrder = razorpayPaymentRepository.findAllByOrderIdIn(orderIds).stream()
                .filter(p -> p.getRazorpayPaymentId() != null && !p.getRazorpayPaymentId().isBlank())
                .collect(Collectors.toMap(
                        p -> p.getOrder().getId(),
                        RazorpayPayment::getRazorpayPaymentId,
                        (a, b) -> a));

        Map<Long, String> result = new HashMap<>();
        for (Long orderId : orderIds) {
            String stripeTxn = stripeByOrder.get(orderId);
            if (stripeTxn != null && !stripeTxn.isBlank()) {
                result.put(orderId, stripeTxn);
            } else {
                result.put(orderId, razorpayByOrder.getOrDefault(orderId, ""));
            }
        }
        return result;
    }

    private String resolveTransactionId(Long orderId) {
        if (orderId == null) {
            return "";
        }
        return resolveTransactionId(orderId, loadTransactionIds(
                java.util.List.of(AdminOrderResponse.builder().id(orderId).build())));
    }

    private String resolveTransactionId(Long orderId, Map<Long, String> transactionIds) {
        if (orderId == null) {
            return "";
        }
        return transactionIds.getOrDefault(orderId, "");
    }
}
