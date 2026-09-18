package com.gitdiary.controller;

import com.gitdiary.common.Result;
import com.gitdiary.dto.CreateShareRequest;
import com.gitdiary.entity.Diary;
import com.gitdiary.entity.ShareLink;
import com.gitdiary.security.JwtAuthenticationInterceptor;
import com.gitdiary.service.ShareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "分享管理", description = "日记分享相关接口")
@RestController
@RequestMapping
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @Operation(summary = "创建分享链接")
    @PostMapping("/diaries/share")
    public Result<ShareLink> createShare(@Valid @RequestBody CreateShareRequest request) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        ShareLink shareLink = shareService.createShare(userId, request);
        return Result.success(shareLink);
    }

    @Operation(summary = "获取分享的日记（公开访问）")
    @GetMapping("/share/{token}")
    public Result<Diary> getSharedDiary(@PathVariable String token) {
        Diary diary = shareService.getSharedDiary(token);
        return Result.success(diary);
    }
}
