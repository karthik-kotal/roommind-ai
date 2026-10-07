package com.roommind.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class RecalculationResponse {

    private BigDecimal overallCompatibilityScore;
    private String compatibilityBreakdownJson;
    private BigDecimal subtotalCostInr;
    private BigDecimal taxRatePercent;
    private BigDecimal taxAmountInr;
    private BigDecimal estimatedTotalCostInr;
    private List<SurfaceCostDetailDto> surfaceCostBreakdown;
    private String costDisclaimer = "Actual cost may vary depending on material, vendor, labor, location and applicable taxes.";

    public RecalculationResponse() {
    }

    public BigDecimal getOverallCompatibilityScore() {
        return overallCompatibilityScore;
    }

    public void setOverallCompatibilityScore(BigDecimal overallCompatibilityScore) {
        this.overallCompatibilityScore = overallCompatibilityScore;
    }

    public String getCompatibilityBreakdownJson() {
        return compatibilityBreakdownJson;
    }

    public void setCompatibilityBreakdownJson(String compatibilityBreakdownJson) {
        this.compatibilityBreakdownJson = compatibilityBreakdownJson;
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

    public List<SurfaceCostDetailDto> getSurfaceCostBreakdown() {
        return surfaceCostBreakdown;
    }

    public void setSurfaceCostBreakdown(List<SurfaceCostDetailDto> surfaceCostBreakdown) {
        this.surfaceCostBreakdown = surfaceCostBreakdown;
    }

    public String getCostDisclaimer() {
        return costDisclaimer;
    }

    public void setCostDisclaimer(String costDisclaimer) {
        this.costDisclaimer = costDisclaimer;
    }
}
