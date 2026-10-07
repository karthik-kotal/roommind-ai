package com.roommind.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "room_designs",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_room_design_version", columnNames = {"room_id", "version_number"})
    }
)
public class RoomDesign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "style_package", nullable = false)
    private StylePackage stylePackage;

    @Column(name = "wall_recommendations", nullable = false, columnDefinition = "TEXT")
    private String wallRecommendations = "{}";

    @Column(name = "compatibility_breakdown", nullable = false, columnDefinition = "TEXT")
    private String compatibilityBreakdown = "{}";

    @Column(name = "overall_compatibility_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal overallCompatibilityScore;

    @Column(name = "subtotal_cost_inr", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalCostInr;

    @Column(name = "tax_rate_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRatePercent;

    @Column(name = "tax_amount_inr", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmountInr;

    @Column(name = "estimated_total_cost_inr", nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedTotalCostInr;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber = 1;

    @Column(name = "is_favorite", nullable = false)
    private Boolean isFavorite = false;

    @Column(name = "parent_design_id")
    private Long parentDesignId;

    @Column(name = "surface_customization_map", nullable = false, columnDefinition = "TEXT")
    private String surfaceCustomizationMap = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public RoomDesign() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
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

    public String getSurfaceCustomizationMap() {
        return surfaceCustomizationMap;
    }

    public void setSurfaceCustomizationMap(String surfaceCustomizationMap) {
        this.surfaceCustomizationMap = surfaceCustomizationMap;
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

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public StylePackage getStylePackage() {
        return stylePackage;
    }

    public void setStylePackage(StylePackage stylePackage) {
        this.stylePackage = stylePackage;
    }

    public String getWallRecommendations() {
        return wallRecommendations;
    }

    public void setWallRecommendations(String wallRecommendations) {
        this.wallRecommendations = wallRecommendations;
    }

    public String getCompatibilityBreakdown() {
        return compatibilityBreakdown;
    }

    public void setCompatibilityBreakdown(String compatibilityBreakdown) {
        this.compatibilityBreakdown = compatibilityBreakdown;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
