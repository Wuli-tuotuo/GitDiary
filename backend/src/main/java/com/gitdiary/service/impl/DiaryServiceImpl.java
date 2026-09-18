package com.gitdiary.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gitdiary.common.BusinessException;
import com.gitdiary.dto.*;
import com.gitdiary.entity.Diary;
import com.gitdiary.entity.GitRepository;
import com.gitdiary.repository.DiaryRepository;
import com.gitdiary.repository.GitRepositoryRepository;
import com.gitdiary.service.AiService;
import com.gitdiary.service.DiaryService;
import com.gitdiary.service.GithubService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiaryServiceImpl implements DiaryService {

    private final DiaryRepository diaryRepository;
    private final GitRepositoryRepository repositoryRepository;
    private final GithubService githubService;
    private final AiService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public GenerateDiaryResponse generateDiary(Long userId, GenerateDiaryRequest request) {
        // 1. 获取仓库信息
        GitRepository repo = repositoryRepository.findByIdAndUserId(request.getRepositoryId(), userId)
                .orElseThrow(() -> new BusinessException(404, "仓库不存在"));

        // 2. 获取指定日期范围内的提交记录（含 diff）
        log.info("获取仓库 {} 在 {} 至 {} 的提交记录", repo.getFullName(), request.getStartDate(), request.getEndDate());
        List<CommitDTO> commits = githubService.getCommitsForDateRange(
                userId, request.getRepositoryId(), request.getStartDate(), request.getEndDate());

        if (commits.isEmpty()) {
            throw new BusinessException("所选日期范围内没有提交记录");
        }

        log.info("获取到 {} 条提交记录，开始生成日记", commits.size());

        // 3. 调用 AI 生成日记
        GenerateDiaryResponse response = aiService.generateDiary(repo.getFullName(), commits);

        return response;
    }

    @Override
    public Diary saveDiary(Long userId, SaveDiaryRequest request) {
        Diary diary;
        if (request.getId() != null) {
            // 更新
            diary = diaryRepository.findByIdAndUserId(request.getId(), userId)
                    .orElseThrow(() -> new BusinessException(404, "日记不存在"));
        } else {
            // 新建
            diary = new Diary();
            diary.setUserId(userId);
        }

        diary.setRepositoryId(request.getRepositoryId());
        diary.setTitle(request.getTitle());
        diary.setContent(request.getContent());
        diary.setCommitCount(request.getCommitCount());

        if (request.getStartDate() != null) {
            diary.setStartDate(LocalDate.parse(request.getStartDate()));
        }
        if (request.getEndDate() != null) {
            diary.setEndDate(LocalDate.parse(request.getEndDate()));
        }

        // 知识点序列化为 JSON
        if (request.getKnowledgePoints() != null) {
            try {
                diary.setKnowledgePoints(objectMapper.writeValueAsString(request.getKnowledgePoints()));
            } catch (JsonProcessingException e) {
                log.error("序列化知识点失败", e);
                diary.setKnowledgePoints("[]");
            }
        }

        return diaryRepository.save(diary);
    }

    @Override
    public Page<Diary> getDiaries(Long userId, Long repositoryId, LocalDate startDate, LocalDate endDate, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return diaryRepository.findByFilters(userId, repositoryId, startDate, endDate, pageRequest);
    }

    @Override
    public Diary getDiary(Long userId, Long id) {
        return diaryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new BusinessException(404, "日记不存在"));
    }

    @Override
    public Diary updateDiary(Long userId, Long id, SaveDiaryRequest request) {
        request.setId(id);
        return saveDiary(userId, request);
    }

    @Override
    public void deleteDiary(Long userId, Long id) {
        Diary diary = diaryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new BusinessException(404, "日记不存在"));
        diaryRepository.delete(diary);
    }

    @Override
    public String exportMarkdown(Long userId, Long id) {
        Diary diary = getDiary(userId, id);
        GitRepository repo = repositoryRepository.findById(diary.getRepositoryId()).orElse(null);

        StringBuilder md = new StringBuilder();
        md.append("# ").append(diary.getTitle()).append("\n\n");

        md.append("> 仓库: ").append(repo != null ? repo.getFullName() : "未知").append("\n");
        md.append("> 日期: ").append(diary.getStartDate()).append(" 至 ").append(diary.getEndDate()).append("\n");
        md.append("> 提交次数: ").append(diary.getCommitCount()).append("\n");
        md.append("> 生成时间: ").append(diary.getCreatedAt()).append("\n\n");

        md.append("---\n\n");
        md.append(diary.getContent()).append("\n\n");

        // 知识点
        if (diary.getKnowledgePoints() != null && !diary.getKnowledgePoints().isEmpty()) {
            try {
                List<KnowledgePointDTO> points = objectMapper.readValue(
                        diary.getKnowledgePoints(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, KnowledgePointDTO.class));

                if (!points.isEmpty()) {
                    md.append("---\n\n");
                    md.append("## 涉及知识点\n\n");
                    for (KnowledgePointDTO point : points) {
                        md.append("### ").append(point.getName());
                        if (point.getCategory() != null) {
                            md.append(" `").append(point.getCategory()).append("`");
                        }
                        md.append("\n\n");
                        md.append(point.getDescription()).append("\n\n");
                    }
                }
            } catch (JsonProcessingException e) {
                log.error("解析知识点失败", e);
            }
        }

        return md.toString();
    }
}
