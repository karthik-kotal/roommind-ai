package com.roommind.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.roommind.backend.entity.RoomAnalysis;
import com.roommind.backend.entity.RoomScan;
import com.roommind.backend.entity.ScanImage;
import com.roommind.backend.entity.User;
import com.roommind.backend.exception.ResourceNotFoundException;
import com.roommind.backend.repository.RoomAnalysisRepository;
import com.roommind.backend.repository.RoomScanRepository;
import com.roommind.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AnalysisService {

    private final RoomScanRepository roomScanRepository;
    private final RoomAnalysisRepository roomAnalysisRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.service.url:http://localhost:8089}")
    private String aiServiceUrl;

    public AnalysisService(
            RoomScanRepository roomScanRepository,
            RoomAnalysisRepository roomAnalysisRepository,
            UserRepository userRepository) {
        this.roomScanRepository = roomScanRepository;
        this.roomAnalysisRepository = roomAnalysisRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RoomAnalysis analyzeRoomScan(String userEmail, Long scanId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        RoomScan scan = roomScanRepository.findById(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("Room scan not found: " + scanId));

        if (!scan.getRoom().getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to scan ID: " + scanId);
        }

        // Return existing analysis if already computed
        Optional<RoomAnalysis> existing = roomAnalysisRepository.findByRoomScanId(scanId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Map<String, String> imagePaths = new HashMap<>();
        for (ScanImage img : scan.getImages()) {
            imagePaths.put(img.getSurfaceType().name(), img.getFilePath());
        }

        String wallCat = "Not confidently detected";
        BigDecimal wallScore = BigDecimal.ZERO.setScale(4);
        String floorCat = "Not confidently detected";
        BigDecimal floorScore = BigDecimal.ZERO.setScale(4);
        String openingsJson = "[]";
        String furnitureJson = "[]";
        String rawVisionJson = "{}";
        String analysisSource = "HEURISTIC_FALLBACK";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("imagePaths", imagePaths);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(reqBody, headers);
            String endpoint = aiServiceUrl.endsWith("/analyze") ? aiServiceUrl : aiServiceUrl + "/analyze";
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resNode = objectMapper.readTree(response.getBody());
                rawVisionJson = response.getBody();

                if (resNode.has("analysisSource")) {
                    analysisSource = resNode.get("analysisSource").asText();
                } else {
                    analysisSource = "PRETRAINED_CV";
                }

                // Parse surfaces (WALL_1 or WALL, and FLOOR)
                if (resNode.has("surfaces")) {
                    JsonNode surfacesNode = resNode.get("surfaces");
                    for (var it = surfacesNode.fieldNames(); it.hasNext(); ) {
                        String sKey = it.next();
                        JsonNode sObj = surfacesNode.get(sKey);
                        if (sKey.toLowerCase().contains("wall") && sObj.has("category")) {
                            wallCat = sObj.get("category").asText();
                            if (sObj.has("modelScore")) {
                                wallScore = BigDecimal.valueOf(sObj.get("modelScore").asDouble()).setScale(4, RoundingMode.HALF_UP);
                            }
                        } else if (sKey.toLowerCase().contains("floor") && sObj.has("category")) {
                            floorCat = sObj.get("category").asText();
                            if (sObj.has("modelScore")) {
                                floorScore = BigDecimal.valueOf(sObj.get("modelScore").asDouble()).setScale(4, RoundingMode.HALF_UP);
                            }
                        }
                    }
                }

                // Separate openings vs furniture detections
                if (resNode.has("objects")) {
                    com.fasterxml.jackson.databind.node.ArrayNode openingsArr = objectMapper.createArrayNode();
                    com.fasterxml.jackson.databind.node.ArrayNode furnitureArr = objectMapper.createArrayNode();

                    JsonNode objectsNode = resNode.get("objects");
                    if (objectsNode.isArray()) {
                        for (JsonNode obj : objectsNode) {
                            String clsName = obj.has("className") ? obj.get("className").asText().toLowerCase() : "";
                            if (clsName.contains("door") || clsName.contains("window")) {
                                openingsArr.add(obj);
                            } else {
                                furnitureArr.add(obj);
                            }
                        }
                    }
                    openingsJson = openingsArr.toString();
                    furnitureJson = furnitureArr.toString();
                }
            }
        } catch (Exception e) {
            System.err.println("AI Microservice unreachable at " + aiServiceUrl + ". Using explicit HEURISTIC_FALLBACK: " + e.getMessage());
            ObjectNode rawFallback = objectMapper.createObjectNode();
            rawFallback.put("analysisSource", "HEURISTIC_FALLBACK");
            rawFallback.put("status", "Local Fallback Active");
            rawFallback.put("reason", e.getMessage());
            rawVisionJson = rawFallback.toString();
            analysisSource = "HEURISTIC_FALLBACK";
        }

        RoomAnalysis analysis = new RoomAnalysis();
        analysis.setRoomScan(scan);
        analysis.setDetectedWallCategory(wallCat);
        analysis.setWallModelScore(wallScore);
        analysis.setDetectedFloorCategory(floorCat);
        analysis.setFloorModelScore(floorScore);
        analysis.setOpeningsDetected(openingsJson);
        analysis.setFurnitureDetected(furnitureJson);
        analysis.setAnalysisSource(analysisSource);
        analysis.setRawVisionOutput(rawVisionJson);

        return roomAnalysisRepository.save(analysis);
    }

    @Transactional(readOnly = true)
    public RoomAnalysis getAnalysisByScanId(String userEmail, Long scanId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        RoomScan scan = roomScanRepository.findById(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("Room scan not found: " + scanId));

        if (!scan.getRoom().getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to scan ID: " + scanId);
        }

        return roomAnalysisRepository.findByRoomScanId(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not yet generated for scan ID: " + scanId));
    }
}
