package com.gitdiary.controller;

import com.gitdiary.common.Result;
import com.gitdiary.dto.AuthResponse;
import com.gitdiary.entity.User;
import com.gitdiary.security.JwtAuthenticationInterceptor;
import com.gitdiary.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证管理", description = "GitHub OAuth 登录相关接口")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "获取 GitHub 授权 URL")
    @GetMapping("/github/url")
    public Result<Map<String, String>> getGithubAuthUrl() {
        String url = authService.getGithubAuthUrl();
        return Result.success(Map.of("url", url));
    }

    @Operation(summary = "GitHub OAuth 回调")
    @GetMapping("/github/callback")
    public Result<AuthResponse> githubCallback(@RequestParam String code) {
        AuthResponse response = authService.githubCallback(code);
        return Result.success(response);
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/user")
    public Result<User> getCurrentUser() {
        User user = JwtAuthenticationInterceptor.getCurrentUser();
        return Result.success(user);
    }

    @Operation(summary = "退出登录")
    @PostMapping("/logout")
    public Result<Void> logout() {
        User user = JwtAuthenticationInterceptor.getCurrentUser();
        authService.logout(user.getId());
        return Result.success();
    }
}
