package com.roommind.backend.dto;

public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private UserProfileResponse user;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, UserProfileResponse user) {
        this.accessToken = accessToken;
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserProfileResponse getUser() {
        return user;
    }

    public void setUser(UserProfileResponse user) {
        this.user = user;
    }
}
