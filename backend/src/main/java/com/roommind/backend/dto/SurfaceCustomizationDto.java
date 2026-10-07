package com.roommind.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class SurfaceCustomizationDto {

    @NotBlank(message = "Material preset is required")
    private String materialPreset;

    @NotBlank(message = "Color hex string is required")
    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Color must be a valid 6-digit hex string (e.g. #f8fafc)")
    private String color;

    @NotNull(message = "Roughness is required")
    @Min(value = 0, message = "Roughness cannot be less than 0.0")
    @Max(value = 1, message = "Roughness cannot be greater than 1.0")
    private Double roughness;

    @NotNull(message = "Metalness is required")
    @Min(value = 0, message = "Metalness cannot be less than 0.0")
    @Max(value = 1, message = "Metalness cannot be greater than 1.0")
    private Double metalness;

    public SurfaceCustomizationDto() {
    }

    public SurfaceCustomizationDto(String materialPreset, String color, Double roughness, Double metalness) {
        this.materialPreset = materialPreset;
        this.color = color;
        this.roughness = roughness;
        this.metalness = metalness;
    }

    public String getMaterialPreset() {
        return materialPreset;
    }

    public void setMaterialPreset(String materialPreset) {
        this.materialPreset = materialPreset;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Double getRoughness() {
        return roughness;
    }

    public void setRoughness(Double roughness) {
        this.roughness = roughness;
    }

    public Double getMetalness() {
        return metalness;
    }

    public void setMetalness(Double metalness) {
        this.metalness = metalness;
    }
}
