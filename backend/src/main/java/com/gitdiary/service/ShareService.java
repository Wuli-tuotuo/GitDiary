package com.gitdiary.service;

import com.gitdiary.dto.CreateShareRequest;
import com.gitdiary.entity.Diary;
import com.gitdiary.entity.ShareLink;

public interface ShareService {
    ShareLink createShare(Long userId, CreateShareRequest request);
    Diary getSharedDiary(String token);
}
