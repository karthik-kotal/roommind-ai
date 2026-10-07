package com.roommind.backend.dto;

public class FeedbackAnalyticsResponse {

    private Long designId;
    private Double averageRating;
    private Long totalFeedbackCount;

    public FeedbackAnalyticsResponse() {
    }

    public FeedbackAnalyticsResponse(Long designId, Double averageRating, Long totalFeedbackCount) {
        this.designId = designId;
        this.averageRating = averageRating;
        this.totalFeedbackCount = totalFeedbackCount;
    }

    public Long getDesignId() {
        return designId;
    }

    public void setDesignId(Long designId) {
        this.designId = designId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalFeedbackCount() {
        return totalFeedbackCount;
    }

    public void setTotalFeedbackCount(Long totalFeedbackCount) {
        this.totalFeedbackCount = totalFeedbackCount;
    }
}
