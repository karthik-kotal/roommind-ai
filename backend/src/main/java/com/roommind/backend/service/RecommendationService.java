package com.roommind.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.roommind.backend.entity.StylePackage;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateRecommendations(
            StylePackage stylePackage,
            String detectedWallCategory,
            String detectedFloorCategory) {

        ObjectNode rootNode = objectMapper.createObjectNode();
        rootNode.put("stylePackage", stylePackage.name());

        // WALL_1 Recommendation
        ObjectNode wall1 = rootNode.putObject("WALL_1");
        if (stylePackage == StylePackage.LUXURY) {
            wall1.put("recommendedOption", "Dark Walnut Fluted Wooden Panelling");
        } else if (stylePackage == StylePackage.MODERN) {
            wall1.put("recommendedOption", "Muted Warm Olive Limewash Plaster");
        } else {
            wall1.put("recommendedOption", "Premium Off-White Emulsion Paint");
        }
        ArrayNode wall1Reasons = wall1.putArray("reasons");
        wall1Reasons.add("Complements detected " + detectedFloorCategory);
        wall1Reasons.add("Optimal light diffusion for detected natural-light level and brightness characteristics");
        wall1Reasons.add("Provides visual contrast with adjacent surfaces");
        wall1Reasons.add("Adheres strictly to " + stylePackage.name() + " design package taxonomy");

        // WALL_2 Recommendation
        ObjectNode wall2 = rootNode.putObject("WALL_2");
        wall2.put("recommendedOption", stylePackage == StylePackage.LUXURY ? "Smoked Mirror Accent Panels" : "Neutral Soft Beige Matte Paint");
        ArrayNode wall2Reasons = wall2.putArray("reasons");
        wall2Reasons.add("Enhances perceived spatial depth and ambient illumination");
        wall2Reasons.add("Harmonizes with detected " + detectedWallCategory);

        // FLOOR Recommendation
        ObjectNode floor = rootNode.putObject("FLOOR");
        if (stylePackage == StylePackage.LUXURY) {
            floor.put("recommendedOption", "Italian Calacatta Marble Slabs");
        } else if (stylePackage == StylePackage.MODERN) {
            floor.put("recommendedOption", "Large Format Vitrified Matte Porcelain Tiles");
        } else {
            floor.put("recommendedOption", "Durable Natural Oak Laminate Plank");
        }
        ArrayNode floorReasons = floor.putArray("reasons");
        floorReasons.add("High durability index matching structural floor type");
        floorReasons.add("Matches " + stylePackage.name() + " aesthetic parameters");

        return rootNode.toString();
    }
}
