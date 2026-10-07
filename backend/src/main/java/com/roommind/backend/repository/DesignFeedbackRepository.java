package com.roommind.backend.repository;

import com.roommind.backend.entity.DesignFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignFeedbackRepository extends JpaRepository<DesignFeedback, Long> {

    Optional<DesignFeedback> findByUserIdAndDesignId(Long userId, Long designId);

    List<DesignFeedback> findByDesignId(Long designId);

    @Query("SELECT AVG(f.rating) FROM DesignFeedback f WHERE f.design.id = :designId")
    Double getAverageRatingByDesignId(@Param("designId") Long designId);

    long countByDesignId(Long designId);
}
