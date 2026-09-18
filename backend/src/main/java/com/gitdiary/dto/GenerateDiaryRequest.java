package com.gitdiary.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class GenerateDiaryRequest {
    @NotNull(message = "仓库ID不能为空")
    private Long repositoryId;
    @NotNull(message = "开始日期不能为空")
    private String startDate;
    @NotNull(message = "结束日期不能为空")
    private String endDate;

    /**
     * 用户选择要分析的文件路径列表（为空则自动取变更最多的前10个）
     */
    private List<String> selectedFiles;
}
