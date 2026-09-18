# GitDiary - AI 驱动的学习日记生成器

> 自动读取 GitHub 代码提交记录，用 AI 生成包含知识点总结的学习日记，告别手写日报的烦恼。

![GitHub](https://img.shields.io/badge/React-19-61dafb)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6db33f)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 功能特性

- 🔗 **GitHub 一键登录** — OAuth 授权，自动同步仓库列表
- 📝 **AI 智能生成** — 分析代码提交记录和 diff，自动生成学习日记
- 🧠 **知识点提取** — 自动识别代码中用到的技术知识点，分类整理
- 📊 **数据统计看板** — 提交趋势、代码变更、技术栈分布、高频知识点
- 📤 **多格式导出** — 支持 Markdown、PDF 导出，一键复制
- 🔗 **分享功能** — 生成只读分享链接，方便给导师/同事查看
- 🗂️ **历史记录管理** — 所有日记云端保存，支持编辑、删除、筛选

## 🛠 技术栈

### 前端
- **React 19** + **TypeScript**
- **Vite** — 构建工具
- **Ant Design (antd)** — UI 组件库
- **React Router** — 路由管理
- **Axios** — HTTP 请求
- **ECharts** — 数据可视化
- **html2pdf.js** — PDF 导出

### 后端
- **Spring Boot 3.2** + **Java 17**
- **Spring Data JPA** — 数据访问
- **MySQL 8.0** / **H2** — 数据库
- **JWT** — 身份认证
- **SpringDoc OpenAPI** — API 文档
- **RestTemplate** — HTTP 客户端

### AI 大模型
- **硅基流动 (SiliconFlow)** — 免费大模型 API
- 支持 Qwen、GLM、DeepSeek 等多种开源模型

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- JDK >= 17
- Maven >= 3.8（或使用项目自带的 Maven Wrapper）
- MySQL >= 8.0（可选，开发环境默认使用 H2 内存数据库）

### 1. 克隆项目
```bash
git clone https://github.com/your-username/GitDiary.git
cd GitDiary
```

### 2. 配置 GitHub OAuth App
1. 登录 GitHub，进入 [Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写信息：
   - Application name: `GitDiary`
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/oauth/callback`
4. 记录 `Client ID` 和 `Client Secret`

### 3. 配置 AI API Key
1. 注册 [硅基流动](https://cloud.siliconflow.cn/) 账号
2. 获取 API Key（免费额度足够个人使用）

### 4. 启动后端
```bash
cd backend

# 配置环境变量（Windows PowerShell）
$env:GITHUB_CLIENT_ID="your_client_id"
$env:GITHUB_CLIENT_SECRET="your_client_secret"
$env:AI_API_KEY="your_siliconflow_api_key"

# 使用 Maven Wrapper 启动
.\mvnw.cmd spring-boot:run
```

后端启动后访问：
- API 文档: http://localhost:8080/api/swagger-ui.html
- H2 控制台: http://localhost:8080/api/h2-console

### 5. 启动前端
```bash
cd frontend
npm install
npm run dev
```

前端启动后访问：http://localhost:5173

## 🐳 Docker 部署（推荐）

### 1. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

### 2. 一键启动
```bash
docker-compose up -d
```

### 3. 访问应用
- 前端: http://localhost
- 后端 API: http://localhost:8080/api
- API 文档: http://localhost:8080/api/swagger-ui.html

### 4. 停止服务
```bash
docker-compose down
```

## 📁 项目结构

```
GitDiary/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API 接口封装
│   │   ├── components/      # 公共组件
│   │   │   └── Layout/      # 主布局
│   │   ├── pages/           # 页面组件
│   │   │   ├── Login/       # 登录页
│   │   │   ├── OAuthCallback/ # OAuth回调页
│   │   │   ├── Dashboard/   # 数据看板
│   │   │   ├── Generate/    # 日记生成
│   │   │   ├── History/     # 历史记录
│   │   │   └── Share/       # 分享页面
│   │   ├── router/          # 路由配置
│   │   ├── store/           # 状态管理
│   │   ├── types/           # TypeScript 类型
│   │   └── utils/           # 工具函数
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                  # 后端项目
│   ├── src/main/java/com/gitdiary/
│   │   ├── config/          # 配置类
│   │   ├── controller/      # 控制器
│   │   ├── service/         # 服务层
│   │   │   └── impl/        # 服务实现
│   │   ├── repository/      # 数据访问层
│   │   ├── entity/          # 实体类
│   │   ├── dto/             # 数据传输对象
│   │   ├── common/          # 通用类
│   │   ├── security/        # 安全相关
│   │   └── util/            # 工具类
│   ├── src/main/resources/
│   │   └── application.yml  # 应用配置
│   └── Dockerfile
├── docker-compose.yml        # Docker Compose 配置
├── .env.example              # 环境变量示例
└── README.md
```

## 📖 API 文档

启动后端后访问 Swagger UI 查看完整 API 文档：
http://localhost:8080/api/swagger-ui.html

### 主要接口

| 模块 | 接口 | 说明 |
|------|------|------|
| 认证 | `GET /api/auth/github/url` | 获取 GitHub 授权 URL |
| 认证 | `GET /api/auth/github/callback` | GitHub OAuth 回调 |
| 认证 | `GET /api/auth/user` | 获取当前用户信息 |
| GitHub | `GET /api/github/repositories` | 获取仓库列表 |
| GitHub | `POST /api/github/repositories/sync` | 同步仓库 |
| GitHub | `GET /api/github/repositories/{id}/commits` | 获取提交记录 |
| 日记 | `POST /api/diaries/generate` | AI 生成日记 |
| 日记 | `POST /api/diaries` | 保存日记 |
| 日记 | `GET /api/diaries` | 获取日记列表 |
| 日记 | `GET /api/diaries/{id}` | 获取日记详情 |
| 日记 | `PUT /api/diaries/{id}` | 更新日记 |
| 日记 | `DELETE /api/diaries/{id}` | 删除日记 |
| 日记 | `GET /api/diaries/{id}/export/markdown` | 导出 Markdown |
| 统计 | `GET /api/stats` | 获取统计数据 |
| 分享 | `POST /api/diaries/share` | 创建分享链接 |
| 分享 | `GET /api/share/{token}` | 获取分享的日记 |

## 🎯 使用流程

1. **登录** — 使用 GitHub 账号登录
2. **同步仓库** — 自动同步你的 GitHub 仓库
3. **选择条件** — 选择仓库和日期范围
4. **AI 生成** — 点击生成，AI 自动分析代码提交并生成日记
5. **编辑完善** — 对生成的内容进行编辑和调整
6. **保存导出** — 保存日记，支持导出 Markdown/PDF 或分享

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 License

本项目基于 MIT 协议开源。

## 🙏 致谢

- [Spring Boot](https://spring.io/projects/spring-boot)
- [Ant Design](https://ant.design/)
- [ECharts](https://echarts.apache.org/)
- [硅基流动 SiliconFlow](https://siliconflow.cn/)
- [GitHub API](https://docs.github.com/en/rest)

---

**如果这个项目对你有帮助，欢迎给个 Star ⭐**
