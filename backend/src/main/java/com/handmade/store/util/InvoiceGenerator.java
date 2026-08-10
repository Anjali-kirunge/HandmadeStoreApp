package com.handmade.store.util;

import com.handmade.store.entity.Order;
import com.handmade.store.entity.OrderItem;
import com.handmade.store.entity.User;
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
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
public class InvoiceGenerator {

    private static final String LINE_SEPARATOR = "================================================================";
    private static final String DASHED_LINE = "----------------------------------------------------------------";
    private static final BigDecimal GST_RATE = new BigDecimal("18");
    private static final BigDecimal GST_INCLUSIVE_DIVISOR = new BigDecimal("118");

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final java.awt.Color BRAND = new java.awt.Color(15, 118, 110);
    private static final java.awt.Color ACCENT = new java.awt.Color(217, 119, 6);
    private static final java.awt.Color MUTED = new java.awt.Color(110, 120, 125);

    public static class InvoiceItem {
        private final String productName;
        private final String sku;
        private final int quantity;
        private final BigDecimal unitPrice;
        private final BigDecimal lineTotal;

        public InvoiceItem(String productName, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
            this(productName, null, quantity, unitPrice, lineTotal);
        }

        public InvoiceItem(String productName, String sku, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
            this.productName = productName;
            this.sku = sku;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.lineTotal = lineTotal;
        }

        public String getProductName() { return productName; }
        public String getSku() { return sku; }
        public int getQuantity() { return quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public BigDecimal getLineTotal() { return lineTotal; }
    }

    public String generateInvoiceText(Long orderId,
                                       String customerName,
                                       String customerEmail,
                                       List<InvoiceItem> items,
                                       BigDecimal subtotal,
                                       BigDecimal shipping,
                                       BigDecimal discount,
                                       BigDecimal total,
                                       String paymentMethod,
                                       String paymentStatus) {
        StringBuilder sb = new StringBuilder();
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        sb.append(LINE_SEPARATOR).append("\n");
        sb.append("                     HANDMADE STORE").append("\n");
        sb.append("                   INVOICE / RECEIPT").append("\n");
        sb.append(LINE_SEPARATOR).append("\n\n");

        sb.append("  Invoice Date   : ").append(now).append("\n");
        sb.append("  Order ID       : #").append(orderId).append("\n\n");

        sb.append(DASHED_LINE).append("\n");
        sb.append("  BILL TO\n");
        sb.append(DASHED_LINE).append("\n");
        sb.append("  Name           : ").append(customerName).append("\n");
        sb.append("  Email          : ").append(customerEmail).append("\n\n");

        sb.append(DASHED_LINE).append("\n");
        sb.append("  ORDER ITEMS\n");
        sb.append(DASHED_LINE).append("\n\n");

        sb.append(String.format("  %-30s %5s  %12s  %12s%n", "Item", "Qty", "Unit Price", "Total"));
        sb.append("  ").append(DASHED_LINE).append("\n");

        if (items != null) {
            for (InvoiceItem item : items) {
                String truncatedName = item.getProductName();
                if (truncatedName.length() > 30) {
                    truncatedName = truncatedName.substring(0, 27) + "...";
                }
                sb.append(String.format("  %-30s %5d  %12s  %12s%n",
                        truncatedName,
                        item.getQuantity(),
                        formatCurrency(item.getUnitPrice()),
                        formatCurrency(item.getLineTotal())));
            }
        }

        sb.append("\n");
        sb.append(DASHED_LINE).append("\n");
        sb.append("  PAYMENT SUMMARY\n");
        sb.append(DASHED_LINE).append("\n\n");

        sb.append(String.format("  %-30s %24s%n", "Subtotal:", formatCurrency(subtotal)));

        if (shipping != null && shipping.compareTo(BigDecimal.ZERO) > 0) {
            sb.append(String.format("  %-30s %24s%n", "Shipping:", formatCurrency(shipping)));
        }

        if (discount != null && discount.compareTo(BigDecimal.ZERO) > 0) {
            sb.append(String.format("  %-30s -%23s%n", "Discount:", formatCurrency(discount)));
        }

        sb.append("  ").append(DASHED_LINE).append("\n");
        sb.append(String.format("  %-30s %24s%n", "TOTAL:", formatCurrency(total)));
        sb.append("  ").append(DASHED_LINE).append("\n\n");

        sb.append(DASHED_LINE).append("\n");
        sb.append("  PAYMENT INFORMATION\n");
        sb.append(DASHED_LINE).append("\n");
        sb.append("  Payment Method : ").append(paymentMethod != null ? paymentMethod : "N/A").append("\n");
        sb.append("  Payment Status : ").append(paymentStatus != null ? paymentStatus : "N/A").append("\n\n");

        sb.append(LINE_SEPARATOR).append("\n");
        sb.append("\n  Thank you for shopping with us!\n");
        sb.append("  For any questions, contact support@handmadestore.com\n\n");
        sb.append(LINE_SEPARATOR).append("\n");

        return sb.toString();
    }

