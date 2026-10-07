package com.roommind.backend.repository;

import com.roommind.backend.entity.RoomDesign;
import com.roommind.backend.entity.StylePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomDesignRepository extends JpaRepository<RoomDesign, Long> {
    List<RoomDesign> findByRoomId(Long roomId);
    List<RoomDesign> findByRoomIdOrderByVersionNumberDesc(Long roomId);
    Optional<RoomDesign> findByRoomIdAndStylePackage(Long roomId, StylePackage stylePackage);
    Optional<RoomDesign> findByIdAndRoomId(Long id, Long roomId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(MAX(d.versionNumber), 0) FROM RoomDesign d WHERE d.room.id = :roomId")
    Integer findMaxVersionNumberByRoomId(@org.springframework.data.repository.query.Param("roomId") Long roomId);
}
