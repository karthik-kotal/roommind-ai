package com.roommind.backend.service;

import com.roommind.backend.dto.RoomScanResponse;
import com.roommind.backend.dto.ScanImageResponse;
import com.roommind.backend.entity.*;
import com.roommind.backend.exception.BadRequestException;
import com.roommind.backend.exception.ResourceNotFoundException;
import com.roommind.backend.repository.RoomRepository;
import com.roommind.backend.repository.RoomScanRepository;
import com.roommind.backend.repository.ScanImageRepository;
import com.roommind.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class ScanService {

    private final RoomScanRepository scanRepository;
    private final RoomRepository roomRepository;
    private final ScanImageRepository scanImageRepository;
    private final UserRepository userRepository;
    private final LocalStorageService storageService;

    public ScanService(
            RoomScanRepository scanRepository,
            RoomRepository roomRepository,
            ScanImageRepository scanImageRepository,
            UserRepository userRepository,
            LocalStorageService storageService) {
        this.scanRepository = scanRepository;
        this.roomRepository = roomRepository;
        this.scanImageRepository = scanImageRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    @Transactional
    public RoomScanResponse createScan(String userEmail, Long roomId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Room room = roomRepository.findByIdAndUserId(roomId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));

        RoomScan scan = new RoomScan(room);
        RoomScan savedScan = scanRepository.save(scan);

        return new RoomScanResponse(savedScan);
    }

    @Transactional(readOnly = true)
    public RoomScanResponse getScanById(String userEmail, Long scanId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        RoomScan scan = scanRepository.findByIdAndRoomUserId(scanId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with ID: " + scanId));

        return new RoomScanResponse(scan);
    }

    @Transactional
    public ScanImageResponse uploadScanImage(String userEmail, Long scanId, SurfaceType surfaceType, MultipartFile file) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        RoomScan scan = scanRepository.findByIdAndRoomUserId(scanId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with ID: " + scanId));

        if (surfaceType == null) {
            throw new BadRequestException("surfaceType parameter is required");
        }

        String webFilePath = storageService.storeFile(scanId, surfaceType, file);

        Optional<ScanImage> existingImageOpt = scanImageRepository.findByScanIdAndSurfaceType(scanId, surfaceType);
        ScanImage scanImage;

        if (existingImageOpt.isPresent()) {
            scanImage = existingImageOpt.get();
            scanImage.setFilePath(webFilePath);
            scanImage.setOriginalFilename(file.getOriginalFilename());
            scanImage.setContentType(file.getContentType());
            scanImage.setFileSize(file.getSize());
        } else {
            scanImage = new ScanImage(
                    scan,
                    surfaceType,
                    webFilePath,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "surface.jpg",
                    file.getContentType() != null ? file.getContentType() : "image/jpeg",
                    file.getSize()
            );
        }

        ScanImage savedImage = scanImageRepository.save(scanImage);

        // Update Scan status to IN_PROGRESS or COMPLETED if all 6 surfaces uploaded
        if (scan.getStatus() == ScanStatus.CREATED) {
            scan.setStatus(ScanStatus.IN_PROGRESS);
        }

        long countUploadedSurfaces = scanImageRepository.findByScanId(scanId).size();
        if (countUploadedSurfaces >= 6) {
            scan.setStatus(ScanStatus.COMPLETED);
            scan.setCompletedAt(OffsetDateTime.now());
        }

        scanRepository.save(scan);

        return new ScanImageResponse(savedImage);
    }
}
