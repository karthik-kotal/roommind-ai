package com.roommind.backend.dto;

import com.roommind.backend.entity.RoomScan;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class RoomScanResponse {

    private Long id;
    private Long roomId;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime completedAt;
    private List<ScanImageResponse> images;

    public RoomScanResponse() {
    }

    public RoomScanResponse(RoomScan scan) {
        this.id = scan.getId();
        this.roomId = scan.getRoom().getId();
        this.status = scan.getStatus().name();
        this.createdAt = scan.getCreatedAt();
        this.completedAt = scan.getCompletedAt();
        if (scan.getImages() != null) {
            this.images = scan.getImages().stream()
                    .map(ScanImageResponse::new)
                    .collect(Collectors.toList());
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public List<ScanImageResponse> getImages() {
        return images;
    }

    public void setImages(List<ScanImageResponse> images) {
        this.images = images;
    }
}
