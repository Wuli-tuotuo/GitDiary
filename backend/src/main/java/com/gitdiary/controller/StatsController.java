package com.gitdiary.controller;

import com.gitdiary.common.Result;
import com.gitdiary.dto.StatsDataDTO;
import com.gitdiary.security.JwtAuthenticationInterceptor;
import com.gitdiary.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "数据统计", description = "统计看板相关接口")
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @Operation(summary = "获取统计数据")
    @GetMapping
    public Result<StatsDataDTO> getStats(
            @RequestParam(required = false) Long repositoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : null;
        StatsDataDTO stats = statsService.getStats(userId, repositoryId, start, end);
        return Result.success(stats);
    }
}
