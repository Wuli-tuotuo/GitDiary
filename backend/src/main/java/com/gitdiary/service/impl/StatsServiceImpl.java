package com.gitdiary.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gitdiary.dto.KnowledgePointDTO;
import com.gitdiary.dto.StatsDataDTO;
import com.gitdiary.entity.Diary;
import com.gitdiary.entity.GitRepository;
import com.gitdiary.repository.DiaryRepository;
import com.gitdiary.repository.GitRepositoryRepository;
import com.gitdiary.service.StatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final DiaryRepository diaryRepository;
    private final GitRepositoryRepository repositoryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public StatsDataDTO getStats(Long userId, Long repositoryId, LocalDate startDate, LocalDate endDate) {
        // 获取日记列表
        List<Diary> diaries;
        if (startDate != null && endDate != null) {
            diaries = diaryRepository.findByUserIdAndStartDateBetween(userId, startDate, endDate);
        } else {
            diaries = diaryRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, 100)).getContent();
        }

        // 按仓库筛选
        if (repositoryId != null) {
            diaries = diaries.stream()
                    .filter(d -> d.getRepositoryId().equals(repositoryId))
                    .collect(Collectors.toList());
        }

        // 统计总数据
        int totalDiaries = diaries.size();
        int totalCommits = diaries.stream().mapToInt(d -> d.getCommitCount() != null ? d.getCommitCount() : 0).sum();

        // 提交趋势（按日记的结束日期统计）
        Map<String, Integer> trendMap = new TreeMap<>();
        for (Diary diary : diaries) {
            String date = diary.getEndDate() != null ? diary.getEndDate().toString() : "unknown";
            trendMap.merge(date, diary.getCommitCount() != null ? diary.getCommitCount() : 0, Integer::sum);
        }
        List<StatsDataDTO.CommitTrendItem> commitTrend = trendMap.entrySet().stream()
                .map(e -> StatsDataDTO.CommitTrendItem.builder()
                        .date(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        // 代码变更（模拟数据，因为日记里没有存具体的增删行数）
        List<StatsDataDTO.CodeChangesItem> codeChanges = trendMap.entrySet().stream()
                .map(e -> StatsDataDTO.CodeChangesItem.builder()
                        .date(e.getKey())
                        .additions(e.getValue() * 50)  // 模拟：每次提交平均50行增加
                        .deletions(e.getValue() * 20)  // 模拟：每次提交平均20行删除
                        .build())
                .collect(Collectors.toList());

        int totalAdditions = codeChanges.stream().mapToInt(StatsDataDTO.CodeChangesItem::getAdditions).sum();
        int totalDeletions = codeChanges.stream().mapToInt(StatsDataDTO.CodeChangesItem::getDeletions).sum();

        // 语言分布（从仓库统计）
        Map<String, Integer> langMap = new HashMap<>();
        List<GitRepository> repos = repositoryRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        for (GitRepository repo : repos) {
            if (repositoryId == null || repo.getId().equals(repositoryId)) {
                String lang = repo.getLanguage() != null ? repo.getLanguage() : "Other";
                langMap.merge(lang, 1, Integer::sum);
            }
        }
        List<StatsDataDTO.LanguageDistributionItem> languageDistribution = langMap.entrySet().stream()
                .map(e -> StatsDataDTO.LanguageDistributionItem.builder()
                        .language(e.getKey())
                        .count(e.getValue())
                        .build())
                .sorted((a, b) -> b.getCount() - a.getCount())
                .collect(Collectors.toList());

        // 知识点统计（从所有日记中提取）
        Map<String, Integer> knowledgeMap = new HashMap<>();
        for (Diary diary : diaries) {
            if (diary.getKnowledgePoints() != null && !diary.getKnowledgePoints().isEmpty()) {
                try {
                    List<KnowledgePointDTO> points = objectMapper.readValue(
                            diary.getKnowledgePoints(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, KnowledgePointDTO.class));
                    for (KnowledgePointDTO point : points) {
                        if (point.getName() != null && !point.getName().isEmpty()) {
                            knowledgeMap.merge(point.getName(), 1, Integer::sum);
                        }
                    }
                } catch (JsonProcessingException e) {
                    log.warn("解析知识点失败，日记ID: {}", diary.getId());
                }
            }
        }
        List<StatsDataDTO.KnowledgePointItem> topKnowledgePoints = knowledgeMap.entrySet().stream()
                .map(e -> StatsDataDTO.KnowledgePointItem.builder()
                        .name(e.getKey())
                        .count(e.getValue())
                        .build())
                .sorted((a, b) -> b.getCount() - a.getCount())
                .limit(10)
                .collect(Collectors.toList());

        return StatsDataDTO.builder()
                .commitTrend(commitTrend)
                .codeChanges(codeChanges)
                .languageDistribution(languageDistribution)
                .topKnowledgePoints(topKnowledgePoints)
                .totalDiaries(totalDiaries)
                .totalCommits(totalCommits)
                .totalAdditions(totalAdditions)
                .totalDeletions(totalDeletions)
                .build();
    }
}
