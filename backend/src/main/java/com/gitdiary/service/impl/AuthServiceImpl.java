package com.gitdiary.service.impl;

import com.gitdiary.common.BusinessException;
import com.gitdiary.config.GithubProperties;
import com.gitdiary.dto.AuthResponse;
import com.gitdiary.dto.GithubUserDTO;
import com.gitdiary.entity.User;
import com.gitdiary.repository.UserRepository;
import com.gitdiary.security.JwtUtil;
import com.gitdiary.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final GithubProperties githubProperties;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;

    @Override
    public String getGithubAuthUrl() {
        String clientId = githubProperties.getOauth().getClientId();
        String redirectUri = githubProperties.getOauth().getRedirectUri();
        return String.format(
                "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,read:user,user:email",
                clientId, redirectUri
        );
    }

    @Override
    public AuthResponse githubCallback(String code) {
        // 1. 用 code 换 access_token
        String accessToken = exchangeCodeForToken(code);

        // 2. 用 access_token 获取用户信息
        GithubUserDTO githubUser = fetchGithubUser(accessToken);

        // 3. 保存或更新用户
        User user = saveOrUpdateUser(githubUser, accessToken);

        // 4. 生成 JWT
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        log.info("用户 {} 登录成功", user.getUsername());
        return AuthResponse.builder()
                .token(token)
                .user(user)
                .build();
    }

    @Override
    public User getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    }

    @Override
    public void logout(Long userId) {
        // 清除用户的 GitHub access token
        userRepository.findById(userId).ifPresent(user -> {
            user.setGithubAccessToken(null);
            userRepository.save(user);
        });
    }

    private String exchangeCodeForToken(String code) {
        String url = "https://github.com/login/oauth/access_token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Accept", "application/json");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", githubProperties.getOauth().getClientId());
        params.add("client_secret", githubProperties.getOauth().getClientSecret());
        params.add("code", code);
        params.add("redirect_uri", githubProperties.getOauth().getRedirectUri());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("access_token")) {
                return (String) body.get("access_token");
            }
            throw new BusinessException("GitHub 授权失败：未获取到 access_token");
        } catch (Exception e) {
            log.error("交换 code 为 token 失败", e);
            throw new BusinessException("GitHub 授权失败：" + e.getMessage());
        }
    }

    private GithubUserDTO fetchGithubUser(String accessToken) {
        String url = githubProperties.getApi().getBaseUrl() + "/user";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<GithubUserDTO> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, GithubUserDTO.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("获取 GitHub 用户信息失败", e);
            throw new BusinessException("获取 GitHub 用户信息失败：" + e.getMessage());
        }
    }

    private User saveOrUpdateUser(GithubUserDTO githubUser, String accessToken) {
        return userRepository.findByGithubId(githubUser.getId())
                .map(existingUser -> {
                    existingUser.setUsername(githubUser.getLogin());
                    existingUser.setAvatarUrl(githubUser.getAvatarUrl());
                    existingUser.setEmail(githubUser.getEmail());
                    existingUser.setGithubAccessToken(accessToken);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .githubId(githubUser.getId())
                            .username(githubUser.getLogin())
                            .avatarUrl(githubUser.getAvatarUrl())
                            .email(githubUser.getEmail())
                            .githubAccessToken(accessToken)
                            .build();
                    return userRepository.save(newUser);
                });
    }
}
