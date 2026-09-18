package com.gitdiary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SaveDiaryRequest {
    private Long id;
    @NotNull(message = "仓库ID不能为空")
    private Long repositoryId;
    @NotBlank(message = "标题不能为空")
    private String title;
    @NotBlank(message = "内容不能为空")
    private String content;
    private List<KnowledgePointDTO> knowledgePoints;
    private String startDate;
    private String endDate;
    private Integer commitCount;
}
