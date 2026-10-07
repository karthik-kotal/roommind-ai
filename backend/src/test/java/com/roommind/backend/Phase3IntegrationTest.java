package com.roommind.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.*;
import com.roommind.backend.entity.StylePackage;
import com.roommind.backend.entity.SurfaceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase3IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userAToken;
    private String userBToken;
    private Long roomAId;
    private Long scanAId;

    @BeforeEach
    void setUp() throws Exception {
        // Register User A
        RegisterRequest regA = new RegisterRequest();
        regA.setEmail("phase3userA@example.com");
        regA.setPassword("Password123!");
        regA.setFullName("Phase3 User A");

        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authA = objectMapper.readValue(resA.getResponse().getContentAsString(), AuthResponse.class);
        userAToken = authA.getAccessToken();

        // Register User B
        RegisterRequest regB = new RegisterRequest();
        regB.setEmail("phase3userB@example.com");
        regB.setPassword("Password123!");
        regB.setFullName("Phase3 User B");

        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authB = objectMapper.readValue(resB.getResponse().getContentAsString(), AuthResponse.class);
        userBToken = authB.getAccessToken();

        // User A creates Room
        CreateRoomRequest roomReq = new CreateRoomRequest();
        roomReq.setName("Phase3 Living Room");
        roomReq.setType(com.roommind.backend.entity.RoomType.LIVING_ROOM);
        roomReq.setLength(5.0);
        roomReq.setWidth(4.0);
        roomReq.setHeight(3.0);

        MvcResult roomRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated())
                .andReturn();

        RoomResponse roomObj = objectMapper.readValue(roomRes.getResponse().getContentAsString(), RoomResponse.class);
        roomAId = roomObj.getId();

        // User A creates Scan
        MvcResult scanRes = mockMvc.perform(post("/api/rooms/" + roomAId + "/scans")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isCreated())
                .andReturn();

        RoomScanResponse scanObj = objectMapper.readValue(scanRes.getResponse().getContentAsString(), RoomScanResponse.class);
        scanAId = scanObj.getId();

        // User A uploads surface image
        MockMultipartFile imageFile = new MockMultipartFile(
                "file", "wall1.jpg", "image/jpeg", new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10});

        mockMvc.perform(multipart("/api/scans/" + scanAId + "/images")
                        .file(imageFile)
                        .param("surfaceType", "WALL_1")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isCreated());
    }

    @Test
    void testPhase3RealAnalysisAndDesignFlow() throws Exception {
        // 1. User A triggers scan analysis
        MvcResult analyzeRes = mockMvc.perform(post("/api/scans/" + scanAId + "/analyze")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.detectedWallCategory").exists())
                .andExpect(jsonPath("$.wallModelScore").exists())
                .andExpect(jsonPath("$.detectedFloorCategory").exists())
                .andExpect(jsonPath("$.floorModelScore").exists())
                .andExpect(jsonPath("$.analysisSource").exists())
                .andReturn();

        AnalysisResponse analysis = objectMapper.readValue(analyzeRes.getResponse().getContentAsString(), AnalysisResponse.class);
        assertNotNull(analysis.getDetectedWallCategory());
        assertNotNull(analysis.getWallModelScore());
        assertNotNull(analysis.getAnalysisSource());

        // 2. User A fetches scan analysis GET endpoint
        mockMvc.perform(get("/api/scans/" + scanAId + "/analysis")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(analysis.getId()));

        // 3. User A generates MODERN design
        DesignRequest designReq = new DesignRequest();
        designReq.setStylePackage(StylePackage.MODERN);
        designReq.setCustomTaxRatePercent(18.0);

        MvcResult designRes = mockMvc.perform(post("/api/rooms/" + roomAId + "/designs")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stylePackage").value("MODERN"))
                .andExpect(jsonPath("$.overallCompatibilityScore").exists())
                .andExpect(jsonPath("$.estimatedTotalCostInr").exists())
                .andExpect(jsonPath("$.costDisclaimer").value("Actual cost may vary depending on material, vendor, labor, location and applicable taxes."))
                .andReturn();

        DesignResponse design = objectMapper.readValue(designRes.getResponse().getContentAsString(), DesignResponse.class);
        assertTrue(design.getOverallCompatibilityScore().doubleValue() > 0);
        assertTrue(design.getEstimatedTotalCostInr().doubleValue() > 0);

        // 4. User A lists room designs
        mockMvc.perform(get("/api/rooms/" + roomAId + "/designs")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(design.getId()));

        // 5. User B authorization check (User B cannot access User A's scan analysis or design)
        mockMvc.perform(post("/api/scans/" + scanAId + "/analyze")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/rooms/" + roomAId + "/designs")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isForbidden());
    }
}
