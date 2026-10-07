package com.roommind.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.LoginRequest;
import com.roommind.backend.dto.RegisterRequest;
import com.roommind.backend.dto.UpdateProfileRequest;
import com.roommind.backend.entity.User;
import com.roommind.backend.repository.UserRepository;
import com.roommind.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1 & 2. Register user & verify password is BCrypt hashed in DB")
    void testRegisterUserAndPasswordHashed() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("testuser@roommind.ai", "Secret123!", "Test User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("testuser@roommind.ai")))
                .andExpect(jsonPath("$.user.fullName", is("Test User")))
                .andExpect(jsonPath("$.user.password").doesNotExist()); // Requirement 10

        User savedUser = userRepository.findByEmail("testuser@roommind.ai").orElseThrow();
        assertNotEquals("Secret123!", savedUser.getPassword());
        assertTrue(passwordEncoder.matches("Secret123!", savedUser.getPassword()));
    }

    @Test
    @DisplayName("3. Login returns valid JWT token")
    void testLoginReturnsJwt() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("login@roommind.ai", "Password123!", "Login User");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        LoginRequest loginRequest = new LoginRequest("login@roommind.ai", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("login@roommind.ai")))
                .andExpect(jsonPath("$.user.password").doesNotExist()); // Requirement 10
    }

    @Test
    @DisplayName("4. Protected endpoint rejects unauthenticated requests (HTTP 401)")
    void testUnauthenticatedRequestRejected() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. Protected endpoint accepts valid JWT (HTTP 200)")
    void testAuthenticatedRequestAccepted() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("protected@roommind.ai", "Pass1234!", "Protected User");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn();

        String token = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("protected@roommind.ai")))
                .andExpect(jsonPath("$.fullName", is("Protected User")))
                .andExpect(jsonPath("$.password").doesNotExist()); // Requirement 10
    }

    @Test
    @DisplayName("6. Invalid JWT is rejected (HTTP 401)")
    void testInvalidJwtRejected() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer invalid.jwt.token.string"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("7. Duplicate email registration is rejected (HTTP 409 Conflict)")
    void testDuplicateEmailRejected() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("dup@roommind.ai", "Pass1234!", "User One");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        RegisterRequest duplicateRequest = new RegisterRequest("dup@roommind.ai", "OtherPass!", "User Two");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("8. Invalid input is rejected (HTTP 400 Bad Request)")
    void testInvalidInputRejected() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("invalid-email", "123", "");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details", notNullValue()));
    }

    @Test
    @DisplayName("9. User can update profile (PUT /api/users/me)")
    void testUpdateUserProfile() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("update@roommind.ai", "Pass1234!", "Original Name");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn();

        String token = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        UpdateProfileRequest updateRequest = new UpdateProfileRequest("Updated Name", "+919876543210", "AI Architect & Spatial Enthusiast");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("Updated Name")))
                .andExpect(jsonPath("$.phone", is("+919876543210")))
                .andExpect(jsonPath("$.bio", is("AI Architect & Spatial Enthusiast")))
                .andExpect(jsonPath("$.password").doesNotExist()); // Requirement 10
    }
}
