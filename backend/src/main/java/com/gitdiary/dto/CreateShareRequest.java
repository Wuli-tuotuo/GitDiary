package com.gitdiary.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateShareRequest {
    @NotNull(message = "日记ID不能为空")
    private Long diaryId;
    private Integer expireDays = 7;
}
