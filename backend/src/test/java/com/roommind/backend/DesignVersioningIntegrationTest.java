package com.roommind.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.DesignRequest;
import com.roommind.backend.dto.DesignResponse;
import com.roommind.backend.dto.FavoriteRequest;
import com.roommind.backend.dto.RecalculationRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DesignVersioningIntegrationTest {

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

    private String userToken;
    private String intruderToken;
    private User testUser;
    private User intruderUser;
    private Room userRoom;

    @BeforeEach
    void setUp() {
        roomDesignRepository.deleteAll();
        roomAnalysisRepository.deleteAll();
        scanImageRepository.deleteAll();
        roomScanRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFullName("Designer User");
        testUser.setEmail("designer@roommind.ai");
        testUser.setPassword(passwordEncoder.encode("Password123!"));
        testUser.setRole(Role.ROLE_USER);
        testUser = userRepository.save(testUser);

        userToken = jwtTokenProvider.generateTokenFromEmail(testUser.getEmail());

        intruderUser = new User();
        intruderUser.setFullName("Intruder User");
        intruderUser.setEmail("intruder@roommind.ai");
        intruderUser.setPassword(passwordEncoder.encode("Password123!"));
        intruderUser.setRole(Role.ROLE_USER);
        intruderUser = userRepository.save(intruderUser);

        intruderToken = jwtTokenProvider.generateTokenFromEmail(intruderUser.getEmail());

        userRoom = new Room();
        userRoom.setUserId(testUser.getId());
        userRoom.setName("Penthouse Studio");
        userRoom.setType(RoomType.LIVING_ROOM);
        userRoom.setLength(5.5);
        userRoom.setWidth(4.2);
        userRoom.setHeight(3.0);
        userRoom = roomRepository.save(userRoom);
    }

    private Map<String, SurfaceCustomizationDto> buildSurfaceMap() {
        Map<String, SurfaceCustomizationDto> map = new HashMap<>();
        map.put("WALL_NORTH", new SurfaceCustomizationDto("EXPOSED_BRICK", "#b91c1c", 0.90, 0.00));
        map.put("WALL_WEST", new SurfaceCustomizationDto("MATTE_PAINT", "#f5f2eb", 0.85, 0.00));
        map.put("WALL_EAST", new SurfaceCustomizationDto("MATTE_PAINT", "#f5f2eb", 0.85, 0.00));
        map.put("FLOOR", new SurfaceCustomizationDto("HARDWOOD", "#8b5a2b", 0.40, 0.02));
        map.put("CEILING", new SurfaceCustomizationDto("MATTE_PAINT", "#faf8f5", 0.90, 0.00));
        return map;
    }

    @Test
    void testSaveDesign_CreatesPersistentVersionChain() throws Exception {
        // 1. Save Version 1
        DesignRequest req1 = new DesignRequest();
        req1.setStylePackage(StylePackage.MODERN);
        req1.setCustomTaxRatePercent(18.0);
        req1.setSurfaceMap(buildSurfaceMap());

        MvcResult res1 = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andReturn();

        DesignResponse design1 = objectMapper.readValue(res1.getResponse().getContentAsString(), DesignResponse.class);
        assertNotNull(design1.getId());
        assertEquals(1, design1.getVersionNumber());
        assertFalse(design1.getIsFavorite());
        assertEquals(1, roomDesignRepository.count());

        // 2. Save Version 2 (Modified wall material)
        DesignRequest req2 = new DesignRequest();
        req2.setStylePackage(StylePackage.LUXURY);
        req2.setCustomTaxRatePercent(18.0);
        Map<String, SurfaceCustomizationDto> map2 = buildSurfaceMap();
        map2.put("WALL_NORTH", new SurfaceCustomizationDto("ITALIAN_MARBLE", "#ffffff", 0.10, 0.80));
        req2.setSurfaceMap(map2);

        MvcResult res2 = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andReturn();

        DesignResponse design2 = objectMapper.readValue(res2.getResponse().getContentAsString(), DesignResponse.class);
        assertNotNull(design2.getId());
        assertEquals(2, design2.getVersionNumber());
        assertEquals(2, roomDesignRepository.count());

        // 3. Verify Version 1 remains unchanged in database
        DesignResponse v1Db = objectMapper.readValue(
                mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + design1.getId())
                                .header("Authorization", "Bearer " + userToken))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(), DesignResponse.class);
        assertEquals(1, v1Db.getVersionNumber());
        assertEquals(StylePackage.MODERN, v1Db.getStylePackage());
    }

    @Test
    void testGetDesignHistory_OrderedNewestFirst() throws Exception {
        // Create 2 versions
        DesignRequest req = new DesignRequest();
        req.setStylePackage(StylePackage.STANDARD);
        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());

        req.setStylePackage(StylePackage.LUXURY);
        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());

        MvcResult historyRes = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        List<DesignResponse> history = objectMapper.readValue(
                historyRes.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, DesignResponse.class));

        assertEquals(2, history.size());
        assertEquals(2, history.get(0).getVersionNumber()); // Newest version first
        assertEquals(1, history.get(1).getVersionNumber());
    }

    @Test
    void testRestoreDesign_CreatesNewVersionWithoutMutatingSource() throws Exception {
        // Create Version 1
        DesignRequest req = new DesignRequest();
        req.setStylePackage(StylePackage.MODERN);
        MvcResult v1Res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();
        DesignResponse v1 = objectMapper.readValue(v1Res.getResponse().getContentAsString(), DesignResponse.class);

        // Create Version 2
        req.setStylePackage(StylePackage.LUXURY);
        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());

        assertEquals(2, roomDesignRepository.count());

        // Restore Version 1 -> Result must be Version 3 referencing parent design v1
        MvcResult restoreRes = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + v1.getId() + "/restore")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        DesignResponse v3 = objectMapper.readValue(restoreRes.getResponse().getContentAsString(), DesignResponse.class);
        assertEquals(3, v3.getVersionNumber());
        assertEquals(v1.getId(), v3.getParentDesignId());
        assertEquals(StylePackage.MODERN, v3.getStylePackage());
        assertEquals(3, roomDesignRepository.count());
    }

    @Test
    void testFavoriteAndUnfavoriteDesign() throws Exception {
        DesignRequest req = new DesignRequest();
        MvcResult v1Res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();
        DesignResponse v1 = objectMapper.readValue(v1Res.getResponse().getContentAsString(), DesignResponse.class);
        assertFalse(v1.getIsFavorite());

        // Favorite
        FavoriteRequest favReq = new FavoriteRequest(true);
        MvcResult favRes = mockMvc.perform(put("/api/rooms/" + userRoom.getId() + "/designs/" + v1.getId() + "/favorite")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(favReq)))
                .andExpect(status().isOk()).andReturn();
        DesignResponse favDesign = objectMapper.readValue(favRes.getResponse().getContentAsString(), DesignResponse.class);
        assertTrue(favDesign.getIsFavorite());
        assertEquals(1, roomDesignRepository.count()); // No new version created!

        // Unfavorite
        FavoriteRequest unfavReq = new FavoriteRequest(false);
        MvcResult unfavRes = mockMvc.perform(put("/api/rooms/" + userRoom.getId() + "/designs/" + v1.getId() + "/favorite")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unfavReq)))
                .andExpect(status().isOk()).andReturn();
        DesignResponse unfavDesign = objectMapper.readValue(unfavRes.getResponse().getContentAsString(), DesignResponse.class);
        assertFalse(unfavDesign.getIsFavorite());
    }

    @Test
    void testCloneDesign_CreatesNewIndependentVersion() throws Exception {
        DesignRequest req = new DesignRequest();
        req.setStylePackage(StylePackage.MODERN);
        MvcResult v1Res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();
        DesignResponse v1 = objectMapper.readValue(v1Res.getResponse().getContentAsString(), DesignResponse.class);

        // Clone
        MvcResult cloneRes = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + v1.getId() + "/clone")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andReturn();

        DesignResponse v2 = objectMapper.readValue(cloneRes.getResponse().getContentAsString(), DesignResponse.class);
        assertEquals(2, v2.getVersionNumber());
        assertEquals(v1.getId(), v2.getParentDesignId());
        assertEquals(2, roomDesignRepository.count());
    }

    @Test
    void testUnauthorizedAccess_Returns403() throws Exception {
        // Intruder trying to save design into userRoom
        DesignRequest req = new DesignRequest();
        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Save valid design under user
        MvcResult v1Res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();
        DesignResponse v1 = objectMapper.readValue(v1Res.getResponse().getContentAsString(), DesignResponse.class);

        // Intruder trying to read history
        mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs")
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());

        // Intruder trying to restore
        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + v1.getId() + "/restore")
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());

        // Intruder trying to favorite
        mockMvc.perform(put("/api/rooms/" + userRoom.getId() + "/designs/" + v1.getId() + "/favorite")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new FavoriteRequest(true))))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRecalculationRemainsTransient() throws Exception {
        long initialCount = roomDesignRepository.count();

        RecalculationRequest req = new RecalculationRequest();
        req.setStylePackage(StylePackage.MODERN);
        req.setCustomTaxRatePercent(18.0);
        req.setSurfaceMap(buildSurfaceMap());

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/recalculate")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Assert 0 database writes occurred during recalculation
        assertEquals(initialCount, roomDesignRepository.count());
    }

    @Test
    void testConcurrentSaves_EnforcesUniqueVersionsWithoutDuplicates() throws Exception {
        int threadCount = 4;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch doneLatch = new java.util.concurrent.CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Fire all threads simultaneously
                    DesignRequest req = new DesignRequest();
                    req.setStylePackage(index % 2 == 0 ? StylePackage.MODERN : StylePackage.LUXURY);
                    mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                            .header("Authorization", "Bearer " + userToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)));
                } catch (Exception e) {
                    // Handled
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Release threads
        assertTrue(doneLatch.await(10, java.util.concurrent.TimeUnit.SECONDS));
        executor.shutdown();

        // Verify database state: all saved versions must have distinct version numbers
        List<com.roommind.backend.entity.RoomDesign> savedDesigns = roomDesignRepository.findByRoomId(userRoom.getId());
        assertFalse(savedDesigns.isEmpty());

        java.util.Set<Integer> versions = new java.util.HashSet<>();
        for (com.roommind.backend.entity.RoomDesign d : savedDesigns) {
            assertTrue(versions.add(d.getVersionNumber()), "Duplicate version number detected in database: " + d.getVersionNumber());
        }
    }

    @Test
    void testUniqueConstraint_RejectsDuplicateVersionNumberInsertion() {
        com.roommind.backend.entity.RoomDesign d1 = new com.roommind.backend.entity.RoomDesign();
        d1.setRoom(userRoom);
        d1.setStylePackage(StylePackage.MODERN);
        d1.setVersionNumber(99);
        d1.setOverallCompatibilityScore(java.math.BigDecimal.valueOf(90));
        d1.setSubtotalCostInr(java.math.BigDecimal.valueOf(1000));
        d1.setTaxRatePercent(java.math.BigDecimal.valueOf(18));
        d1.setTaxAmountInr(java.math.BigDecimal.valueOf(180));
        d1.setEstimatedTotalCostInr(java.math.BigDecimal.valueOf(1180));
        roomDesignRepository.saveAndFlush(d1);

        com.roommind.backend.entity.RoomDesign d2 = new com.roommind.backend.entity.RoomDesign();
        d2.setRoom(userRoom);
        d2.setStylePackage(StylePackage.LUXURY);
        d2.setVersionNumber(99); // Duplicate version number 99 for same room
        d2.setOverallCompatibilityScore(java.math.BigDecimal.valueOf(92));
        d2.setSubtotalCostInr(java.math.BigDecimal.valueOf(2000));
        d2.setTaxRatePercent(java.math.BigDecimal.valueOf(18));
        d2.setTaxAmountInr(java.math.BigDecimal.valueOf(360));
        d2.setEstimatedTotalCostInr(java.math.BigDecimal.valueOf(2360));

        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> {
            roomDesignRepository.saveAndFlush(d2);
        });
    }
}
