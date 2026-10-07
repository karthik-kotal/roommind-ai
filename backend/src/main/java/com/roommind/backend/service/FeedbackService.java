package com.roommind.backend.service;

import com.roommind.backend.dto.FeedbackAnalyticsResponse;
import com.roommind.backend.dto.FeedbackRequest;
import com.roommind.backend.dto.FeedbackResponse;
import com.roommind.backend.entity.DesignFeedback;
import com.roommind.backend.entity.Room;
import com.roommind.backend.entity.RoomDesign;
import com.roommind.backend.entity.User;
import com.roommind.backend.exception.ResourceNotFoundException;
import com.roommind.backend.repository.DesignFeedbackRepository;
import com.roommind.backend.repository.RoomDesignRepository;
import com.roommind.backend.repository.RoomRepository;
import com.roommind.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final DesignFeedbackRepository feedbackRepository;
    private final RoomDesignRepository roomDesignRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public FeedbackService(
            DesignFeedbackRepository feedbackRepository,
            RoomDesignRepository roomDesignRepository,
            RoomRepository roomRepository,
            UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.roomDesignRepository = roomDesignRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FeedbackResponse submitFeedback(String userEmail, Long roomId, Long designId, FeedbackRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign design = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be an integer between 1 and 5");
        }

        if (request.getComment() != null && request.getComment().length() > 500) {
            throw new IllegalArgumentException("Comment length cannot exceed 500 characters");
        }

        Optional<DesignFeedback> existingOpt = feedbackRepository.findByUserIdAndDesignId(user.getId(), designId);
        DesignFeedback feedback = existingOpt.orElseGet(DesignFeedback::new);

        feedback.setUser(user);
        feedback.setDesign(design);
        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment() != null ? request.getComment().trim() : null);

        DesignFeedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbackByDesignId(String userEmail, Long roomId, Long designId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign design = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        List<DesignFeedback> list = feedbackRepository.findByDesignId(design.getId());
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeedbackAnalyticsResponse getFeedbackAnalytics(String userEmail, Long roomId, Long designId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to room ID: " + roomId);
        }

        RoomDesign design = roomDesignRepository.findByIdAndRoomId(designId, roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Design ID " + designId + " not found for room ID " + roomId));

        Double avgRating = feedbackRepository.getAverageRatingByDesignId(design.getId());
        long count = feedbackRepository.countByDesignId(design.getId());

        double roundedAvg = avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 0.0;
        return new FeedbackAnalyticsResponse(designId, roundedAvg, count);
    }

    private FeedbackResponse mapToResponse(DesignFeedback fb) {
        FeedbackResponse res = new FeedbackResponse();
        res.setId(fb.getId());
        res.setDesignId(fb.getDesign().getId());
        res.setUserId(fb.getUser().getId());
        res.setUserName(fb.getUser().getFullName());
        res.setRating(fb.getRating());
        res.setComment(fb.getComment());
        res.setCreatedAt(fb.getCreatedAt());
        res.setUpdatedAt(fb.getUpdatedAt());
        return res;
    }
}
