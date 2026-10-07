package com.roommind.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "room_analyses")
public class RoomAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_scan_id", nullable = false)
    private RoomScan roomScan;

    @Column(name = "detected_wall_category", nullable = false)
    private String detectedWallCategory;

    @Column(name = "wall_model_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal wallModelScore;

    @Column(name = "detected_floor_category", nullable = false)
    private String detectedFloorCategory;

    @Column(name = "floor_model_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal floorModelScore;

    @Column(name = "openings_detected", nullable = false, columnDefinition = "TEXT")
    private String openingsDetected = "[]";

    @Column(name = "furniture_detected", nullable = false, columnDefinition = "TEXT")
    private String furnitureDetected = "[]";

    @Column(name = "analysis_source", nullable = false)
    private String analysisSource = "PRETRAINED_CV";

    @Column(name = "raw_vision_output", nullable = false, columnDefinition = "TEXT")
    private String rawVisionOutput = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public RoomAnalysis() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RoomScan getRoomScan() {
        return roomScan;
    }

    public void setRoomScan(RoomScan roomScan) {
        this.roomScan = roomScan;
    }

    public String getDetectedWallCategory() {
        return detectedWallCategory;
    }

    public void setDetectedWallCategory(String detectedWallCategory) {
        this.detectedWallCategory = detectedWallCategory;
    }

    public BigDecimal getWallModelScore() {
        return wallModelScore;
    }

    public void setWallModelScore(BigDecimal wallModelScore) {
        this.wallModelScore = wallModelScore;
    }

    public String getDetectedFloorCategory() {
        return detectedFloorCategory;
    }

    public void setDetectedFloorCategory(String detectedFloorCategory) {
        this.detectedFloorCategory = detectedFloorCategory;
    }

    public BigDecimal getFloorModelScore() {
        return floorModelScore;
    }

    public void setFloorModelScore(BigDecimal floorModelScore) {
        this.floorModelScore = floorModelScore;
    }

    public String getOpeningsDetected() {
        return openingsDetected;
    }

    public void setOpeningsDetected(String openingsDetected) {
        this.openingsDetected = openingsDetected;
    }

    public String getFurnitureDetected() {
        return furnitureDetected;
    }

    public void setFurnitureDetected(String furnitureDetected) {
        this.furnitureDetected = furnitureDetected;
    }

    public String getAnalysisSource() {
        return analysisSource;
    }

    public void setAnalysisSource(String analysisSource) {
        this.analysisSource = analysisSource;
    }

    public String getRawVisionOutput() {
        return rawVisionOutput;
    }

    public void setRawVisionOutput(String rawVisionOutput) {
        this.rawVisionOutput = rawVisionOutput;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
