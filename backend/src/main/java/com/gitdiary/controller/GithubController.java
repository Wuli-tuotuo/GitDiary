package com.gitdiary.controller;

import com.gitdiary.common.Result;
import com.gitdiary.dto.CommitDTO;
import com.gitdiary.entity.GitRepository;
import com.gitdiary.security.JwtAuthenticationInterceptor;
import com.gitdiary.service.GithubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "GitHub 管理", description = "仓库和提交记录相关接口")
@RestController
@RequestMapping("/github")
@RequiredArgsConstructor
public class GithubController {

    private final GithubService githubService;

    @Operation(summary = "同步 GitHub 仓库列表")
    @PostMapping("/repositories/sync")
    public Result<List<GitRepository>> syncRepositories() {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        List<GitRepository> repos = githubService.syncRepositories(userId);
        return Result.success(repos);
    }

    @Operation(summary = "获取用户仓库列表")
    @GetMapping("/repositories")
    public Result<List<GitRepository>> getRepositories() {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        List<GitRepository> repos = githubService.getRepositories(userId);
        return Result.success(repos);
    }

    @Operation(summary = "获取仓库提交记录")
    @GetMapping("/repositories/{repositoryId}/commits")
    public Result<Page<CommitDTO>> getCommits(
            @PathVariable Long repositoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        Page<CommitDTO> commits = githubService.getCommits(userId, repositoryId, startDate, endDate, page, size);
        return Result.success(commits);
    }

    @Operation(summary = "获取提交详情（含代码 diff）")
    @GetMapping("/repositories/{repositoryId}/commits/{sha}")
    public Result<CommitDTO> getCommitDetail(
            @PathVariable Long repositoryId,
            @PathVariable String sha) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        CommitDTO commit = githubService.getCommitDetail(userId, repositoryId, sha);
        return Result.success(commit);
    }
}
