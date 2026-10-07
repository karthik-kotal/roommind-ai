package com.roommind.backend.dto;

import com.roommind.backend.entity.StylePackage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class RecalculationRequest {

    @NotNull(message = "Style package is required")
    private StylePackage stylePackage = StylePackage.MODERN;

    @Min(value = 0, message = "Tax rate cannot be negative")
    @Max(value = 50, message = "Tax rate cannot exceed 50%")
    private Double customTaxRatePercent = 18.0;

    @NotNull(message = "Surface map is required")
    @Valid
    private Map<String, SurfaceCustomizationDto> surfaceMap;

    public RecalculationRequest() {
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

    public Map<String, SurfaceCustomizationDto> getSurfaceMap() {
        return surfaceMap;
    }

    public void setSurfaceMap(Map<String, SurfaceCustomizationDto> surfaceMap) {
        this.surfaceMap = surfaceMap;
    }
}
