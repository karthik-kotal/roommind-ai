package com.roommind.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.RecalculationRequest;
import com.roommind.backend.dto.RecalculationResponse;
import com.roommind.backend.dto.SurfaceCostDetailDto;
import com.roommind.backend.dto.SurfaceCustomizationDto;
import com.roommind.backend.entity.Role;
import com.roommind.backend.entity.Room;
import com.roommind.backend.entity.RoomType;
import com.roommind.backend.entity.StylePackage;
import com.roommind.backend.entity.User;
import com.roommind.backend.repository.RoomAnalysisRepository;
import com.roommind.backend.repository.RoomDesignRepository;
import com.roommind.backend.repository.RoomRepository;
import com.roommind.backend.repository.RoomScanRepository;
import com.roommind.backend.repository.ScanImageRepository;
import com.roommind.backend.repository.UserRepository;
import com.roommind.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RecalculationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomScanRepository roomScanRepository;

    @Autowired
    private RoomAnalysisRepository roomAnalysisRepository;

    @Autowired
    private ScanImageRepository scanImageRepository;

    @Autowired
    private RoomDesignRepository roomDesignRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String validToken;
    private User testUser;
    private Room validRoom;
    private Room invalidDimRoom;

    @BeforeEach
    void setUp() {
        roomDesignRepository.deleteAll();
        roomAnalysisRepository.deleteAll();
        scanImageRepository.deleteAll();
        roomScanRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFullName("Architect Tester");
        testUser.setEmail("architect@roommind.ai");
        testUser.setPassword(passwordEncoder.encode("Password123!"));
        testUser.setRole(Role.ROLE_USER);
        testUser = userRepository.save(testUser);

        validToken = jwtTokenProvider.generateTokenFromEmail(testUser.getEmail());

        validRoom = new Room();
        validRoom.setUserId(testUser.getId());
        validRoom.setName("Master Studio");
        validRoom.setType(RoomType.LIVING_ROOM);
        validRoom.setLength(5.0);
        validRoom.setWidth(4.0);
        validRoom.setHeight(2.8);
        validRoom = roomRepository.save(validRoom);

        invalidDimRoom = new Room();
        invalidDimRoom.setUserId(testUser.getId());
        invalidDimRoom.setName("Broken Dimensions Room");
        invalidDimRoom.setType(RoomType.BEDROOM);
        invalidDimRoom.setLength(0.0);
        invalidDimRoom.setWidth(-2.0);
        invalidDimRoom.setHeight(2.8);
        invalidDimRoom = roomRepository.save(invalidDimRoom);
    }


    private RecalculationRequest buildValidRequest() {
        RecalculationRequest req = new RecalculationRequest();
        req.setStylePackage(StylePackage.MODERN);
        req.setCustomTaxRatePercent(18.0);

        Map<String, SurfaceCustomizationDto> map = new HashMap<>();
        map.put("WALL_NORTH", new SurfaceCustomizationDto("EXPOSED_BRICK", "#b91c1c", 0.90, 0.00));
        map.put("WALL_WEST", new SurfaceCustomizationDto("MATTE_PAINT", "#f5f2eb", 0.85, 0.00));
        map.put("WALL_EAST", new SurfaceCustomizationDto("MATTE_PAINT", "#f5f2eb", 0.85, 0.00));
        map.put("FLOOR", new SurfaceCustomizationDto("HARDWOOD", "#8b5a2b", 0.40, 0.02));
        map.put("CEILING", new SurfaceCustomizationDto("MATTE_PAINT", "#faf8f5", 0.90, 0.00));

        req.setSurfaceMap(map);
        return req;
    }

    @Test
    void testRecalculate_SuccessfulExactMathAndNonPersistence() throws Exception {
        long initialDbCount = roomDesignRepository.count();

        RecalculationRequest req = buildValidRequest();

        MvcResult mvcResult = mockMvc.perform(post("/api/rooms/" + validRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        RecalculationResponse response = objectMapper.readValue(
                mvcResult.getResponse().getContentAsString(), RecalculationResponse.class);

        assertNotNull(response);
        assertNotNull(response.getOverallCompatibilityScore());
        assertNotNull(response.getSurfaceCostBreakdown());
        assertEquals(5, response.getSurfaceCostBreakdown().size());

        // 1. Verify Subtotal equals sum of itemized surface costs
        BigDecimal sumOfSurfaces = BigDecimal.ZERO;
        for (SurfaceCostDetailDto detail : response.getSurfaceCostBreakdown()) {
            assertNotNull(detail.getAreaSqFt());
            assertTrue(detail.getAreaSqFt().compareTo(BigDecimal.ZERO) > 0);
            assertNotNull(detail.getMaterialCostInr());
            assertNotNull(detail.getLaborCostInr());
            assertNotNull(detail.getTotalSurfaceCostInr());

            // Assert detail.totalSurfaceCostInr = matCost + labCost
            assertEquals(0, detail.getMaterialCostInr().add(detail.getLaborCostInr()).compareTo(detail.getTotalSurfaceCostInr()));

            sumOfSurfaces = sumOfSurfaces.add(detail.getTotalSurfaceCostInr());
        }

        assertEquals(0, sumOfSurfaces.compareTo(response.getSubtotalCostInr()));

        // 2. Verify Tax Calculation: Subtotal * taxRate / 100
        BigDecimal expectedTax = response.getSubtotalCostInr()
                .multiply(BigDecimal.valueOf(18.00))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        assertEquals(0, expectedTax.compareTo(response.getTaxAmountInr()));

        // 3. Verify Total Estimation: Subtotal + Tax
        BigDecimal expectedTotal = response.getSubtotalCostInr().add(response.getTaxAmountInr());
        assertEquals(0, expectedTotal.compareTo(response.getEstimatedTotalCostInr()));

        // 4. Assert non-persistence guarantee: DB row count untouched
        assertEquals(initialDbCount, roomDesignRepository.count());
    }

    @Test
    void testRecalculate_InvalidRoomDimensions_Returns400() throws Exception {
        RecalculationRequest req = buildValidRequest();

        mockMvc.perform(post("/api/rooms/" + invalidDimRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRecalculate_InvalidTaxRate_Returns400() throws Exception {
        RecalculationRequest req = buildValidRequest();
        req.setCustomTaxRatePercent(65.0); // Exceeds max 50%

        mockMvc.perform(post("/api/rooms/" + validRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRecalculate_InvalidMaterialPreset_Returns400() throws Exception {
        RecalculationRequest req = buildValidRequest();
        req.getSurfaceMap().get("WALL_NORTH").setMaterialPreset("INVALID_GOLD_LEAF");

        mockMvc.perform(post("/api/rooms/" + validRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRecalculate_InvalidColorHex_Returns400() throws Exception {
        RecalculationRequest req = buildValidRequest();
        req.getSurfaceMap().get("WALL_NORTH").setColor("not-a-hex-color");

        mockMvc.perform(post("/api/rooms/" + validRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRecalculate_InvalidRoughness_Returns400() throws Exception {
        RecalculationRequest req = buildValidRequest();
        req.getSurfaceMap().get("WALL_NORTH").setRoughness(2.5); // Max 1.0

        mockMvc.perform(post("/api/rooms/" + validRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRecalculate_UnauthorizedUser_Returns403() throws Exception {
        User unauth = new User();
        unauth.setFullName("Intruder User");
        unauth.setEmail("intruder@roommind.ai");
        unauth.setPassword(passwordEncoder.encode("Password123!"));
        unauth.setRole(Role.ROLE_USER);
        unauth = userRepository.save(unauth);

        String intruderToken = jwtTokenProvider.generateTokenFromEmail(unauth.getEmail());

        RecalculationRequest req = buildValidRequest();

        mockMvc.perform(post("/api/rooms/" + validRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}

