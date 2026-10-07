package com.roommind.backend.controller;

import com.roommind.backend.dto.CreateRoomRequest;
import com.roommind.backend.dto.RoomResponse;
import com.roommind.backend.dto.RoomScanResponse;
import com.roommind.backend.service.RoomService;
import com.roommind.backend.service.ScanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@Tag(name = "Rooms", description = "Endpoints for managing user rooms and creating room scans")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomService roomService;
    private final ScanService scanService;

    public RoomController(RoomService roomService, ScanService scanService) {
        this.roomService = roomService;
        this.scanService = scanService;
    }

    @PostMapping
    @Operation(summary = "Create a new room", description = "Creates a room for the authenticated user with optional length, width, height dimensions")
    public ResponseEntity<RoomResponse> createRoom(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateRoomRequest request) {
        RoomResponse response = roomService.createRoom(userDetails.getUsername(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get user rooms", description = "Returns all rooms belonging to the authenticated user")
    public ResponseEntity<List<RoomResponse>> getUserRooms(@AuthenticationPrincipal UserDetails userDetails) {
        List<RoomResponse> response = roomService.getUserRooms(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get room by ID", description = "Returns room details for the specified ID if owned by user")
    public ResponseEntity<RoomResponse> getRoomById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        RoomResponse response = roomService.getRoomById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete room by ID", description = "Deletes specified room and all associated scans if owned by user")
    public ResponseEntity<Void> deleteRoom(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        roomService.deleteRoom(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roomId}/scans")
    @Operation(summary = "Create a new room scan", description = "Starts a room scanning workflow for the specified room")
    public ResponseEntity<RoomScanResponse> createScan(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("roomId") Long roomId) {
        RoomScanResponse response = scanService.createScan(userDetails.getUsername(), roomId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
