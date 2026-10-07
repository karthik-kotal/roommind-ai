package com.roommind.backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class AnalysisResponse {

    private Long id;
    private Long roomScanId;
    private String detectedWallCategory;
    private BigDecimal wallModelScore;
    private String detectedFloorCategory;
    private BigDecimal floorModelScore;
    private String openingsDetectedJson;
    private String furnitureDetectedJson;
    private String analysisSource;
    private String rawVisionOutputJson;
    private OffsetDateTime createdAt;

    public AnalysisResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomScanId() {
        return roomScanId;
    }

    public void setRoomScanId(Long roomScanId) {
        this.roomScanId = roomScanId;
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

    public String getOpeningsDetectedJson() {
        return openingsDetectedJson;
    }

    public void setOpeningsDetectedJson(String openingsDetectedJson) {
        this.openingsDetectedJson = openingsDetectedJson;
    }

    public String getFurnitureDetectedJson() {
        return furnitureDetectedJson;
    }

    public void setFurnitureDetectedJson(String furnitureDetectedJson) {
        this.furnitureDetectedJson = furnitureDetectedJson;
    }

    public String getAnalysisSource() {
        return analysisSource;
    }

    public void setAnalysisSource(String analysisSource) {
        this.analysisSource = analysisSource;
    }

    public String getRawVisionOutputJson() {
        return rawVisionOutputJson;
    }

    public void setRawVisionOutputJson(String rawVisionOutputJson) {
        this.rawVisionOutputJson = rawVisionOutputJson;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
