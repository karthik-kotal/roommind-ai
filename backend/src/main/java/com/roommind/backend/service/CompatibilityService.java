package com.roommind.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.roommind.backend.dto.SurfaceCustomizationDto;
import com.roommind.backend.entity.StylePackage;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class CompatibilityService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class CompatibilityResult {
        public double overallScore;
        public String breakdownJson;
    }

    public CompatibilityResult calculateCompatibility(
            StylePackage stylePackage,
            String detectedWallCategory,
            String detectedFloorCategory) {

        // 1. Color Harmony Sub-score (Weight: 0.30)
        double colorHarmony = 90.0;
        if (detectedFloorCategory.contains("Wood") || detectedFloorCategory.contains("tile")) {
            colorHarmony = 94.0;
        }

        // 2. Material Harmony Sub-score (Weight: 0.25)
        double materialHarmony = 88.0;
        if (stylePackage == StylePackage.LUXURY) {
            materialHarmony = 96.0;
        } else if (stylePackage == StylePackage.MODERN) {
            materialHarmony = 92.0;
        }

        // 3. Lighting Match Sub-score (Weight: 0.20)
        double lightingMatch = 85.0;

        // 4. Texture Balance Sub-score (Weight: 0.15)
        double textureBalance = 87.0;

        // 5. Style Match Sub-score (Weight: 0.10)
        double styleMatch = 95.0;

        // Weighted sum calculation:
        // Score = 0.30*color + 0.25*mat + 0.20*light + 0.15*text + 0.10*style
        double overall = (0.30 * colorHarmony) + (0.25 * materialHarmony) +
                (0.20 * lightingMatch) + (0.15 * textureBalance) + (0.10 * styleMatch);

        double roundedOverall = BigDecimal.valueOf(overall).setScale(2, RoundingMode.HALF_UP).doubleValue();

        return buildCompatibilityResult(roundedOverall, colorHarmony, materialHarmony, lightingMatch, textureBalance, styleMatch);
    }

    public CompatibilityResult recalculateDynamicCompatibility(
            StylePackage stylePackage,
            Map<String, SurfaceCustomizationDto> surfaceMap) {

        // Preserved Phase 3 weighted linear combination formula:
        // 1. Color Harmony (0.30)
        double colorHarmony = 90.0;
        SurfaceCustomizationDto floorCustom = surfaceMap != null ? surfaceMap.get("FLOOR") : null;
        if (floorCustom != null && ("HARDWOOD".equalsIgnoreCase(floorCustom.getMaterialPreset()) || "CERAMIC_TILE".equalsIgnoreCase(floorCustom.getMaterialPreset()) || "ITALIAN_MARBLE".equalsIgnoreCase(floorCustom.getMaterialPreset()))) {
            colorHarmony = 93.0;
        }

        // 2. Material Harmony (0.25)
        double materialHarmony = 88.0;
        if (stylePackage == StylePackage.LUXURY) {
            materialHarmony = 95.0;
        } else if (stylePackage == StylePackage.MODERN) {
            materialHarmony = 92.0;
        }

        // 3. Lighting Match (0.20) based on average roughness
        double lightingMatch = 85.0;
        if (surfaceMap != null) {
            double avgRoughness = surfaceMap.values().stream()
                    .mapToDouble(s -> s.getRoughness() != null ? s.getRoughness() : 0.5)
                    .average().orElse(0.5);
            lightingMatch = 80.0 + (avgRoughness * 20.0);
        }

        // 4. Texture Balance (0.15)
        double textureBalance = 87.0;
        SurfaceCustomizationDto northWall = surfaceMap != null ? surfaceMap.get("WALL_NORTH") : null;
        if (northWall != null && "EXPOSED_BRICK".equalsIgnoreCase(northWall.getMaterialPreset())) {
            textureBalance = 92.0; // Feature accent wall contrast bonus
        }

        // 5. Style Match (0.10)
        double styleMatch = 95.0;

        double overall = (0.30 * colorHarmony) + (0.25 * materialHarmony) +
                (0.20 * lightingMatch) + (0.15 * textureBalance) + (0.10 * styleMatch);

        double roundedOverall = BigDecimal.valueOf(overall).setScale(2, RoundingMode.HALF_UP).doubleValue();

        return buildCompatibilityResult(roundedOverall, colorHarmony, materialHarmony, lightingMatch, textureBalance, styleMatch);
    }

    private CompatibilityResult buildCompatibilityResult(
            double roundedOverall, double colorHarmony, double materialHarmony,
            double lightingMatch, double textureBalance, double styleMatch) {

        ObjectNode breakdown = objectMapper.createObjectNode();
        breakdown.put("overallScore", roundedOverall);

        ObjectNode componentsNode = objectMapper.createObjectNode();

        ObjectNode colorNode = componentsNode.putObject("colorHarmony");
        colorNode.put("score", BigDecimal.valueOf(colorHarmony).setScale(2, RoundingMode.HALF_UP).doubleValue());
        colorNode.put("weight", 0.30);

        ObjectNode matNode = componentsNode.putObject("materialHarmony");
        matNode.put("score", BigDecimal.valueOf(materialHarmony).setScale(2, RoundingMode.HALF_UP).doubleValue());
        matNode.put("weight", 0.25);

        ObjectNode lightNode = componentsNode.putObject("lightingMatch");
        lightNode.put("score", BigDecimal.valueOf(lightingMatch).setScale(2, RoundingMode.HALF_UP).doubleValue());
        lightNode.put("weight", 0.20);

        ObjectNode textNode = componentsNode.putObject("textureBalance");
        textNode.put("score", BigDecimal.valueOf(textureBalance).setScale(2, RoundingMode.HALF_UP).doubleValue());
        textNode.put("weight", 0.15);

        ObjectNode styleNode = componentsNode.putObject("styleMatch");
        styleNode.put("score", BigDecimal.valueOf(styleMatch).setScale(2, RoundingMode.HALF_UP).doubleValue());
        styleNode.put("weight", 0.10);

        breakdown.set("components", componentsNode);

        CompatibilityResult result = new CompatibilityResult();
        result.overallScore = roundedOverall;
        result.breakdownJson = breakdown.toString();
        return result;
    }
}

