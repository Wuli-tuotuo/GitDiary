package com.gitdiary.service;

import com.gitdiary.dto.GenerateDiaryResponse;
import com.gitdiary.dto.CommitDTO;

import java.util.List;

public interface AiService {
    GenerateDiaryResponse generateDiary(String repositoryName, List<CommitDTO> commits);
}