    public String generateInvoiceText(Order order, String transactionId) {
        InvoiceContext ctx = buildContext(order, transactionId);
        StringBuilder sb = new StringBuilder();

        sb.append(LINE_SEPARATOR).append("\n");
        sb.append("                        HANDMADE STORE").append("\n");
        sb.append("                      TAX INVOICE / RECEIPT").append("\n");
        sb.append(LINE_SEPARATOR).append("\n\n");

        sb.append("  Invoice No.     : ").append(ctx.invoiceNo).append("\n");
        sb.append("  Invoice Date    : ").append(ctx.invoiceDate).append("\n");
        sb.append("  Order ID        : #").append(ctx.orderId).append("\n");
        sb.append("  Order Status    : ").append(ctx.orderStatus).append("\n");
        sb.append("  Payment Method  : ").append(ctx.paymentMethod).append("\n");
        sb.append("  Payment Status  : ").append(ctx.paymentStatus).append("\n");
        sb.append("  Transaction ID  : ").append(ctx.transactionId).append("\n");
        sb.append("  Tracking No.    : ").append(ctx.trackingNumber == null || ctx.trackingNumber.isBlank()
                ? "N/A" : ctx.trackingNumber).append("\n\n");

        sb.append(DASHED_LINE).append("\n");
        sb.append("  BILL TO / SHIP TO\n");
        sb.append(DASHED_LINE).append("\n");
        sb.append("  Name            : ").append(ctx.customerName).append("\n");
        sb.append("  Email           : ").append(ctx.customerEmail).append("\n");
        sb.append("  Phone           : ").append(nvl(ctx.customerPhone)).append("\n");
        sb.append("  Ship To         : ").append(nvl(ctx.shippingAddress)).append("\n\n");

        sb.append(DASHED_LINE).append("\n");
        sb.append("  ORDER ITEMS\n");
        sb.append(DASHED_LINE).append("\n\n");

        sb.append(String.format("  %-12s %-26s %5s  %12s  %12s%n",
                "SKU", "Item", "Qty", "Unit Price", "Amount"));
        sb.append("  ").append(DASHED_LINE).append("\n");

        if (ctx.items != null) {
            for (InvoiceItem item : ctx.items) {
                String name = item.getProductName() == null ? "" : item.getProductName();
                if (name.length() > 26) {
                    name = name.substring(0, 23) + "...";
                }
                String sku = item.getSku() == null ? "" : item.getSku();
                if (sku.length() > 12) {
                    sku = sku.substring(0, 12);
                }
                sb.append(String.format("  %-12s %-26s %5d  %12s  %12s%n",
                        sku,
                        name,
                        item.getQuantity(),
                        formatCurrency(item.getUnitPrice()),
                        formatCurrency(item.getLineTotal())));
            }
        }

        sb.append("\n");
        sb.append(DASHED_LINE).append("\n");
        sb.append("  PAYMENT SUMMARY\n");
        sb.append(DASHED_LINE).append("\n\n");

        sb.append(String.format("  %-30s %24s%n", "Item Subtotal:", formatCurrency(ctx.subtotal)));
        if (ctx.discount.compareTo(BigDecimal.ZERO) > 0) {
            sb.append(String.format("  %-30s -%23s%n", "Discount:", formatCurrency(ctx.discount)));
        }
        sb.append(String.format("  %-30s %24s%n", "Taxable Value:", formatCurrency(ctx.taxableValue)));
        sb.append(String.format("  %-30s %24s%n", "GST (18%):", formatCurrency(ctx.gstAmount)));
        sb.append(String.format("  %-30s %24s%n", "Shipping:", formatCurrency(ctx.shipping)));
        sb.append("  ").append(DASHED_LINE).append("\n");
        sb.append(String.format("  %-30s %24s%n", "TOTAL (GST inclusive):", formatCurrency(ctx.total)));
        sb.append("  ").append(DASHED_LINE).append("\n\n");

        sb.append(DASHED_LINE).append("\n");
        sb.append("  PAYMENT INFORMATION\n");
        sb.append(DASHED_LINE).append("\n");
        sb.append("  Payment Method : ").append(ctx.paymentMethod).append("\n");
        sb.append("  Payment Status : ").append(ctx.paymentStatus).append("\n");
        sb.append("  Transaction ID : ").append(ctx.transactionId).append("\n\n");

        sb.append(LINE_SEPARATOR).append("\n");
        sb.append("\n  Thank you for shopping with us!\n");
        sb.append("  For any questions, contact support@handmadestore.com\n\n");
        sb.append(LINE_SEPARATOR).append("\n");

        return sb.toString();
    }

