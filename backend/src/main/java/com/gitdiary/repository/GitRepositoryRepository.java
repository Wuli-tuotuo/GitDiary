package com.gitdiary.repository;

import com.gitdiary.entity.GitRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GitRepositoryRepository extends JpaRepository<GitRepository, Long> {
    List<GitRepository> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<GitRepository> findByUserIdAndGithubId(Long userId, Long githubId);
    Optional<GitRepository> findByIdAndUserId(Long id, Long userId);
}
