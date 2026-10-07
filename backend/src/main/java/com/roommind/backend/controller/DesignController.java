package com.roommind.backend.controller;

import com.roommind.backend.dto.DesignRequest;
import com.roommind.backend.dto.DesignResponse;
import com.roommind.backend.dto.RecalculationRequest;
import com.roommind.backend.dto.RecalculationResponse;
import com.roommind.backend.entity.RoomDesign;
import com.roommind.backend.service.DesignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import com.roommind.backend.dto.BomResponse;
import com.roommind.backend.dto.FeedbackAnalyticsResponse;
import com.roommind.backend.dto.FeedbackRequest;
import com.roommind.backend.dto.FeedbackResponse;
import com.roommind.backend.service.FeedbackService;
import com.roommind.backend.service.PdfReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/rooms")
@Tag(name = "Room Designs & Recommendations", description = "Endpoints for generating and fetching room design packages and INR cost estimates")
@SecurityRequirement(name = "bearerAuth")
public class DesignController {

    private final DesignService designService;
    private final PdfReportService pdfReportService;
    private final FeedbackService feedbackService;

    public DesignController(
            DesignService designService,
            PdfReportService pdfReportService,
            FeedbackService feedbackService) {
        this.designService = designService;
        this.pdfReportService = pdfReportService;
        this.feedbackService = feedbackService;
    }

    @PostMapping("/{roomId}/designs")
    @Operation(summary = "Save room design version", description = "Persists a new design snapshot version with style package, surface customization map, compatibility breakdown, and cost estimation")
    public ResponseEntity<DesignResponse> createDesign(
            @PathVariable Long roomId,
            @Valid @RequestBody(required = false) DesignRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        DesignRequest req = (request != null) ? request : new DesignRequest();
        RoomDesign design = designService.createSavedDesign(
                userDetails.getUsername(), roomId, req.getStylePackage(), req.getCustomTaxRatePercent(), req.getSurfaceMap());

        return ResponseEntity.ok(mapToResponse(design));
    }

