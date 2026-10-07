package com.roommind.backend.repository;

import com.roommind.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Room> findByIdAndUserId(Long id, Long userId);
}