    public byte[] generateInvoicePdf(Order order, String transactionId) {
        InvoiceContext ctx = buildContext(order, transactionId);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
            Font bold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font small = FontFactory.getFont(FontFactory.HELVETICA, 8.5f);
            Font smallBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f);

            // ---- Header: brand + invoice meta ----
            PdfPTable header = new PdfPTable(2);
            header.setWidthPercentage(100);
            header.setWidths(new float[]{55f, 45f});

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(PdfPCell.NO_BORDER);
            brandCell.addElement(new Paragraph("HANDMADE STORE", brandFont));
            Paragraph tagline = new Paragraph("Handcrafted goods, made with love", normal);
            tagline.setSpacingAfter(6);
            brandCell.addElement(tagline);
            Paragraph gst = new Paragraph("GSTIN: 27ABCDE1234F1Z5", tint(small, MUTED));
            brandCell.addElement(gst);

            PdfPCell metaCell = new PdfPCell();
            metaCell.setBorder(PdfPCell.NO_BORDER);
            metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            metaCell.addElement(metaLine("TAX INVOICE", titleFont, BRAND));
            metaCell.addElement(metaLine("Invoice No : " + ctx.invoiceNo, small));
            metaCell.addElement(metaLine("Invoice Date : " + ctx.invoiceDate, small));
            metaCell.addElement(metaLine("Order ID : #" + ctx.orderId, small));

            header.addCell(brandCell);
            header.addCell(metaCell);
            document.add(header);

            Paragraph rule = new Paragraph("");
            rule.setSpacingAfter(12);
            document.add(rule);

            // ---- Parties: bill to / ship to ----
            PdfPTable parties = new PdfPTable(2);
            parties.setWidthPercentage(100);
            parties.setWidths(new float[]{50f, 50f});
            parties.setSpacingBefore(6);
            parties.setSpacingAfter(16);

            parties.addCell(partyCell("BILL TO", new String[]{
                    ctx.customerName,
                    "Email : " + ctx.customerEmail,
                    "Phone : " + nvl(ctx.customerPhone)
            }, smallBold, small));
            parties.addCell(partyCell("SHIP TO", new String[]{
                    ctx.customerName,
                    ctx.shippingAddress == null || ctx.shippingAddress.isBlank() ? "N/A" : ctx.shippingAddress,
                    "Tracking : " + (ctx.trackingNumber == null || ctx.trackingNumber.isBlank()
                            ? "N/A" : ctx.trackingNumber)
            }, smallBold, small));
            document.add(parties);

