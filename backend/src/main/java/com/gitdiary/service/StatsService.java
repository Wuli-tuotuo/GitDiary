package com.gitdiary.service;

import com.gitdiary.dto.StatsDataDTO;

import java.time.LocalDate;

public interface StatsService {
    StatsDataDTO getStats(Long userId, Long repositoryId, LocalDate startDate, LocalDate endDate);
}
