package com.gitdiary.service;

import com.gitdiary.dto.CommitDTO;
import com.gitdiary.dto.RepositoryDTO;
import com.gitdiary.entity.GitRepository;
import org.springframework.data.domain.Page;

import java.util.List;

public interface GithubService {
    List<GitRepository> syncRepositories(Long userId);
    List<GitRepository> getRepositories(Long userId);
    Page<CommitDTO> getCommits(Long userId, Long repositoryId, String startDate, String endDate, int page, int size);
    CommitDTO getCommitDetail(Long userId, Long repositoryId, String sha);
    List<CommitDTO> getCommitsForDateRange(Long userId, Long repositoryId, String startDate, String endDate);
}
