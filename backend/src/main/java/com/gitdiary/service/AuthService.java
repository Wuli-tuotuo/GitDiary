package com.gitdiary.service;

import com.gitdiary.dto.AuthResponse;
import com.gitdiary.entity.User;

public interface AuthService {
    String getGithubAuthUrl();
    AuthResponse githubCallback(String code);
    User getCurrentUser(Long userId);
    void logout(Long userId);
}
