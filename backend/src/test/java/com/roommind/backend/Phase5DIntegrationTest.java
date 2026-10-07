package com.roommind.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommind.backend.dto.BomResponse;
import com.roommind.backend.dto.DesignRequest;
import com.roommind.backend.dto.DesignResponse;
import com.roommind.backend.dto.FeedbackAnalyticsResponse;
import com.roommind.backend.dto.FeedbackRequest;
import com.roommind.backend.dto.FeedbackResponse;
import com.roommind.backend.dto.SurfaceCostDetailDto;
import com.roommind.backend.entity.DesignFeedback;
import com.roommind.backend.entity.Role;
import com.roommind.backend.entity.Room;
import com.roommind.backend.entity.RoomDesign;
import com.roommind.backend.entity.RoomType;
import com.roommind.backend.entity.StylePackage;
import com.roommind.backend.entity.User;
import com.roommind.backend.repository.DesignFeedbackRepository;
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

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase5DIntegrationTest {

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
    private DesignFeedbackRepository designFeedbackRepository;

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
    private RoomDesign savedDesign;

    @BeforeEach
    void setUp() throws Exception {
        designFeedbackRepository.deleteAll();
        roomDesignRepository.deleteAll();
        roomAnalysisRepository.deleteAll();
        scanImageRepository.deleteAll();
        roomScanRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFullName("Phase5D Tester");
        testUser.setEmail("phase5d@roommind.ai");
        testUser.setPassword(passwordEncoder.encode("Password123!"));
        testUser.setRole(Role.ROLE_USER);
        testUser = userRepository.save(testUser);

        userToken = jwtTokenProvider.generateTokenFromEmail(testUser.getEmail());

        intruderUser = new User();
        intruderUser.setFullName("Intruder User");
        intruderUser.setEmail("intruder5d@roommind.ai");
        intruderUser.setPassword(passwordEncoder.encode("Password123!"));
        intruderUser.setRole(Role.ROLE_USER);
        intruderUser = userRepository.save(intruderUser);

        intruderToken = jwtTokenProvider.generateTokenFromEmail(intruderUser.getEmail());

        userRoom = new Room();
        userRoom.setUserId(testUser.getId());
        userRoom.setName("Master Bedroom");
        userRoom.setType(RoomType.BEDROOM);
        userRoom.setLength(5.0);
        userRoom.setWidth(4.0);
        userRoom.setHeight(2.8);
        userRoom = roomRepository.save(userRoom);

        // Create initial saved design snapshot
        DesignRequest designReq = new DesignRequest();
        designReq.setStylePackage(StylePackage.MODERN);
        designReq.setCustomTaxRatePercent(18.0);

        MvcResult result = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isOk())
                .andReturn();

        DesignResponse resp = objectMapper.readValue(result.getResponse().getContentAsString(), DesignResponse.class);
        savedDesign = roomDesignRepository.findById(resp.getId()).orElseThrow();
    }

    // ==================================================
    // PART 1 — BOM TESTS (1–6)
    // ==================================================

    @Test
    void test1_bomGeneratedForSavedDesign() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/bom")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        BomResponse bom = objectMapper.readValue(res.getResponse().getContentAsString(), BomResponse.class);
        assertNotNull(bom);
        assertEquals(savedDesign.getId(), bom.getDesignId());
        assertEquals(userRoom.getId(), bom.getRoomId());
        assertEquals(savedDesign.getVersionNumber(), bom.getVersionNumber());
    }

    @Test
    void test2_bomContainsExpectedSurfacesAndMaterials() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/bom")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        BomResponse bom = objectMapper.readValue(res.getResponse().getContentAsString(), BomResponse.class);
        assertNotNull(bom.getSurfaceItems());
        assertTrue(bom.getSurfaceItems().size() >= 5);

        // Check key surfaces present
        List<String> surfaceKeys = bom.getSurfaceItems().stream().map(SurfaceCostDetailDto::getSurfaceKey).toList();
        assertTrue(surfaceKeys.contains("WALL_NORTH"));
        assertTrue(surfaceKeys.contains("WALL_WEST"));
        assertTrue(surfaceKeys.contains("FLOOR"));
        assertTrue(surfaceKeys.contains("CEILING"));
    }

    @Test
    void test3_bomSubtotalMatchesSavedDesignSubtotal() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/bom")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        BomResponse bom = objectMapper.readValue(res.getResponse().getContentAsString(), BomResponse.class);
        assertEquals(0, savedDesign.getSubtotalCostInr().compareTo(bom.getSubtotalCostInr()));
    }

    @Test
    void test4_bomTaxMatchesSavedDesignTax() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/bom")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        BomResponse bom = objectMapper.readValue(res.getResponse().getContentAsString(), BomResponse.class);
        assertEquals(0, savedDesign.getTaxRatePercent().compareTo(bom.getTaxRatePercent()));
        assertEquals(0, savedDesign.getTaxAmountInr().compareTo(bom.getTaxAmountInr()));
    }

    @Test
    void test5_bomTotalMatchesSavedDesignTotal() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/bom")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        BomResponse bom = objectMapper.readValue(res.getResponse().getContentAsString(), BomResponse.class);
        assertEquals(0, savedDesign.getEstimatedTotalCostInr().compareTo(bom.getEstimatedTotalCostInr()));
    }

    @Test
    void test6_unauthorizedBomAccessReturns403() throws Exception {
        mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/bom")
                .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());
    }

    // ==================================================
    // PART 2 — PDF REPORT TESTS (7–12)
    // ==================================================

    @Test
    void test7_pdfEndpointSucceeds() throws Exception {
        mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/report")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());
    }

    @Test
    void test8_contentTypeIsApplicationPdf() throws Exception {
        mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/report")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    @Test
    void test9_pdfIsNonEmpty() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/report")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        byte[] pdfBytes = res.getResponse().getContentAsByteArray();
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "Generated PDF must be non-empty and formatted");
        // Verify PDF Magic Bytes (%PDF-)
        assertEquals("%PDF-", new String(pdfBytes, 0, 5));
    }

    @Test
    void test10_pdfRepresentsRequestedDesignVersion() throws Exception {
        // Create Version 2
        DesignRequest v2Req = new DesignRequest();
        v2Req.setStylePackage(StylePackage.LUXURY);
        v2Req.setCustomTaxRatePercent(12.0);

        MvcResult v2Res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v2Req)))
                .andExpect(status().isOk())
                .andReturn();

        DesignResponse v2Design = objectMapper.readValue(v2Res.getResponse().getContentAsString(), DesignResponse.class);

        // Fetch PDF for Version 2
        MvcResult res = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + v2Design.getId() + "/report")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        byte[] pdfBytes = res.getResponse().getContentAsByteArray();
        assertTrue(pdfBytes.length > 500);
    }

    @Test
    void test11_unauthorizedPdfAccessReturns403() throws Exception {
        mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/report")
                .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test12_pdfGenerationDoesNotModifyDatabase() throws Exception {
        long countBefore = roomDesignRepository.count();

        mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/report")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        long countAfter = roomDesignRepository.count();
        assertEquals(countBefore, countAfter, "PDF generation must strictly not mutate database");
    }

    // ==================================================
    // PART 3 — HUMAN FEEDBACK TESTS (13–20)
    // ==================================================

    @Test
    void test13_validFeedbackSaves() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(5);
        fbReq.setComment("The color recommendation matched my room well.");

        MvcResult res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isOk())
                .andReturn();

        FeedbackResponse fbResp = objectMapper.readValue(res.getResponse().getContentAsString(), FeedbackResponse.class);
        assertNotNull(fbResp.getId());
        assertEquals(5, fbResp.getRating());
        assertEquals("The color recommendation matched my room well.", fbResp.getComment());
    }

    @Test
    void test14_ratingBelowOneRejected() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(0);
        fbReq.setComment("Bad rating");

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test15_ratingAboveFiveRejected() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(6);
        fbReq.setComment("Too high rating");

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test16_oversizedCommentRejected() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(4);
        fbReq.setComment("A".repeat(501)); // Exceeds 500 chars

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test17_unauthorizedFeedbackAccessReturns403() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(4);

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + intruderToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void test18_feedbackBelongsToAuthenticatedUser() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(4);
        fbReq.setComment("Great job!");

        MvcResult res = mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isOk())
                .andReturn();

        FeedbackResponse fbResp = objectMapper.readValue(res.getResponse().getContentAsString(), FeedbackResponse.class);
        assertEquals(testUser.getId(), fbResp.getUserId());
    }

    @Test
    void test19_duplicateFeedbackUpdatesSingleRow() throws Exception {
        FeedbackRequest fb1 = new FeedbackRequest();
        fb1.setRating(3);
        fb1.setComment("Initial review");

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fb1)))
                .andExpect(status().isOk());

        long countFirst = designFeedbackRepository.count();
        assertEquals(1, countFirst);

        // Submit updated feedback for same user + design
        FeedbackRequest fb2 = new FeedbackRequest();
        fb2.setRating(5);
        fb2.setComment("Updated review - loved it!");

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fb2)))
                .andExpect(status().isOk());

        long countSecond = designFeedbackRepository.count();
        assertEquals(1, countSecond, "Duplicate feedback must update existing row, not create duplicate");

        DesignFeedback savedFb = designFeedbackRepository.findByUserIdAndDesignId(testUser.getId(), savedDesign.getId()).orElseThrow();
        assertEquals(5, savedFb.getRating());
        assertEquals("Updated review - loved it!", savedFb.getComment());
    }

    @Test
    void test20_feedbackRetrievalAndAnalyticsWork() throws Exception {
        FeedbackRequest fbReq = new FeedbackRequest();
        fbReq.setRating(4);
        fbReq.setComment("Solid design");

        mockMvc.perform(post("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fbReq)))
                .andExpect(status().isOk());

        // GET Feedback for design
        MvcResult fbRes = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        FeedbackResponse[] getFbs = objectMapper.readValue(fbRes.getResponse().getContentAsString(), FeedbackResponse[].class);
        assertNotNull(getFbs);
        assertTrue(getFbs.length > 0);
        assertEquals(4, getFbs[0].getRating());


        // GET Feedback Analytics
        MvcResult analyticsRes = mockMvc.perform(get("/api/rooms/" + userRoom.getId() + "/designs/" + savedDesign.getId() + "/feedback/analytics")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        FeedbackAnalyticsResponse analytics = objectMapper.readValue(analyticsRes.getResponse().getContentAsString(), FeedbackAnalyticsResponse.class);
        assertNotNull(analytics);
        assertEquals(1, analytics.getTotalFeedbackCount());
        assertEquals(4.0, analytics.getAverageRating());
    }
}
