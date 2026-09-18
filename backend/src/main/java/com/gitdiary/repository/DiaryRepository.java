package com.gitdiary.repository;

import com.gitdiary.entity.Diary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {
    Page<Diary> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Diary> findByUserIdAndRepositoryIdOrderByCreatedAtDesc(Long userId, Long repositoryId, Pageable pageable);

    Optional<Diary> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT d FROM Diary d WHERE d.userId = :userId " +
           "AND (:repositoryId IS NULL OR d.repositoryId = :repositoryId) " +
           "AND (:startDate IS NULL OR d.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR d.endDate <= :endDate) " +
           "ORDER BY d.createdAt DESC")
    Page<Diary> findByFilters(
            @Param("userId") Long userId,
            @Param("repositoryId") Long repositoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    List<Diary> findByUserIdAndStartDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
