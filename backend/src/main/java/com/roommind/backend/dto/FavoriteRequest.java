package com.roommind.backend.dto;

import jakarta.validation.constraints.NotNull;

public class FavoriteRequest {

    @NotNull(message = "Favorite status is required")
    private Boolean favorite;

    public FavoriteRequest() {
    }

    public FavoriteRequest(Boolean favorite) {
        this.favorite = favorite;
    }

    public Boolean getFavorite() {
        return favorite;
    }

    public void setFavorite(Boolean favorite) {
        this.favorite = favorite;
    }
}