    @PostMapping("/{roomId}/designs/recalculate")
    @Operation(summary = "Recalculate design transiently", description = "Executes transient in-memory recalculation of room surface costs, tax, and compatibility without saving to database")
    public ResponseEntity<RecalculationResponse> recalculateDesign(
            @PathVariable Long roomId,
            @Valid @RequestBody RecalculationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        RecalculationResponse response = designService.recalculateDesign(
                userDetails.getUsername(), roomId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomId}/designs")
    @Operation(summary = "Get room design history", description = "Retrieves all saved design versions for specified room ordered newest version first")
    public ResponseEntity<List<DesignResponse>> getRoomDesigns(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<RoomDesign> designs = designService.getDesignsByRoomId(userDetails.getUsername(), roomId);
        List<DesignResponse> res = designs.stream().map(this::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{roomId}/designs/{designId}")
    @Operation(summary = "Get design version by ID", description = "Retrieves specific saved design version details by ID")
    public ResponseEntity<DesignResponse> getDesignById(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoomDesign design = designService.getDesignById(userDetails.getUsername(), roomId, designId);
        return ResponseEntity.ok(mapToResponse(design));
    }

    @PostMapping("/{roomId}/designs/{designId}/restore")
    @Operation(summary = "Restore design version", description = "Creates a NEW saved version copying configuration from historical design snapshot without modifying the historical version")
    public ResponseEntity<DesignResponse> restoreDesign(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoomDesign restored = designService.restoreDesign(userDetails.getUsername(), roomId, designId);
        return ResponseEntity.ok(mapToResponse(restored));
    }

    @PostMapping("/{roomId}/designs/{designId}/clone")
    @Operation(summary = "Clone design version", description = "Creates a NEW editable design version snapshot cloning the specified design version")
    public ResponseEntity<DesignResponse> cloneDesign(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoomDesign cloned = designService.cloneDesign(userDetails.getUsername(), roomId, designId);
        return ResponseEntity.ok(mapToResponse(cloned));
    }


    @PutMapping("/{roomId}/designs/{designId}/favorite")
    @Operation(summary = "Favorite / unfavorite design", description = "Toggles or updates the favorite status of a saved design version without creating a new version")
    public ResponseEntity<DesignResponse> favoriteDesign(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @Valid @RequestBody com.roommind.backend.dto.FavoriteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoomDesign updated = designService.favoriteDesign(
                userDetails.getUsername(), roomId, designId, request.getFavorite());
        return ResponseEntity.ok(mapToResponse(updated));
    }

    @GetMapping("/{roomId}/designs/{designId}/bom")
    @Operation(summary = "Get Bill of Materials (BOM)", description = "Generates itemized Bill of Materials (BOM) for specified saved design snapshot using Phase 5B authoritative rates")
    public ResponseEntity<BomResponse> getBom(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) {

        BomResponse bom = designService.getBomResponse(userDetails.getUsername(), roomId, designId);
        return ResponseEntity.ok(bom);
    }

    @GetMapping("/{roomId}/designs/{designId}/report")
    @Operation(summary = "Download PDF Design Report", description = "Generates and streams a PDF design report representing the specified saved design snapshot version")
    public ResponseEntity<byte[]> getPdfReport(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) throws java.io.IOException {

        RoomDesign design = designService.getDesignById(userDetails.getUsername(), roomId, designId);
        BomResponse bom = designService.getBomResponse(userDetails.getUsername(), roomId, designId);

        byte[] pdfBytes = pdfReportService.generateDesignReportPdf(design, bom);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "roommind-design-v" + design.getVersionNumber() + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @PostMapping("/{roomId}/designs/{designId}/feedback")
    @Operation(summary = "Submit human feedback", description = "Submits or updates 1–5 star rating and optional comment feedback for a saved design version")
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        FeedbackResponse res = feedbackService.submitFeedback(
                userDetails.getUsername(), roomId, designId, request);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{roomId}/designs/{designId}/feedback")
    @Operation(summary = "Get feedback list", description = "Retrieves human feedback submitted for specified saved design version")
    public ResponseEntity<List<FeedbackResponse>> getFeedback(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<FeedbackResponse> list = feedbackService.getFeedbackByDesignId(
                userDetails.getUsername(), roomId, designId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{roomId}/designs/{designId}/feedback/analytics")
    @Operation(summary = "Get feedback analytics", description = "Retrieves aggregate rating and feedback count for specified saved design version")
    public ResponseEntity<FeedbackAnalyticsResponse> getFeedbackAnalytics(
            @PathVariable Long roomId,
            @PathVariable Long designId,
            @AuthenticationPrincipal UserDetails userDetails) {

        FeedbackAnalyticsResponse analytics = feedbackService.getFeedbackAnalytics(
                userDetails.getUsername(), roomId, designId);
        return ResponseEntity.ok(analytics);
    }

    private DesignResponse mapToResponse(RoomDesign design) {
        DesignResponse res = new DesignResponse();
        res.setId(design.getId());
        res.setRoomId(design.getRoom().getId());
        res.setStylePackage(design.getStylePackage());
        res.setWallRecommendationsJson(design.getWallRecommendations());
        res.setCompatibilityBreakdownJson(design.getCompatibilityBreakdown());
        res.setOverallCompatibilityScore(design.getOverallCompatibilityScore());
        res.setSubtotalCostInr(design.getSubtotalCostInr());
        res.setTaxRatePercent(design.getTaxRatePercent());
        res.setTaxAmountInr(design.getTaxAmountInr());
        res.setEstimatedTotalCostInr(design.getEstimatedTotalCostInr());
        res.setVersionNumber(design.getVersionNumber());
        res.setIsFavorite(design.getIsFavorite());
        res.setParentDesignId(design.getParentDesignId());
        res.setSurfaceCustomizationMapJson(design.getSurfaceCustomizationMap());
        res.setCostDisclaimer("Actual cost may vary depending on material, vendor, labor, location and applicable taxes.");
        res.setCreatedAt(design.getCreatedAt());
        res.setUpdatedAt(design.getUpdatedAt());
        return res;
    }
}

