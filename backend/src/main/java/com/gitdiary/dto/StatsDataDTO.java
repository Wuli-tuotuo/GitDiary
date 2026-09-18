package com.gitdiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsDataDTO {
    private List<CommitTrendItem> commitTrend;
    private List<CodeChangesItem> codeChanges;
    private List<LanguageDistributionItem> languageDistribution;
    private List<KnowledgePointItem> topKnowledgePoints;
    private Integer totalDiaries;
    private Integer totalCommits;
    private Integer totalAdditions;
    private Integer totalDeletions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitTrendItem {
        private String date;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeChangesItem {
        private String date;
        private Integer additions;
        private Integer deletions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LanguageDistributionItem {
        private String language;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KnowledgePointItem {
        private String name;
        private Integer count;
    }
}
