package com.gitdiary.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerateDiaryRequest {
    @NotNull(message = "仓库ID不能为空")
    private Long repositoryId;
    @NotNull(message = "开始日期不能为空")
    private String startDate;
    @NotNull(message = "结束日期不能为空")
    private String endDate;
}
