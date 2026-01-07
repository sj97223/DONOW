# DoNow (立动) Docker 部署方案

我已经为您构建了完整的部署方案，采用 **Nginx + Node.js BFF (Backend for Frontend)** 架构，确保 API Key 安全且适配 Docker 环境。

## 核心交付物清单

1.  **代码重构**:
    -   `/client`: 原有前端代码已迁移至此。
    -   `/server`: 新增 Node.js 后端，负责 AI API 代理。
2.  **安全配置**:
    -   `server/config/ai.config.example.json`: 配置文件模板。
    -   `server/src/config.ts`: 优先读取环境变量，确保 Docker 部署安全。
3.  **Docker 设施**:
    -   `docker-compose.yml`: 一键编排前端 (5901端口) 和后端。
    -   `Dockerfile.client`: 前端构建 + Nginx 静态托管。
    -   `Dockerfile.server`: 后端服务容器化。
    -   `nginx.conf`: 反向代理配置 (处理 `/api` 转发)。
4.  **文档**:
    -   `README.md`: 包含完整的部署、开发、配置指南。
    -   `server/config/ai.config.md`: 常用 AI Provider 配置示例。

## 快速上手

### 1. 配置环境变量
复制模板并填入您的 API Key：
```bash
cp .env.example .env
# 编辑 .env 文件，填入 AI_API_KEY
```

### 2. 启动服务
在项目根目录下执行：
```bash
docker compose up -d --build
```

### 3. 访问应用
打开浏览器访问：`http://localhost:5901`

## 安全与架构说明
- **API Key 保护**: Key 仅存储在后端容器的环境变量中，前端无法直接接触。
- **网络隔离**: 后端服务 (Port 3000) 仅在 Docker 网络内部暴露，外部只能通过 Nginx 代理访问。
- **多模型支持**: 后端已实现 Gemini, OpenAI, Anthropic 的适配器接口。

所有文件均已生成，您可以直接开始部署。