package com.roommind.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.CreateRoomRequest;
import com.roommind.backend.dto.RegisterRequest;
import com.roommind.backend.entity.RoomType;
import com.roommind.backend.entity.SurfaceType;
import com.roommind.backend.repository.RoomRepository;
import com.roommind.backend.repository.RoomScanRepository;
import com.roommind.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
public class RoomAndScanIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomScanRepository scanRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String userAToken;
    private String userBToken;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();

        // User A
        RegisterRequest regA = new RegisterRequest("usera@roommind.ai", "Pass1234!", "User A");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regA)))
                .andReturn();
        userAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).get("accessToken").asText();

        // User B
        RegisterRequest regB = new RegisterRequest("userb@roommind.ai", "Pass1234!", "User B");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regB)))
                .andReturn();
        userBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @DisplayName("Create room & verify persistence and optional dimensions")
    void testCreateRoom() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest("Master Bedroom", RoomType.BEDROOM, 16.0, 20.0, 10.0);

        mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Master Bedroom")))
                .andExpect(jsonPath("$.type", is("BEDROOM")))
                .andExpect(jsonPath("$.length", is(16.0)))
                .andExpect(jsonPath("$.width", is(20.0)))
                .andExpect(jsonPath("$.height", is(10.0)));
    }

    @Test
    @DisplayName("User A cannot access User B's room")
    void testUserIsolation() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest("User A Studio", RoomType.OFFICE, null, null, null);
        MvcResult roomRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        long roomId = objectMapper.readTree(roomRes.getResponse().getContentAsString()).get("id").asLong();

        // User B attempts to access User A's room
        mockMvc.perform(get("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Room Scan creation, surface image upload & completion workflow")
    void testScanWorkflowAndImageUpload() throws Exception {
        CreateRoomRequest roomReq = new CreateRoomRequest("Living Room", RoomType.LIVING_ROOM, 15.0, 18.0, 9.0);
        MvcResult roomRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andReturn();
        long roomId = objectMapper.readTree(roomRes.getResponse().getContentAsString()).get("id").asLong();

        // 1. Create Scan
        MvcResult scanRes = mockMvc.perform(post("/api/rooms/" + roomId + "/scans")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("CREATED")))
                .andReturn();
        long scanId = objectMapper.readTree(scanRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Upload Surface Images (WALL_1..4, FLOOR, CEILING)
        SurfaceType[] surfaces = SurfaceType.values();
        for (int i = 0; i < surfaces.length; i++) {
            SurfaceType surface = surfaces[i];
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    surface.name().toLowerCase() + ".jpg",
                    "image/jpeg",
                    ("Dummy image content for " + surface).getBytes()
            );

            mockMvc.perform(multipart("/api/scans/" + scanId + "/images")
                            .file(file)
                            .param("surfaceType", surface.name())
                            .header("Authorization", "Bearer " + userAToken))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.surfaceType", is(surface.name())));
        }

        // 3. Verify Scan status is now COMPLETED
        mockMvc.perform(get("/api/scans/" + scanId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.images", hasSize(6)));
    }

    @Test
    @DisplayName("Invalid image content type is rejected (HTTP 400 Bad Request)")
    void testInvalidImageUploadRejected() throws Exception {
        CreateRoomRequest roomReq = new CreateRoomRequest("Office", RoomType.OFFICE, null, null, null);
        MvcResult roomRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andReturn();
        long roomId = objectMapper.readTree(roomRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult scanRes = mockMvc.perform(post("/api/rooms/" + roomId + "/scans")
                        .header("Authorization", "Bearer " + userAToken))
                .andReturn();
        long scanId = objectMapper.readTree(scanRes.getResponse().getContentAsString()).get("id").asLong();

        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "script.sh",
                "application/x-sh",
                "echo hello".getBytes()
        );

        mockMvc.perform(multipart("/api/scans/" + scanId + "/images")
                        .file(textFile)
                        .param("surfaceType", "WALL_1")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid image content type")));
    }
}
