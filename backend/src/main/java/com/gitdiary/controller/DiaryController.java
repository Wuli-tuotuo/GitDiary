package com.gitdiary.controller;

import com.gitdiary.common.Result;
import com.gitdiary.dto.GenerateDiaryRequest;
import com.gitdiary.dto.GenerateDiaryResponse;
import com.gitdiary.dto.SaveDiaryRequest;
import com.gitdiary.entity.Diary;
import com.gitdiary.security.JwtAuthenticationInterceptor;
import com.gitdiary.service.DiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@Tag(name = "日记管理", description = "AI 日记生成、保存、查询、导出相关接口")
@RestController
@RequestMapping("/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @Operation(summary = "AI 生成日记")
    @PostMapping("/generate")
    public Result<GenerateDiaryResponse> generateDiary(@Valid @RequestBody GenerateDiaryRequest request) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        GenerateDiaryResponse response = diaryService.generateDiary(userId, request);
        return Result.success(response);
    }

    @Operation(summary = "保存日记")
    @PostMapping
    public Result<Diary> saveDiary(@Valid @RequestBody SaveDiaryRequest request) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        Diary diary = diaryService.saveDiary(userId, request);
        return Result.success(diary);
    }

    @Operation(summary = "获取日记列表")
    @GetMapping
    public Result<Page<Diary>> getDiaries(
            @RequestParam(required = false) Long repositoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : null;
        Page<Diary> diaries = diaryService.getDiaries(userId, repositoryId, start, end, page, size);
        return Result.success(diaries);
    }

    @Operation(summary = "获取日记详情")
    @GetMapping("/{id}")
    public Result<Diary> getDiary(@PathVariable Long id) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        Diary diary = diaryService.getDiary(userId, id);
        return Result.success(diary);
    }

    @Operation(summary = "更新日记")
    @PutMapping("/{id}")
    public Result<Diary> updateDiary(@PathVariable Long id, @Valid @RequestBody SaveDiaryRequest request) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        Diary diary = diaryService.updateDiary(userId, id, request);
        return Result.success(diary);
    }

    @Operation(summary = "删除日记")
    @DeleteMapping("/{id}")
    public Result<Void> deleteDiary(@PathVariable Long id) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        diaryService.deleteDiary(userId, id);
        return Result.success();
    }

    @Operation(summary = "导出 Markdown")
    @GetMapping("/{id}/export/markdown")
    public ResponseEntity<byte[]> exportMarkdown(@PathVariable Long id) {
        Long userId = JwtAuthenticationInterceptor.getCurrentUser().getId();
        String markdown = diaryService.exportMarkdown(userId, id);

        byte[] content = markdown.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "diary-" + id + ".md");
        headers.setContentLength(content.length);

        return new ResponseEntity<>(content, headers, 200);
    }
}
