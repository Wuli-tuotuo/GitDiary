package com.gitdiary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class CommitDTO {
    private String sha;
    private CommitDetail commit;
    private String htmlUrl;
    private Author author;
    private List<CommitFileDTO> files;
    private Stats stats;

    @Data
    public static class CommitDetail {
        private String message;
        private CommitAuthor author;
        private CommitAuthor committer;
    }

    @Data
    public static class CommitAuthor {
        private String name;
        private String email;
        private String date;
    }

    @Data
    public static class Author {
        private String login;
        private Long id;
        @JsonProperty("avatar_url")
        private String avatarUrl;
    }

    @Data
    public static class Stats {
        private Integer total;
        private Integer additions;
        private Integer deletions;
    }
}
