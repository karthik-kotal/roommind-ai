package com.roommind.backend.repository;

import com.roommind.backend.entity.RoomAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoomAnalysisRepository extends JpaRepository<RoomAnalysis, Long> {
    Optional<RoomAnalysis> findByRoomScanId(Long roomScanId);
    Optional<RoomAnalysis> findTopByRoomScanIdOrderByIdDesc(Long roomScanId);
}
