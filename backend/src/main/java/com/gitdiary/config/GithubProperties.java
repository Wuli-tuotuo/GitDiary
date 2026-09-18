package com.gitdiary.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "github")
public class GithubProperties {
    private OAuth oauth = new OAuth();
    private Api api = new Api();

    @Data
    public static class OAuth {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }

    @Data
    public static class Api {
        private String baseUrl = "https://api.github.com";
    }
}
