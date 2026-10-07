package com.roommind.backend.dto;

import com.roommind.backend.entity.StylePackage;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class DesignResponse {

    private Long id;
    private Long roomId;
    private StylePackage stylePackage;
    private String wallRecommendationsJson;
    private String compatibilityBreakdownJson;
    private BigDecimal overallCompatibilityScore;
    private BigDecimal subtotalCostInr;
    private BigDecimal taxRatePercent;
    private BigDecimal taxAmountInr;
    private BigDecimal estimatedTotalCostInr;
    private String costDisclaimer = "Actual cost may vary depending on material, vendor, labor, location and applicable taxes.";
    private Integer versionNumber = 1;
    private Boolean isFavorite = false;
    private Long parentDesignId;
    private String surfaceCustomizationMapJson;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public DesignResponse() {
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public Boolean getIsFavorite() {
        return isFavorite;
    }

    public void setIsFavorite(Boolean favorite) {
        isFavorite = favorite;
    }

    public Long getParentDesignId() {
        return parentDesignId;
    }

    public void setParentDesignId(Long parentDesignId) {
        this.parentDesignId = parentDesignId;
    }

    public String getSurfaceCustomizationMapJson() {
        return surfaceCustomizationMapJson;
    }

    public void setSurfaceCustomizationMapJson(String surfaceCustomizationMapJson) {
        this.surfaceCustomizationMapJson = surfaceCustomizationMapJson;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
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

    public StylePackage getStylePackage() {
        return stylePackage;
    }

    public void setStylePackage(StylePackage stylePackage) {
        this.stylePackage = stylePackage;
    }

    public String getWallRecommendationsJson() {
        return wallRecommendationsJson;
    }

    public void setWallRecommendationsJson(String wallRecommendationsJson) {
        this.wallRecommendationsJson = wallRecommendationsJson;
    }

    public String getCompatibilityBreakdownJson() {
        return compatibilityBreakdownJson;
    }

    public void setCompatibilityBreakdownJson(String compatibilityBreakdownJson) {
        this.compatibilityBreakdownJson = compatibilityBreakdownJson;
    }

    public BigDecimal getOverallCompatibilityScore() {
        return overallCompatibilityScore;
    }

    public void setOverallCompatibilityScore(BigDecimal overallCompatibilityScore) {
        this.overallCompatibilityScore = overallCompatibilityScore;
    }

    public BigDecimal getSubtotalCostInr() {
        return subtotalCostInr;
    }

    public void setSubtotalCostInr(BigDecimal subtotalCostInr) {
        this.subtotalCostInr = subtotalCostInr;
    }

    public BigDecimal getTaxRatePercent() {
        return taxRatePercent;
    }

    public void setTaxRatePercent(BigDecimal taxRatePercent) {
        this.taxRatePercent = taxRatePercent;
    }

    public BigDecimal getTaxAmountInr() {
        return taxAmountInr;
    }

    public void setTaxAmountInr(BigDecimal taxAmountInr) {
        this.taxAmountInr = taxAmountInr;
    }

    public BigDecimal getEstimatedTotalCostInr() {
        return estimatedTotalCostInr;
    }

    public void setEstimatedTotalCostInr(BigDecimal estimatedTotalCostInr) {
        this.estimatedTotalCostInr = estimatedTotalCostInr;
    }

    public String getCostDisclaimer() {
        return costDisclaimer;
    }

    public void setCostDisclaimer(String costDisclaimer) {
        this.costDisclaimer = costDisclaimer;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
