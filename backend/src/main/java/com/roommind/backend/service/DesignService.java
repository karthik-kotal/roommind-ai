package com.roommind.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.DesignRequest;
import com.roommind.backend.dto.RecalculationRequest;
import com.roommind.backend.dto.RecalculationResponse;
import com.roommind.backend.entity.*;
import com.roommind.backend.exception.ResourceNotFoundException;
import com.roommind.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class DesignService {

    private final RoomRepository roomRepository;
    private final RoomScanRepository roomScanRepository;
    private final RoomAnalysisRepository roomAnalysisRepository;
    private final RoomDesignRepository roomDesignRepository;
    private final UserRepository userRepository;
    private final RecommendationService recommendationService;
    private final CompatibilityService compatibilityService;
    private final CostService costService;

    public DesignService(
            RoomRepository roomRepository,
            RoomScanRepository roomScanRepository,
            RoomAnalysisRepository roomAnalysisRepository,
            RoomDesignRepository roomDesignRepository,
            UserRepository userRepository,
            RecommendationService recommendationService,
            CompatibilityService compatibilityService,
            CostService costService) {
        this.roomRepository = roomRepository;
        this.roomScanRepository = roomScanRepository;
        this.roomAnalysisRepository = roomAnalysisRepository;
        this.roomDesignRepository = roomDesignRepository;
        this.userRepository = userRepository;
        this.recommendationService = recommendationService;
        this.compatibilityService = compatibilityService;
        this.costService = costService;
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public RoomDesign createOrUpdateDesign(String userEmail, Long roomId, StylePackage stylePackage, Double customTaxRatePercent) {
        return createSavedDesign(userEmail, roomId, stylePackage, customTaxRatePercent, null);
    }

    @Transactional
    public RoomDesign createSavedDesign(
            String userEmail,
            Long roomId,
            StylePackage stylePackage,
            Double customTaxRatePercent,
            java.util.Map<String, com.roommind.backend.dto.SurfaceCustomizationDto> surfaceMap) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        StylePackage pkg = (stylePackage != null) ? stylePackage : StylePackage.MODERN;
        String wallRecsJson = "{}";
        String compatBreakdownJson = "{}";
        BigDecimal overallScore = BigDecimal.ZERO;
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxRate = BigDecimal.valueOf(customTaxRatePercent != null ? customTaxRatePercent : 18.0);
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        String surfaceMapJson = "{}";

        if (surfaceMap != null && !surfaceMap.isEmpty()) {
            // 1. Calculate Recalculated Surface Costs
            CostService.CostCalculationResult costRes = costService.recalculateSurfaceCosts(
                    room, pkg, surfaceMap, customTaxRatePercent);
            subtotal = costRes.subtotalInr;
            taxRate = costRes.taxRatePercent;
            taxAmount = costRes.taxAmountInr;
            totalCost = costRes.estimatedTotalInr;

            // 2. Calculate Dynamic Compatibility
            CompatibilityService.CompatibilityResult compatRes =
                    compatibilityService.recalculateDynamicCompatibility(pkg, surfaceMap);
            overallScore = BigDecimal.valueOf(compatRes.overallScore).setScale(2, RoundingMode.HALF_UP);
            compatBreakdownJson = compatRes.breakdownJson;

            try {
                surfaceMapJson = objectMapper.writeValueAsString(surfaceMap);
            } catch (Exception e) {
                surfaceMapJson = "{}";
            }
        } else {
            // Fetch latest scan & analysis for wall/floor features
            String wallCat = "Paint wall finish";
            String floorCat = "Wood-like flooring";

            Optional<RoomScan> latestScan = roomScanRepository.findTopByRoomIdOrderByIdDesc(roomId);
            if (latestScan.isPresent()) {
                Optional<RoomAnalysis> analysisOpt = roomAnalysisRepository.findTopByRoomScanIdOrderByIdDesc(latestScan.get().getId());
                if (analysisOpt.isPresent()) {
                    wallCat = analysisOpt.get().getDetectedWallCategory();
                    floorCat = analysisOpt.get().getDetectedFloorCategory();
                }
            }

            wallRecsJson = recommendationService.generateRecommendations(pkg, wallCat, floorCat);
            CompatibilityService.CompatibilityResult compatRes =
                    compatibilityService.calculateCompatibility(pkg, wallCat, floorCat);
            overallScore = BigDecimal.valueOf(compatRes.overallScore).setScale(2, RoundingMode.HALF_UP);
            compatBreakdownJson = compatRes.breakdownJson;

            CostService.CostCalculationResult costRes =
                    costService.calculateRenovationCost(room, pkg, customTaxRatePercent);
            subtotal = costRes.subtotalInr;
            taxRate = costRes.taxRatePercent;
            taxAmount = costRes.taxAmountInr;
            totalCost = costRes.estimatedTotalInr;
        }

        // Phase 5C Versioning: Next version number = max(version_number) + 1
        int nextVersion = roomDesignRepository.findMaxVersionNumberByRoomId(roomId) + 1;

        RoomDesign newDesign = new RoomDesign();
        newDesign.setRoom(room);
        newDesign.setStylePackage(pkg);
        newDesign.setWallRecommendations(wallRecsJson);
        newDesign.setCompatibilityBreakdown(compatBreakdownJson);
        newDesign.setOverallCompatibilityScore(overallScore);
        newDesign.setSubtotalCostInr(subtotal);
        newDesign.setTaxRatePercent(taxRate);
        newDesign.setTaxAmountInr(taxAmount);
        newDesign.setEstimatedTotalCostInr(totalCost);
        newDesign.setVersionNumber(nextVersion);
        newDesign.setIsFavorite(false);
        newDesign.setSurfaceCustomizationMap(surfaceMapJson);

        return roomDesignRepository.save(newDesign);
    }

    @Transactional
    public RoomDesign restoreDesign(String userEmail, Long roomId, Long designId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign sourceDesign = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        // Create a NEW snapshot version copying source configuration
        int nextVersion = roomDesignRepository.findMaxVersionNumberByRoomId(roomId) + 1;

        RoomDesign restoredVersion = new RoomDesign();
        restoredVersion.setRoom(room);
        restoredVersion.setStylePackage(sourceDesign.getStylePackage());
        restoredVersion.setWallRecommendations(sourceDesign.getWallRecommendations() != null ? sourceDesign.getWallRecommendations() : "{}");
        restoredVersion.setCompatibilityBreakdown(sourceDesign.getCompatibilityBreakdown() != null ? sourceDesign.getCompatibilityBreakdown() : "{}");
        restoredVersion.setOverallCompatibilityScore(sourceDesign.getOverallCompatibilityScore());
        restoredVersion.setSubtotalCostInr(sourceDesign.getSubtotalCostInr());
        restoredVersion.setTaxRatePercent(sourceDesign.getTaxRatePercent());
        restoredVersion.setTaxAmountInr(sourceDesign.getTaxAmountInr());
        restoredVersion.setEstimatedTotalCostInr(sourceDesign.getEstimatedTotalCostInr());
        restoredVersion.setSurfaceCustomizationMap(sourceDesign.getSurfaceCustomizationMap() != null ? sourceDesign.getSurfaceCustomizationMap() : "{}");
        restoredVersion.setVersionNumber(nextVersion);
        restoredVersion.setParentDesignId(designId);
        restoredVersion.setIsFavorite(false);

        return roomDesignRepository.save(restoredVersion);
    }

    @Transactional
    public RoomDesign favoriteDesign(String userEmail, Long roomId, Long designId, Boolean favorite) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign design = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        design.setIsFavorite(favorite != null ? favorite : true);
        return roomDesignRepository.save(design);
    }

    @Transactional
    public RoomDesign cloneDesign(String userEmail, Long roomId, Long designId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign sourceDesign = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        int nextVersion = roomDesignRepository.findMaxVersionNumberByRoomId(roomId) + 1;

        RoomDesign clonedDesign = new RoomDesign();
        clonedDesign.setRoom(room);
        clonedDesign.setStylePackage(sourceDesign.getStylePackage());
        clonedDesign.setWallRecommendations(sourceDesign.getWallRecommendations() != null ? sourceDesign.getWallRecommendations() : "{}");
        clonedDesign.setCompatibilityBreakdown(sourceDesign.getCompatibilityBreakdown() != null ? sourceDesign.getCompatibilityBreakdown() : "{}");
        clonedDesign.setOverallCompatibilityScore(sourceDesign.getOverallCompatibilityScore());
        clonedDesign.setSubtotalCostInr(sourceDesign.getSubtotalCostInr());
        clonedDesign.setTaxRatePercent(sourceDesign.getTaxRatePercent());
        clonedDesign.setTaxAmountInr(sourceDesign.getTaxAmountInr());
        clonedDesign.setEstimatedTotalCostInr(sourceDesign.getEstimatedTotalCostInr());
        clonedDesign.setSurfaceCustomizationMap(sourceDesign.getSurfaceCustomizationMap() != null ? sourceDesign.getSurfaceCustomizationMap() : "{}");
        clonedDesign.setVersionNumber(nextVersion);
        clonedDesign.setParentDesignId(designId);
        clonedDesign.setIsFavorite(false);

        return roomDesignRepository.save(clonedDesign);
    }

    @Transactional(readOnly = true)
    public RecalculationResponse recalculateDesign(String userEmail, Long roomId, RecalculationRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        if (request == null || request.getSurfaceMap() == null || request.getSurfaceMap().isEmpty()) {
            throw new IllegalArgumentException("Surface map payload cannot be empty");
        }

        // 1. Transient Cost Calculation
        CostService.CostCalculationResult costRes = costService.recalculateSurfaceCosts(
                room,
                request.getStylePackage(),
                request.getSurfaceMap(),
                request.getCustomTaxRatePercent()
        );

        // 2. Transient Dynamic Compatibility Scoring
        CompatibilityService.CompatibilityResult compatRes = compatibilityService.recalculateDynamicCompatibility(
                request.getStylePackage(),
                request.getSurfaceMap()
        );

        RecalculationResponse response = new RecalculationResponse();
        response.setOverallCompatibilityScore(BigDecimal.valueOf(compatRes.overallScore).setScale(2, RoundingMode.HALF_UP));
        response.setCompatibilityBreakdownJson(compatRes.breakdownJson);
        response.setSubtotalCostInr(costRes.subtotalInr);
        response.setTaxRatePercent(costRes.taxRatePercent);
        response.setTaxAmountInr(costRes.taxAmountInr);
        response.setEstimatedTotalCostInr(costRes.estimatedTotalInr);
        response.setSurfaceCostBreakdown(costRes.surfaceCostBreakdown);
        response.setCostDisclaimer(costRes.disclaimer);

        // Explicit Phase 5B Guarantee: No call to roomDesignRepository.save()
        return response;
    }

    @Transactional(readOnly = true)
    public List<RoomDesign> getDesignsByRoomId(String userEmail, Long roomId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        return roomDesignRepository.findByRoomIdOrderByVersionNumberDesc(roomId);
    }

    @Transactional(readOnly = true)
    public RoomDesign getDesignById(String userEmail, Long roomId, Long designId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign design = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        return design;
    }

    @Transactional(readOnly = true)
    public com.roommind.backend.dto.BomResponse getBomResponse(String userEmail, Long roomId, Long designId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign design = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        java.util.Map<String, com.roommind.backend.dto.SurfaceCustomizationDto> map = null;
        if (design.getSurfaceCustomizationMap() != null && !design.getSurfaceCustomizationMap().isEmpty()) {
            try {
                map = objectMapper.readValue(design.getSurfaceCustomizationMap(), new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, com.roommind.backend.dto.SurfaceCustomizationDto>>() {});
            } catch (Exception e) {}
        }

        if (map == null || map.isEmpty()) {
            map = new java.util.HashMap<>();
            map.put("WALL_NORTH", new com.roommind.backend.dto.SurfaceCustomizationDto("MATTE_PAINT", "#f8fafc", 0.9, 0.0));
            map.put("WALL_WEST", new com.roommind.backend.dto.SurfaceCustomizationDto("MATTE_PAINT", "#f8fafc", 0.9, 0.0));
            map.put("WALL_EAST", new com.roommind.backend.dto.SurfaceCustomizationDto("MATTE_PAINT", "#f8fafc", 0.9, 0.0));
            map.put("FLOOR", new com.roommind.backend.dto.SurfaceCustomizationDto("HARDWOOD", "#8b5a2b", 0.4, 0.02));
            map.put("CEILING", new com.roommind.backend.dto.SurfaceCustomizationDto("MATTE_PAINT", "#faf8f5", 0.9, 0.0));
        }

        CostService.CostCalculationResult costRes = costService.recalculateSurfaceCosts(
                room, design.getStylePackage(), map, design.getTaxRatePercent() != null ? design.getTaxRatePercent().doubleValue() : 18.0);

        com.roommind.backend.dto.BomResponse bom = new com.roommind.backend.dto.BomResponse();
        bom.setDesignId(design.getId());
        bom.setVersionNumber(design.getVersionNumber());
        bom.setStylePackage(design.getStylePackage());
        bom.setRoomId(room.getId());
        bom.setRoomName(room.getName());
        bom.setSubtotalCostInr(design.getSubtotalCostInr());
        bom.setTaxRatePercent(design.getTaxRatePercent());
        bom.setTaxAmountInr(design.getTaxAmountInr());
        bom.setEstimatedTotalCostInr(design.getEstimatedTotalCostInr());
        bom.setSurfaceItems(costRes.surfaceCostBreakdown);
        bom.setCostDisclaimer(costRes.disclaimer);
        return bom;
    }
}

