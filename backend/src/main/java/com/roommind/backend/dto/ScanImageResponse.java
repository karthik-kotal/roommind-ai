package com.roommind.backend.dto;

import com.roommind.backend.entity.ScanImage;
import java.time.OffsetDateTime;

public class ScanImageResponse {

    private Long id;
    private String surfaceType;
    private String filePath;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private Double blurScore;
    private OffsetDateTime createdAt;

    public ScanImageResponse() {
    }

    public ScanImageResponse(ScanImage image) {
        this.id = image.getId();
        this.surfaceType = image.getSurfaceType().name();
        this.filePath = image.getFilePath();
        this.originalFilename = image.getOriginalFilename();
        this.contentType = image.getContentType();
        this.fileSize = image.getFileSize();
        this.width = image.getWidth();
        this.height = image.getHeight();
        this.blurScore = image.getBlurScore();
        this.createdAt = image.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSurfaceType() {
        return surfaceType;
    }

    public void setSurfaceType(String surfaceType) {
        this.surfaceType = surfaceType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Double getBlurScore() {
        return blurScore;
    }

    public void setBlurScore(Double blurScore) {
        this.blurScore = blurScore;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
