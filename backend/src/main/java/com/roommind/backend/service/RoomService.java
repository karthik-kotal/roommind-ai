package com.roommind.backend.service;

import com.roommind.backend.dto.CreateRoomRequest;
import com.roommind.backend.dto.RoomResponse;
import com.roommind.backend.entity.Room;
import com.roommind.backend.entity.User;
import com.roommind.backend.exception.ResourceNotFoundException;
import com.roommind.backend.repository.RoomRepository;
import com.roommind.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public RoomService(RoomRepository roomRepository, UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RoomResponse createRoom(String userEmail, CreateRoomRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = new Room(
                user.getId(),
                request.getName().trim(),
                request.getType(),
                request.getLength(),
                request.getWidth(),
                request.getHeight()
        );

        Room savedRoom = roomRepository.save(room);
        return new RoomResponse(savedRoom);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getUserRooms(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        return roomRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(RoomResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(String userEmail, Long roomId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findByIdAndUserId(roomId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));

        return new RoomResponse(room);
    }

    @Transactional
    public void deleteRoom(String userEmail, Long roomId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findByIdAndUserId(roomId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));

        roomRepository.delete(room);
    }
}
