package com.roommind.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.BomResponse;
import com.roommind.backend.dto.SurfaceCostDetailDto;
import com.roommind.backend.dto.SurfaceCustomizationDto;
import com.roommind.backend.entity.RoomDesign;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

@Service
public class PdfReportService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateDesignReportPdf(RoomDesign design, BomResponse bom) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font subFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font textFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                float y = 780;

                // Header Title
                cs.beginText();
                cs.setFont(titleFont, 18);
                cs.newLineAtOffset(50, y);
                cs.showText("ROOMMIND AI - INTERIOR DESIGN REPORT");
                cs.endText();

                y -= 25;
                cs.beginText();
                cs.setFont(textFont, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Automated Parametric Reconstruction & Renovation Cost Report");
                cs.endText();

                // Horizontal Line
                y -= 15;
                cs.setLineWidth(1.0f);
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                // Section 1: Overview
                y -= 25;
                cs.beginText();
                cs.setFont(subFont, 12);
                cs.newLineAtOffset(50, y);
                cs.showText("1. DESIGN VERSION & ROOM OVERVIEW");
                cs.endText();

                y -= 18;
                cs.beginText();
                cs.setFont(textFont, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Room: " + sanitizeText(bom.getRoomName()) + " (ID: " + bom.getRoomId() + ")");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.setFont(textFont, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Design Snapshot: Version " + bom.getVersionNumber() + " | Aesthetic Package: " + bom.getStylePackage());
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.setFont(textFont, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Overall Architectural Compatibility Score: " + design.getOverallCompatibilityScore() + " / 100");
                cs.endText();

                // Section 2: Bill of Materials (BOM)
                y -= 30;
                cs.beginText();
                cs.setFont(subFont, 12);
                cs.newLineAtOffset(50, y);
                cs.showText("2. ITEMIZE BILL OF MATERIALS (BOM)");
                cs.endText();

                y -= 20;
                // Table Header
                cs.beginText();
                cs.setFont(subFont, 9);
                cs.newLineAtOffset(50, y);
                cs.showText("Surface Key");
                cs.newLineAtOffset(110, 0);
                cs.showText("Preset");
                cs.newLineAtOffset(110, 0);
                cs.showText("Area (sq.ft)");
                cs.newLineAtOffset(90, 0);
                cs.showText("Mat. Cost");
                cs.newLineAtOffset(90, 0);
                cs.showText("Total Cost");
                cs.endText();

                y -= 5;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                Map<String, SurfaceCustomizationDto> map = null;
                try {
                    if (design.getSurfaceCustomizationMap() != null) {
                        map = objectMapper.readValue(design.getSurfaceCustomizationMap(), new TypeReference<Map<String, SurfaceCustomizationDto>>() {});
                    }
                } catch (Exception e) {}

                if (bom.getSurfaceItems() != null) {
                    for (SurfaceCostDetailDto item : bom.getSurfaceItems()) {
                        y -= 15;
                        String preset = (map != null && map.containsKey(item.getSurfaceKey())) ? map.get(item.getSurfaceKey()).getMaterialPreset() : "STANDARD";

                        cs.beginText();
                        cs.setFont(textFont, 9);
                        cs.newLineAtOffset(50, y);
                        cs.showText(sanitizeText(item.getSurfaceKey()));
                        cs.newLineAtOffset(110, 0);
                        cs.showText(sanitizeText(preset));
                        cs.newLineAtOffset(110, 0);
                        cs.showText(item.getAreaSqFt() != null ? item.getAreaSqFt().toString() : "0.0");
                        cs.newLineAtOffset(90, 0);
                        cs.showText("INR " + formatMoney(item.getMaterialCostInr()));
                        cs.newLineAtOffset(90, 0);
                        cs.showText("INR " + formatMoney(item.getTotalSurfaceCostInr()));
                        cs.endText();
                    }
                }

                // Section 3: Financial Summary
                y -= 35;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                y -= 20;
                cs.beginText();
                cs.setFont(subFont, 12);
                cs.newLineAtOffset(50, y);
                cs.showText("3. COST SUMMARY & TAX CALCULATION");
                cs.endText();

                y -= 18;
                cs.beginText();
                cs.setFont(textFont, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Material & Labor Subtotal: INR " + formatMoney(bom.getSubtotalCostInr()));
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.setFont(textFont, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Configured Tax Rate (" + bom.getTaxRatePercent() + "%): INR " + formatMoney(bom.getTaxAmountInr()));
                cs.endText();

                y -= 18;
                cs.beginText();
                cs.setFont(subFont, 11);
                cs.newLineAtOffset(50, y);
                cs.showText("Estimated Total Cost: INR " + formatMoney(bom.getEstimatedTotalCostInr()));
                cs.endText();

                // Disclaimer
                y -= 40;
                cs.beginText();
                cs.setFont(textFont, 8);
                cs.newLineAtOffset(50, y);
                cs.showText("DISCLAIMER: " + sanitizeText(bom.getCostDisclaimer()));
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private String formatMoney(BigDecimal amount) {
        return amount != null ? amount.setScale(2, java.math.RoundingMode.HALF_UP).toString() : "0.00";
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("[^\\x00-\\x7F]", ""); // Strip non-ASCII for PDF Standard 14 fonts
    }
}
