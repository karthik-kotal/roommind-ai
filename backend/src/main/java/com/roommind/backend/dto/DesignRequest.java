package com.roommind.backend.dto;

import com.roommind.backend.entity.StylePackage;

public class DesignRequest {

    private StylePackage stylePackage = StylePackage.MODERN;
    private Double customTaxRatePercent = 18.0;

    @jakarta.validation.Valid
    private java.util.Map<String, SurfaceCustomizationDto> surfaceMap;

    public DesignRequest() {
    }

    public java.util.Map<String, SurfaceCustomizationDto> getSurfaceMap() {
        return surfaceMap;
    }

    public void setSurfaceMap(java.util.Map<String, SurfaceCustomizationDto> surfaceMap) {
        this.surfaceMap = surfaceMap;
    }

    public StylePackage getStylePackage() {
        return stylePackage;
    }

    public void setStylePackage(StylePackage stylePackage) {
        this.stylePackage = stylePackage;
    }

    public Double getCustomTaxRatePercent() {
        return customTaxRatePercent;
    }

    public void setCustomTaxRatePercent(Double customTaxRatePercent) {
        this.customTaxRatePercent = customTaxRatePercent;
    }
}
