package com.roommind.backend.service;

import com.roommind.backend.entity.SurfaceType;
import com.roommind.backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class LocalStorageService {

    private final Path rootLocation;
    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "image/jpg"
    );

    public LocalStorageService(@Value("${app.storage.location:uploads}") String storageLocation) {
        this.rootLocation = Paths.get(storageLocation).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    public String storeFile(Long scanId, SurfaceType surfaceType, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Failed to store empty image file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Image file size exceeds the 15MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid image content type. Allowed types: JPEG, PNG, WEBP");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "surface.jpg"
        );

        if (originalFilename.contains("..")) {
            throw new BadRequestException("Cannot store file with relative path outside current directory " + originalFilename);
        }

        String extension = getFileExtension(originalFilename);
        if (!Arrays.asList("jpg", "jpeg", "png", "webp").contains(extension.toLowerCase())) {
            throw new BadRequestException("Invalid file extension: ." + extension);
        }

        String generatedFilename = surfaceType.name().toLowerCase() + "_" + UUID.randomUUID().toString() + "." + extension;

        Path scanDirectory = this.rootLocation.resolve("scans").resolve(scanId.toString());
        try {
            Files.createDirectories(scanDirectory);
            Path destinationFile = scanDirectory.resolve(generatedFilename).normalize();

            if (!destinationFile.getParent().equals(scanDirectory)) {
                throw new BadRequestException("Cannot store file outside specified scan directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            return "/uploads/scans/" + scanId + "/" + generatedFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image file", e);
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1) {
            return "jpg";
        }
        return filename.substring(lastIndex + 1);
    }
}
