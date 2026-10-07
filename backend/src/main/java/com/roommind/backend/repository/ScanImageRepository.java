package com.roommind.backend.repository;

import com.roommind.backend.entity.ScanImage;
import com.roommind.backend.entity.SurfaceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScanImageRepository extends JpaRepository<ScanImage, Long> {

    List<ScanImage> findByScanId(Long scanId);

    Optional<ScanImage> findByScanIdAndSurfaceType(Long scanId, SurfaceType surfaceType);
}
