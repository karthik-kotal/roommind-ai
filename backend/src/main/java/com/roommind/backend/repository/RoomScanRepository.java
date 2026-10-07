package com.roommind.backend.repository;

import com.roommind.backend.entity.RoomScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomScanRepository extends JpaRepository<RoomScan, Long> {

    List<RoomScan> findByRoomIdOrderByCreatedAtDesc(Long roomId);

    Optional<RoomScan> findTopByRoomIdOrderByIdDesc(Long roomId);

    @Query("SELECT rs FROM RoomScan rs WHERE rs.id = :scanId AND rs.room.userId = :userId")
    Optional<RoomScan> findByIdAndRoomUserId(@Param("scanId") Long scanId, @Param("userId") Long userId);
}
