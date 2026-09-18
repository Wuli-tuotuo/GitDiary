package com.gitdiary.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gitdiary.common.BusinessException;
import com.gitdiary.config.AiProperties;
import com.gitdiary.dto.CommitDTO;
import com.gitdiary.dto.CommitFileDTO;
import com.gitdiary.dto.GenerateDiaryResponse;
import com.gitdiary.dto.KnowledgePointDTO;
import com.gitdiary.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiliconFlowAiServiceImpl implements AiService {

    private final AiProperties aiProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public GenerateDiaryResponse generateDiary(String repositoryName, List<CommitDTO> commits) {
        if (aiProperties.getApiKey() == null || aiProperties.getApiKey().isEmpty()) {
            throw new BusinessException("AI 服务未配置 API Key，请在配置文件中设置 ai.api-key");
        }

        if (commits == null || commits.isEmpty()) {
            throw new BusinessException("所选日期范围内没有提交记录");
        }

        // 构建 Prompt
        String prompt = buildPrompt(repositoryName, commits);

        // 调用 AI API
        String aiResponse = callAiApi(prompt);

        // 解析响应
        return parseAiResponse(aiResponse, commits.size());
    }

    private String buildPrompt(String repositoryName, List<CommitDTO> commits) {
        StringBuilder commitInfo = new StringBuilder();
        for (int i = 0; i < commits.size(); i++) {
            CommitDTO commit = commits.get(i);
            commitInfo.append(String.format("\n=== 提交 %d ===\n", i + 1));
            commitInfo.append("SHA: ").append(commit.getSha()).append("\n");
            if (commit.getCommit() != null) {
                commitInfo.append("提交信息: ").append(commit.getCommit().getMessage()).append("\n");
                if (commit.getCommit().getAuthor() != null) {
                    commitInfo.append("作者: ").append(commit.getCommit().getAuthor().getName()).append("\n");
                    commitInfo.append("时间: ").append(commit.getCommit().getAuthor().getDate()).append("\n");
                }
            }
            if (commit.getFiles() != null && !commit.getFiles().isEmpty()) {
                commitInfo.append("修改的文件:\n");
                for (CommitFileDTO file : commit.getFiles()) {
                    commitInfo.append(String.format("  - %s (+%d, -%d)\n",
                            file.getFilename(), file.getAdditions(), file.getDeletions()));
                    if (file.getPatch() != null && !file.getPatch().isEmpty()) {
                        String patch = file.getPatch().length() > 2000
                                ? file.getPatch().substring(0, 2000) + "\n...(已截断)"
                                : file.getPatch();
                        commitInfo.append("  代码变更:\n```diff\n").append(patch).append("\n```\n");
                    }
                }
            }
        }

        return """
                你是一位资深的软件开发导师，正在帮助学习生写学习日记。
                请根据以下 Git 提交记录，生成一份学习日记。

                仓库名称: %s
                提交记录:
                %s

                请严格按照以下 JSON 格式返回（不要返回其他内容，不要用 markdown 代码块包裹）：
                {
                  "title": "日记标题（简洁概括本周/今日工作）",
                  "content": "学习日记正文，用 Markdown 格式，包含：1. 今日工作内容概述 2. 具体完成的任务和代码修改说明 3. 遇到的问题和解决方案 4. 心得体会",
                  "knowledgePoints": [
                    {
                      "name": "知识点名称",
                      "description": "这个知识点的简要说明",
                      "category": "分类（如：前端/后端/数据库/算法/工具/其他）"
                    }
                  ]
                }

                要求：
                1. content 部分要详细具体，结合实际的代码修改来说明，不要空泛
                2. knowledgePoints 要从代码修改中提取真实用到的技术知识点，3-8 个
                3. 语言用中文，语气正式但不生硬
                4. 只返回 JSON，不要有其他解释文字
                """.formatted(repositoryName, commitInfo.toString());
    }

    private String callAiApi(String prompt) {
        String url = aiProperties.getBaseUrl() + "/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + aiProperties.getApiKey());

        Map<String, Object> requestBody = Map.of(
                "model", aiProperties.getModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", "你是一位专业的软件开发导师，擅长根据代码提交记录生成学习日记和知识点总结。"),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.7,
                "max_tokens", 4096
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            log.info("调用 AI API，模型: {}", aiProperties.getModel());
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("调用 AI API 失败", e);
            throw new BusinessException("AI 服务调用失败：" + e.getMessage());
        }
    }

    private GenerateDiaryResponse parseAiResponse(String aiResponse, int commitCount) {
        try {
            // 清理响应，提取 JSON
            String jsonStr = aiResponse.trim();
            // 移除可能的 markdown 代码块标记
            if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "");
                jsonStr = jsonStr.replaceAll("\\s*```$", "");
            }

            JsonNode root = objectMapper.readTree(jsonStr);

            String title = root.path("title").asText("学习日记");
            String content = root.path("content").asText("");

            List<KnowledgePointDTO> knowledgePoints = new ArrayList<>();
            JsonNode pointsNode = root.path("knowledgePoints");
            if (pointsNode.isArray()) {
                for (JsonNode pointNode : pointsNode) {
                    KnowledgePointDTO point = KnowledgePointDTO.builder()
                            .name(pointNode.path("name").asText(""))
                            .description(pointNode.path("description").asText(""))
                            .category(pointNode.path("category").asText("其他"))
                            .build();
                    knowledgePoints.add(point);
                }
            }

            return GenerateDiaryResponse.builder()
                    .title(title)
                    .content(content)
                    .knowledgePoints(knowledgePoints)
                    .commitCount(commitCount)
                    .build();
        } catch (Exception e) {
            log.error("解析 AI 响应失败，原始响应: {}", aiResponse, e);
            // 解析失败时，把原始内容作为日记内容返回
            return GenerateDiaryResponse.builder()
                    .title("学习日记")
                    .content(aiResponse)
                    .knowledgePoints(new ArrayList<>())
                    .commitCount(commitCount)
                    .build();
        }
    }
}
