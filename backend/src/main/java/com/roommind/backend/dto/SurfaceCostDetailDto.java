package com.roommind.backend.dto;

import java.math.BigDecimal;

public class SurfaceCostDetailDto {

    private String surfaceKey;
    private BigDecimal areaSqFt;
    private BigDecimal materialCostInr;
    private BigDecimal laborCostInr;
    private BigDecimal totalSurfaceCostInr;

    public SurfaceCostDetailDto() {
    }

    public SurfaceCostDetailDto(String surfaceKey, BigDecimal areaSqFt, BigDecimal materialCostInr, BigDecimal laborCostInr, BigDecimal totalSurfaceCostInr) {
        this.surfaceKey = surfaceKey;
        this.areaSqFt = areaSqFt;
        this.materialCostInr = materialCostInr;
        this.laborCostInr = laborCostInr;
        this.totalSurfaceCostInr = totalSurfaceCostInr;
    }

    public String getSurfaceKey() {
        return surfaceKey;
    }

    public void setSurfaceKey(String surfaceKey) {
        this.surfaceKey = surfaceKey;
    }

    public BigDecimal getAreaSqFt() {
        return areaSqFt;
    }

    public void setAreaSqFt(BigDecimal areaSqFt) {
        this.areaSqFt = areaSqFt;
    }

    public BigDecimal getMaterialCostInr() {
        return materialCostInr;
    }

    public void setMaterialCostInr(BigDecimal materialCostInr) {
        this.materialCostInr = materialCostInr;
    }

    public BigDecimal getLaborCostInr() {
        return laborCostInr;
    }

    public void setLaborCostInr(BigDecimal laborCostInr) {
        this.laborCostInr = laborCostInr;
    }

    public BigDecimal getTotalSurfaceCostInr() {
        return totalSurfaceCostInr;
    }

    public void setTotalSurfaceCostInr(BigDecimal totalSurfaceCostInr) {
        this.totalSurfaceCostInr = totalSurfaceCostInr;
    }
}
