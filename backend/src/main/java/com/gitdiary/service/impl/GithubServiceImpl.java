package com.gitdiary.service.impl;

import com.gitdiary.common.BusinessException;
import com.gitdiary.config.GithubProperties;
import com.gitdiary.dto.CommitDTO;
import com.gitdiary.dto.RepositoryDTO;
import com.gitdiary.entity.GitRepository;
import com.gitdiary.entity.User;
import com.gitdiary.repository.GitRepositoryRepository;
import com.gitdiary.repository.UserRepository;
import com.gitdiary.service.GithubService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubServiceImpl implements GithubService {

    private final GithubProperties githubProperties;
    private final UserRepository userRepository;
    private final GitRepositoryRepository repositoryRepository;
    private final RestTemplate restTemplate;

    @Override
    public List<GitRepository> syncRepositories(Long userId) {
        User user = getUser(userId);
        String accessToken = user.getGithubAccessToken();

        // 从 GitHub 获取仓库列表
        String url = githubProperties.getApi().getBaseUrl() + "/user/repos?per_page=100&sort=updated";
        List<RepositoryDTO> repos = fetchGithubList(url, accessToken, new ParameterizedTypeReference<List<RepositoryDTO>>() {});

        // 保存或更新到本地数据库
        List<GitRepository> savedRepos = new ArrayList<>();
        for (RepositoryDTO repo : repos) {
            GitRepository gitRepo = repositoryRepository.findByUserIdAndGithubId(userId, repo.getId())
                    .map(existing -> {
                        existing.setName(repo.getName());
                        existing.setFullName(repo.getFullName());
                        existing.setDescription(repo.getDescription());
                        existing.setLanguage(repo.getLanguage());
                        existing.setIsPrivate(repo.getIsPrivate());
                        existing.setHtmlUrl(repo.getHtmlUrl());
                        return repositoryRepository.save(existing);
                    })
                    .orElseGet(() -> {
                        GitRepository newRepo = GitRepository.builder()
                                .userId(userId)
                                .githubId(repo.getId())
                                .name(repo.getName())
                                .fullName(repo.getFullName())
                                .description(repo.getDescription())
                                .language(repo.getLanguage())
                                .isPrivate(repo.getIsPrivate())
                                .htmlUrl(repo.getHtmlUrl())
                                .build();
                        return repositoryRepository.save(newRepo);
                    });
            savedRepos.add(gitRepo);
        }

        log.info("用户 {} 同步了 {} 个仓库", user.getUsername(), savedRepos.size());
        return savedRepos;
    }

    @Override
    public List<GitRepository> getRepositories(Long userId) {
        List<GitRepository> repos = repositoryRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        // 如果本地没有仓库，先同步
        if (repos.isEmpty()) {
            return syncRepositories(userId);
        }
        return repos;
    }

    @Override
    public Page<CommitDTO> getCommits(Long userId, Long repositoryId, String startDate, String endDate, int page, int size) {
        User user = getUser(userId);
        GitRepository repo = getRepository(userId, repositoryId);
        String accessToken = user.getGithubAccessToken();

        // 构建 URL
        String url = githubProperties.getApi().getBaseUrl() + "/repos/" + repo.getFullName() + "/commits";
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                .queryParam("per_page", size)
                .queryParam("page", page + 1);

        if (startDate != null && !startDate.isEmpty()) {
            builder.queryParam("since", startDate + "T00:00:00Z");
        }
        if (endDate != null && !endDate.isEmpty()) {
            builder.queryParam("until", endDate + "T23:59:59Z");
        }

        List<CommitDTO> commits = fetchGithubList(builder.toUriString(), accessToken,
                new ParameterizedTypeReference<List<CommitDTO>>() {});

        return new PageImpl<>(commits, PageRequest.of(page, size), commits.size() >= size ? (long) (page + 1) * size + 1 : (long) (page * size + commits.size()));
    }

    @Override
    public CommitDTO getCommitDetail(Long userId, Long repositoryId, String sha) {
        User user = getUser(userId);
        GitRepository repo = getRepository(userId, repositoryId);
        String accessToken = user.getGithubAccessToken();

        String url = githubProperties.getApi().getBaseUrl() + "/repos/" + repo.getFullName() + "/commits/" + sha;

        HttpHeaders headers = createAuthHeaders(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<CommitDTO> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, CommitDTO.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("获取提交详情失败: {}", sha, e);
            throw new BusinessException("获取提交详情失败：" + e.getMessage());
        }
    }

    @Override
    public List<CommitDTO> getCommitsForDateRange(Long userId, Long repositoryId, String startDate, String endDate) {
        User user = getUser(userId);
        GitRepository repo = getRepository(userId, repositoryId);
        String accessToken = user.getGithubAccessToken();

        List<CommitDTO> allCommits = new ArrayList<>();
        int page = 1;
        int perPage = 100;

        while (true) {
            String url = githubProperties.getApi().getBaseUrl() + "/repos/" + repo.getFullName() + "/commits";
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("per_page", perPage)
                    .queryParam("page", page);

            if (startDate != null && !startDate.isEmpty()) {
                builder.queryParam("since", startDate + "T00:00:00Z");
            }
            if (endDate != null && !endDate.isEmpty()) {
                builder.queryParam("until", endDate + "T23:59:59Z");
            }

            List<CommitDTO> commits = fetchGithubList(builder.toUriString(), accessToken,
                    new ParameterizedTypeReference<List<CommitDTO>>() {});

            if (commits.isEmpty()) {
                break;
            }

            // 获取每个 commit 的详细信息（含文件 diff）
            for (CommitDTO commit : commits) {
                try {
                    CommitDTO detail = getCommitDetail(userId, repositoryId, commit.getSha());
                    allCommits.add(detail);
                } catch (Exception e) {
                    log.warn("获取 commit {} 详情失败，跳过", commit.getSha());
                    allCommits.add(commit);
                }
            }

            if (commits.size() < perPage) {
                break;
            }
            page++;
        }

        return allCommits;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    }

    private GitRepository getRepository(Long userId, Long repositoryId) {
        return repositoryRepository.findByIdAndUserId(repositoryId, userId)
                .orElseThrow(() -> new BusinessException(404, "仓库不存在"));
    }

    private HttpHeaders createAuthHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        return headers;
    }

    private <T> List<T> fetchGithubList(String url, String accessToken, ParameterizedTypeReference<List<T>> typeRef) {
        HttpHeaders headers = createAuthHeaders(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<List<T>> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, typeRef);
            return response.getBody() != null ? response.getBody() : new ArrayList<>();
        } catch (Exception e) {
            log.error("调用 GitHub API 失败: {}", url, e);
            throw new BusinessException("调用 GitHub API 失败：" + e.getMessage());
        }
    }
}
