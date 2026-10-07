package com.roommind.backend.dto;

import com.roommind.backend.entity.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CreateRoomRequest {

    @NotBlank(message = "Room name is required")
    private String name;

    @NotNull(message = "Room type is required")
    private RoomType type;

    @Positive(message = "Length must be greater than zero")
    private Double length;

    @Positive(message = "Width must be greater than zero")
    private Double width;

    @Positive(message = "Height must be greater than zero")
    private Double height;

    public CreateRoomRequest() {
    }

    public CreateRoomRequest(String name, RoomType type, Double length, Double width, Double height) {
        this.name = name;
        this.type = type;
        this.length = length;
        this.width = width;
        this.height = height;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RoomType getType() {
        return type;
    }

    public void setType(RoomType type) {
        this.type = type;
    }

    public Double getLength() {
        return length;
    }

    public void setLength(Double length) {
        this.length = length;
    }

    public Double getWidth() {
        return width;
    }

    public void setWidth(Double width) {
        this.width = width;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }
}
