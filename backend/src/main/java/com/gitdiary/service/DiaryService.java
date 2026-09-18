package com.gitdiary.service;

import com.gitdiary.dto.CommitDTO;
import com.gitdiary.dto.GenerateDiaryRequest;
import com.gitdiary.dto.GenerateDiaryResponse;
import com.gitdiary.dto.SaveDiaryRequest;
import com.gitdiary.entity.Diary;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

public interface DiaryService {
    GenerateDiaryResponse generateDiary(Long userId, GenerateDiaryRequest request);
    List<CommitDTO> getCommitFiles(Long userId, Long repositoryId, String startDate, String endDate);
    Diary saveDiary(Long userId, SaveDiaryRequest request);
    Page<Diary> getDiaries(Long userId, Long repositoryId, LocalDate startDate, LocalDate endDate, int page, int size);
    Diary getDiary(Long userId, Long id);
    Diary updateDiary(Long userId, Long id, SaveDiaryRequest request);
    void deleteDiary(Long userId, Long id);
    String exportMarkdown(Long userId, Long id);
}
