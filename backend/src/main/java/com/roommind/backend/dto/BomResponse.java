package com.roommind.backend.dto;

import com.roommind.backend.entity.StylePackage;
import java.math.BigDecimal;
import java.util.List;

public class BomResponse {

    private Long designId;
    private Integer versionNumber;
    private StylePackage stylePackage;
    private Long roomId;
    private String roomName;
    private BigDecimal subtotalCostInr;
    private BigDecimal taxRatePercent;
    private BigDecimal taxAmountInr;
    private BigDecimal estimatedTotalCostInr;
    private List<SurfaceCostDetailDto> surfaceItems;
    private String costDisclaimer = "Actual cost may vary depending on material, vendor, labor, location and applicable taxes.";

    public BomResponse() {
    }

    public Long getDesignId() {
        return designId;
    }

    public void setDesignId(Long designId) {
        this.designId = designId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public StylePackage getStylePackage() {
        return stylePackage;
    }

    public void setStylePackage(StylePackage stylePackage) {
        this.stylePackage = stylePackage;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
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

    public List<SurfaceCostDetailDto> getSurfaceItems() {
        return surfaceItems;
    }

    public void setSurfaceItems(List<SurfaceCostDetailDto> surfaceItems) {
        this.surfaceItems = surfaceItems;
    }

    public String getCostDisclaimer() {
        return costDisclaimer;
    }

    public void setCostDisclaimer(String costDisclaimer) {
        this.costDisclaimer = costDisclaimer;
    }
}
