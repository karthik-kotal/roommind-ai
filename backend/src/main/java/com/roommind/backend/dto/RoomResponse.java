package com.roommind.backend.dto;

import com.roommind.backend.entity.Room;
import java.time.OffsetDateTime;

public class RoomResponse {

    private Long id;
    private Long userId;
    private String name;
    private String type;
    private Double length;
    private Double width;
    private Double height;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private int scanCount;

    public RoomResponse() {
    }

    public RoomResponse(Room room) {
        this.id = room.getId();
        this.userId = room.getUserId();
        this.name = room.getName();
        this.type = room.getType().name();
        this.length = room.getLength();
        this.width = room.getWidth();
        this.height = room.getHeight();
        this.createdAt = room.getCreatedAt();
        this.updatedAt = room.getUpdatedAt();
        this.scanCount = room.getScans() != null ? room.getScans().size() : 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getScanCount() {
        return scanCount;
    }

    public void setScanCount(int scanCount) {
        this.scanCount = scanCount;
    }
}
