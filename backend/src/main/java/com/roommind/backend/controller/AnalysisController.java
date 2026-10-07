package com.roommind.backend.controller;

import com.roommind.backend.dto.AnalysisResponse;
import com.roommind.backend.entity.RoomAnalysis;
import com.roommind.backend.service.AnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scans")
@Tag(name = "Room Scans & AI Analysis", description = "Endpoints for AI surface vision analysis")
@SecurityRequirement(name = "bearerAuth")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/{scanId}/analyze")
    @Operation(summary = "Analyze room scan", description = "Executes computer vision surface analysis on captured room images")
    public ResponseEntity<AnalysisResponse> analyzeScan(
            @PathVariable Long scanId,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoomAnalysis analysis = analysisService.analyzeRoomScan(userDetails.getUsername(), scanId);
        return ResponseEntity.ok(mapToResponse(analysis));
    }

    @GetMapping("/{scanId}/analysis")
    @Operation(summary = "Get scan analysis", description = "Retrieves previously generated computer vision analysis for a room scan")
    public ResponseEntity<AnalysisResponse> getAnalysis(
            @PathVariable Long scanId,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoomAnalysis analysis = analysisService.getAnalysisByScanId(userDetails.getUsername(), scanId);
        return ResponseEntity.ok(mapToResponse(analysis));
    }

    private AnalysisResponse mapToResponse(RoomAnalysis analysis) {
        AnalysisResponse res = new AnalysisResponse();
        res.setId(analysis.getId());
        res.setRoomScanId(analysis.getRoomScan().getId());
        res.setDetectedWallCategory(analysis.getDetectedWallCategory());
        res.setWallModelScore(analysis.getWallModelScore());
        res.setDetectedFloorCategory(analysis.getDetectedFloorCategory());
        res.setFloorModelScore(analysis.getFloorModelScore());
        res.setOpeningsDetectedJson(analysis.getOpeningsDetected());
        res.setFurnitureDetectedJson(analysis.getFurnitureDetected());
        res.setAnalysisSource(analysis.getAnalysisSource());
        res.setRawVisionOutputJson(analysis.getRawVisionOutput());
        res.setCreatedAt(analysis.getCreatedAt());
        return res;
    }
}