            // ---- Items table ----
            PdfPTable items = new PdfPTable(6);
            items.setWidthPercentage(100);
            items.setWidths(new float[]{5f, 14f, 30f, 9f, 19f, 23f});
            items.setSpacingBefore(4);
            items.setSpacingAfter(14);

            items.addCell(headerCell("S.No", bold));
            items.addCell(headerCell("SKU", bold));
            items.addCell(headerCell("Item", bold));
            items.addCell(headerCell("Qty", bold));
            items.addCell(headerCell("Unit Price", bold));
            items.addCell(headerCell("Amount", bold));

            int index = 1;
            for (InvoiceItem item : ctx.items) {
                items.addCell(bodyCell(String.valueOf(index++), normal));
                items.addCell(bodyCell(nvl(item.getSku()), normal));
                items.addCell(bodyCell(nvl(item.getProductName()), normal));
                items.addCell(bodyCell(String.valueOf(item.getQuantity()), normal));
                items.addCell(bodyCell(formatCurrency(item.getUnitPrice()), normal));
                items.addCell(bodyCell(formatCurrency(item.getLineTotal()), normal));
            }
            document.add(items);

            // ---- Totals ----
            PdfPTable totals = new PdfPTable(2);
            totals.setWidthPercentage(60);
            totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totals.setWidths(new float[]{62f, 38f});
            totals.setSpacingBefore(6);
            totals.setSpacingAfter(16);

            totals.addCell(totalLabelCell("Item Subtotal", normal));
            totals.addCell(totalValueCell(formatCurrency(ctx.subtotal), normal));
            if (ctx.discount.compareTo(BigDecimal.ZERO) > 0) {
                totals.addCell(totalLabelCell("Discount", normal));
                totals.addCell(totalValueCell("-" + formatCurrency(ctx.discount), normal));
            }
            totals.addCell(totalLabelCell("Taxable Value", normal));
            totals.addCell(totalValueCell(formatCurrency(ctx.taxableValue), normal));
            totals.addCell(totalLabelCell("GST (18%)", normal));
            totals.addCell(totalValueCell(formatCurrency(ctx.gstAmount), normal));
            totals.addCell(totalLabelCell("Shipping", normal));
            totals.addCell(totalValueCell(formatCurrency(ctx.shipping), normal));

            Font whiteBold = tint(bold, java.awt.Color.WHITE);
            PdfPCell totalLabel = totalLabelCell("TOTAL (GST inclusive)", whiteBold);
            totalLabel.setBackgroundColor(BRAND);
            totalLabel.setBorderColor(BRAND);
            PdfPCell totalValue = totalValueCell(formatCurrency(ctx.total), whiteBold);
            totalValue.setBackgroundColor(BRAND);
            totalValue.setBorderColor(BRAND);
            totals.addCell(totalLabel);
            totals.addCell(totalValue);
            document.add(totals);

            // ---- Payment info ----
            PdfPTable payment = new PdfPTable(2);
            payment.setWidthPercentage(100);
            payment.setSpacingBefore(4);
            payment.setSpacingAfter(20);
            payment.addCell(infoCell("Payment Method", ctx.paymentMethod, smallBold, small));
            payment.addCell(infoCell("Payment Status", ctx.paymentStatus, smallBold, small));
            payment.addCell(infoCell("Transaction ID", ctx.transactionId, smallBold, small));
            payment.addCell(infoCell("Order Status", ctx.orderStatus, smallBold, small));
            document.add(payment);

            Paragraph note = new Paragraph(
                    "All prices are inclusive of GST (18%). Please keep this invoice for your records.",
                    tint(small, MUTED));
            document.add(note);

            Paragraph thanks = new Paragraph("Thank you for shopping with Handmade Store!", bold);
            thanks.setAlignment(Element.ALIGN_CENTER);
            thanks.setSpacingBefore(10);
            document.add(thanks);

