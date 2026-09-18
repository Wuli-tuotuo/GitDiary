package com.gitdiary.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {
    private String provider = "siliconflow";
    private String apiKey = "";
    private String baseUrl = "https://api.siliconflow.cn/v1";
    private String model = "Qwen/Qwen2.5-7B-Instruct";
    private Integer timeout = 60000;
}
