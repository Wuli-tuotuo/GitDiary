package com.gitdiary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class RepositoryDTO {
    private Long id;
    private String name;
    @JsonProperty("full_name")
    private String fullName;
    private String description;
    private String language;
    @JsonProperty("private")
    private Boolean isPrivate;
    @JsonProperty("html_url")
    private String htmlUrl;
    @JsonProperty("updated_at")
    private String updatedAt;
    @JsonProperty("default_branch")
    private String defaultBranch;
}