            Paragraph footer = new Paragraph("support@handmadestore.com  |  www.handmadestore.com",
                    tint(small, MUTED));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF invoice", e);
        }
    }

    private InvoiceContext buildContext(Order order, String transactionId) {
        InvoiceContext ctx = new InvoiceContext();
        User user = order.getUser();
        ctx.customerName = (nvl(user.getFirstName()) + " " + nvl(user.getLastName())).trim();
        ctx.customerEmail = nvl(user.getEmail());
        ctx.customerPhone = user.getPhone();
        ctx.shippingAddress = order.getShippingAddress();
        ctx.trackingNumber = order.getTrackingNumber();
        ctx.orderId = order.getId();
        ctx.invoiceNo = "INV-" + order.getId();
        ctx.invoiceDate = order.getCreatedAt() != null
                ? order.getCreatedAt().format(DATE_TIME)
                : LocalDateTime.now().format(DATE_TIME);
        ctx.orderStatus = order.getOrderStatus() != null ? order.getOrderStatus().name() : "N/A";
        ctx.paymentMethod = order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "N/A";
        ctx.paymentStatus = order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "N/A";
        ctx.transactionId = transactionId == null || transactionId.isBlank() ? "N/A" : transactionId;

        List<InvoiceItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                BigDecimal lineTotal = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                BigDecimal unitPrice = qty > 0
                        ? lineTotal.divide(BigDecimal.valueOf(qty), 2, RoundingMode.HALF_UP)
                        : lineTotal;
                String sku = item.getProduct() != null ? item.getProduct().getSku() : null;
                String name = item.getProduct() != null ? item.getProduct().getName() : "Item";
                items.add(new InvoiceItem(name, sku, qty, unitPrice, lineTotal));
                subtotal = subtotal.add(lineTotal);
            }
        }
        ctx.items = items;
        ctx.subtotal = subtotal;

        BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        ctx.discount = subtotal.compareTo(total) > 0 ? subtotal.subtract(total) : BigDecimal.ZERO;
        ctx.shipping = BigDecimal.ZERO;
        ctx.total = total;

        BigDecimal payable = subtotal.subtract(ctx.discount);
        ctx.gstAmount = payable.multiply(GST_RATE)
                .divide(GST_INCLUSIVE_DIVISOR, 2, RoundingMode.HALF_UP);
        ctx.taxableValue = payable.subtract(ctx.gstAmount);
        return ctx;
    }

    private static class InvoiceContext {
        String invoiceNo;
        String invoiceDate;
        Long orderId;
        String customerName;
        String customerEmail;
        String customerPhone;
        String shippingAddress;
        String trackingNumber;
        String orderStatus;
        String paymentMethod;
        String paymentStatus;
        String transactionId;
        List<InvoiceItem> items;
        BigDecimal subtotal;
        BigDecimal discount;
        BigDecimal taxableValue;
        BigDecimal gstAmount;
        BigDecimal shipping;
        BigDecimal total;
    }

    private Paragraph metaLine(String text, Font font, java.awt.Color color) {
        Paragraph p = new Paragraph(text, tint(font, color));
        p.setAlignment(Element.ALIGN_RIGHT);
        return p;
    }

    private Font tint(Font font, java.awt.Color color) {
        Font copy = new Font(font);
        copy.setColor(color);
        return copy;
    }

    private Paragraph metaLine(String text, Font font) {
        return metaLine(text, font, java.awt.Color.BLACK);
    }

    private PdfPCell partyCell(String title, String[] lines, Font titleFont, Font bodyFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(MUTED);
        cell.setPadding(8);
        cell.addElement(new Paragraph(title, titleFont));
        cell.addElement(new Paragraph("\u00a0", bodyFont));
        for (String line : lines) {
            cell.addElement(new Paragraph(line, bodyFont));
        }
        return cell;
    }

    private PdfPCell headerCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(BRAND);
        cell.setBorderColor(BRAND);
        cell.setPadding(5);
        return cell;
    }

    private PdfPCell bodyCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4);
        return cell;
    }

    private PdfPCell totalLabelCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(3);
        return cell;
    }

    private PdfPCell totalValueCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(3);
        return cell;
    }

    private PdfPCell infoCell(String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(MUTED);
        cell.setPadding(6);
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(nvl(value), valueFont));
        return cell;
    }

    private String nvl(String value) {
        return value == null || value.isBlank() ? "N/A" : value;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "\u20B90.00";
        }
        return "\u20B9" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
