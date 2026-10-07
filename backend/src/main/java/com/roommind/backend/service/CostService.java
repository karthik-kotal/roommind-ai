package com.roommind.backend.service;

import com.roommind.backend.dto.SurfaceCostDetailDto;
import com.roommind.backend.dto.SurfaceCustomizationDto;
import com.roommind.backend.entity.Room;
import com.roommind.backend.entity.StylePackage;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CostService {

    public static class CostCalculationResult {
        public BigDecimal subtotalInr;
        public BigDecimal taxRatePercent;
        public BigDecimal taxAmountInr;
        public BigDecimal estimatedTotalInr;
        public List<SurfaceCostDetailDto> surfaceCostBreakdown;
        public String disclaimer = "Actual cost may vary depending on material, vendor, labor, location and applicable taxes.";
    }

    public CostCalculationResult calculateRenovationCost(Room room, StylePackage stylePackage, Double customTaxRatePercent) {
        // Default room dimensions if skipped for legacy Phase 3 flow
        double length = (room.getLength() != null && room.getLength() > 0) ? room.getLength() : 4.5;
        double width = (room.getWidth() != null && room.getWidth() > 0) ? room.getWidth() : 3.8;
        double height = (room.getHeight() != null && room.getHeight() > 0) ? room.getHeight() : 2.8;

        // Convert meters to square feet (1 sq.m = 10.7639 sq.ft)
        double floorAreaSqFt = length * width * 10.7639;
        double wallAreaSqFt = 2.0 * height * (length + width) * 10.7639;
        double totalAreaSqFt = floorAreaSqFt + wallAreaSqFt;

        // Base rate per sq.ft based on StylePackage
        double materialRate;
        double laborRate;

        if (stylePackage == StylePackage.LUXURY) {
            materialRate = 350.0; // ₹/sq.ft
            laborRate = 85.0;     // ₹/sq.ft
        } else if (stylePackage == StylePackage.MODERN) {
            materialRate = 180.0; // ₹/sq.ft
            laborRate = 45.0;     // ₹/sq.ft
        } else { // STANDARD
            materialRate = 95.0;  // ₹/sq.ft
            laborRate = 30.0;     // ₹/sq.ft
        }

        double subtotal = totalAreaSqFt * (materialRate + laborRate);
        double taxRate = (customTaxRatePercent != null && customTaxRatePercent >= 0 && customTaxRatePercent <= 50) ? customTaxRatePercent : 18.0;
        double taxAmount = subtotal * (taxRate / 100.0);
        double totalEstimated = subtotal + taxAmount;

        CostCalculationResult res = new CostCalculationResult();
        res.subtotalInr = BigDecimal.valueOf(subtotal).setScale(2, RoundingMode.HALF_UP);
        res.taxRatePercent = BigDecimal.valueOf(taxRate).setScale(2, RoundingMode.HALF_UP);
        res.taxAmountInr = BigDecimal.valueOf(taxAmount).setScale(2, RoundingMode.HALF_UP);
        res.estimatedTotalInr = BigDecimal.valueOf(totalEstimated).setScale(2, RoundingMode.HALF_UP);
        return res;
    }

    public CostCalculationResult recalculateSurfaceCosts(
            Room room,
            StylePackage stylePackage,
            Map<String, SurfaceCustomizationDto> surfaceMap,
            Double customTaxRatePercent) {

        // Strict Validation: Room dimensions must be positive numbers
        if (room.getLength() == null || room.getLength() <= 0 ||
            room.getWidth() == null || room.getWidth() <= 0 ||
            room.getHeight() == null || room.getHeight() <= 0) {
            throw new IllegalArgumentException("Invalid room dimensions: Length, width, and height must be positive numbers for financial cost estimation.");
        }

        // Strict Validation: Tax rate range
        BigDecimal taxRatePercent;
        if (customTaxRatePercent != null) {
            if (customTaxRatePercent < 0.0 || customTaxRatePercent > 50.0) {
                throw new IllegalArgumentException("Tax rate must be between 0.0% and 50.0%");
            }
            taxRatePercent = BigDecimal.valueOf(customTaxRatePercent).setScale(2, RoundingMode.HALF_UP);
        } else {
            taxRatePercent = BigDecimal.valueOf(18.00).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal l = BigDecimal.valueOf(room.getLength());
        BigDecimal w = BigDecimal.valueOf(room.getWidth());
        BigDecimal h = BigDecimal.valueOf(room.getHeight());
        BigDecimal sqFtConversion = BigDecimal.valueOf(10.7639);

        // Individual surface area calculations
        BigDecimal floorArea = l.multiply(w).multiply(sqFtConversion).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ceilingArea = floorArea;
        BigDecimal northWallArea = l.multiply(h).multiply(sqFtConversion).setScale(2, RoundingMode.HALF_UP);
        BigDecimal westWallArea = w.multiply(h).multiply(sqFtConversion).setScale(2, RoundingMode.HALF_UP);
        BigDecimal eastWallArea = westWallArea;

        List<SurfaceCostDetailDto> details = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        String[] targetSurfaces = new String[]{"WALL_NORTH", "WALL_WEST", "WALL_EAST", "FLOOR", "CEILING"};
        for (String surfaceKey : targetSurfaces) {
            SurfaceCustomizationDto custom = surfaceMap.get(surfaceKey);
            if (custom == null) {
                throw new IllegalArgumentException("Missing required surface customization for key: " + surfaceKey);
            }

            BigDecimal area;
            switch (surfaceKey) {
                case "WALL_NORTH":
                    area = northWallArea;
                    break;
                case "WALL_WEST":
                    area = westWallArea;
                    break;
                case "WALL_EAST":
                    area = eastWallArea;
                    break;
                case "FLOOR":
                    area = floorArea;
                    break;
                case "CEILING":
                    area = ceilingArea;
                    break;
                default:
                    throw new IllegalArgumentException("Unknown surface key: " + surfaceKey);
            }

            double matRate = getMaterialRate(custom.getMaterialPreset());
            double labRate = getLaborRate(custom.getMaterialPreset());

            BigDecimal materialRateBD = BigDecimal.valueOf(matRate);
            BigDecimal laborRateBD = BigDecimal.valueOf(labRate);

            BigDecimal matCost = area.multiply(materialRateBD).setScale(2, RoundingMode.HALF_UP);
            BigDecimal labCost = area.multiply(laborRateBD).setScale(2, RoundingMode.HALF_UP);
            BigDecimal surfTotal = matCost.add(labCost);

            details.add(new SurfaceCostDetailDto(surfaceKey, area, matCost, labCost, surfTotal));
            subtotal = subtotal.add(surfTotal);
        }

        BigDecimal taxAmount = subtotal.multiply(taxRatePercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal estimatedTotal = subtotal.add(taxAmount);

        CostCalculationResult result = new CostCalculationResult();
        result.subtotalInr = subtotal;
        result.taxRatePercent = taxRatePercent;
        result.taxAmountInr = taxAmount;
        result.estimatedTotalInr = estimatedTotal;
        result.surfaceCostBreakdown = details;
        return result;
    }

    private double getMaterialRate(String preset) {
        if (preset == null) return 35.0;
        switch (preset.toUpperCase()) {
            case "MATTE_PAINT": return 35.0;
            case "SATIN_PAINT": return 55.0;
            case "HARDWOOD": return 280.0;
            case "CERAMIC_TILE": return 120.0;
            case "ITALIAN_MARBLE": return 450.0;
            case "EXPOSED_BRICK": return 160.0;
            case "WALLPAPER": return 90.0;
            default:
                throw new IllegalArgumentException("Invalid or unsupported material preset: " + preset);
        }
    }

    private double getLaborRate(String preset) {
        if (preset == null) return 15.0;
        switch (preset.toUpperCase()) {
            case "MATTE_PAINT": return 15.0;
            case "SATIN_PAINT": return 20.0;
            case "HARDWOOD": return 60.0;
            case "CERAMIC_TILE": return 40.0;
            case "ITALIAN_MARBLE": return 110.0;
            case "EXPOSED_BRICK": return 50.0;
            case "WALLPAPER": return 25.0;
            default:
                throw new IllegalArgumentException("Invalid or unsupported material preset: " + preset);
        }
    }
}

