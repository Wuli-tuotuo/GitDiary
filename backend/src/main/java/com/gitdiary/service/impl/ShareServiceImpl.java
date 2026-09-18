package com.gitdiary.service.impl;

import com.gitdiary.common.BusinessException;
import com.gitdiary.dto.CreateShareRequest;
import com.gitdiary.entity.Diary;
import com.gitdiary.entity.ShareLink;
import com.gitdiary.repository.DiaryRepository;
import com.gitdiary.repository.ShareLinkRepository;
import com.gitdiary.service.ShareService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareServiceImpl implements ShareService {

    private final ShareLinkRepository shareLinkRepository;
    private final DiaryRepository diaryRepository;

    @Override
    @Transactional
    public ShareLink createShare(Long userId, CreateShareRequest request) {
        // 验证日记存在且属于当前用户
        Diary diary = diaryRepository.findByIdAndUserId(request.getDiaryId(), userId)
                .orElseThrow(() -> new BusinessException(404, "日记不存在"));

        // 检查是否已有分享链接，有则更新过期时间
        ShareLink shareLink = shareLinkRepository.findByDiaryId(request.getDiaryId())
                .orElse(new ShareLink());

        int expireDays = request.getExpireDays() != null ? request.getExpireDays() : 7;

        shareLink.setDiaryId(request.getDiaryId());
        shareLink.setToken(UUID.randomUUID().toString().replace("-", ""));
        shareLink.setExpireAt(LocalDateTime.now().plusDays(expireDays));
        shareLink.setViewCount(0);

        return shareLinkRepository.save(shareLink);
    }

    @Override
    @Transactional
    public Diary getSharedDiary(String token) {
        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(404, "分享链接不存在或已失效"));

        // 检查是否过期
        if (shareLink.getExpireAt() != null && shareLink.getExpireAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("分享链接已过期");
        }

        // 获取日记
        Diary diary = diaryRepository.findById(shareLink.getDiaryId())
                .orElseThrow(() -> new BusinessException(404, "日记不存在"));

        // 增加访问次数
        shareLink.setViewCount(shareLink.getViewCount() + 1);
        shareLinkRepository.save(shareLink);

        return diary;
    }
}
