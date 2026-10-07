package com.roommind.backend.controller;

import com.roommind.backend.dto.RoomScanResponse;
import com.roommind.backend.dto.ScanImageResponse;
import com.roommind.backend.entity.SurfaceType;
import com.roommind.backend.service.ScanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/scans")
@Tag(name = "Room Scans", description = "Endpoints for checking scan status and uploading surface images")
@SecurityRequirement(name = "bearerAuth")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    @GetMapping("/{scanId}")
    @Operation(summary = "Get scan by ID", description = "Returns scan status and uploaded surface images for the specified scan ID")
    public ResponseEntity<RoomScanResponse> getScanById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("scanId") Long scanId) {
        RoomScanResponse response = scanService.getScanById(userDetails.getUsername(), scanId);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{scanId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload surface image", description = "Uploads an image frame for a specific surface (WALL_1..4, FLOOR, CEILING)")
    public ResponseEntity<ScanImageResponse> uploadScanImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("scanId") Long scanId,
            @RequestParam("surfaceType") SurfaceType surfaceType,
            @RequestParam("file") MultipartFile file) {
        ScanImageResponse response = scanService.uploadScanImage(userDetails.getUsername(), scanId, surfaceType, file);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
