# DoNow (立动) - Web App Deployment

DoNow 是一个专注当下的任务管理 Web App，支持 AI 辅助拆解任务。
本项目采用 **BFF (Backend for Frontend)** 架构，通过 Docker 容器化部署，确保 API Key 安全。

## 目录结构

```
/client          # 前端 (React + Vite)
/server          # 后端代理 (Express + Node.js)
  /config        # 配置模板
  /src           # 后端源码
docker-compose.yml # 容器编排
Dockerfile.client  # 前端构建 & Nginx
Dockerfile.server  # 后端构建
nginx.conf       # 反向代理配置
.env.example     # 环境变量模板
README.md        # 说明文档
```

## 功能列表

- **任务管理**: LocalStorage 本地存储，数据隐私安全。
- **AI 拆解**: 调用大模型 (Gemini/OpenAI/Anthropic) 自动拆解复杂任务。
- **响应式设计**: 适配 Desktop, Tablet, Mobile。
- **安全架构**: API Key 存储在后端，前端通过 Nginx 代理访问。

## 架构说明

- **Client**: Nginx 托管静态资源 (React build)，监听容器端口 80。
- **Server**: Node.js Express 服务，持有 API Key，处理 AI 请求，监听容器端口 3000。
- **Proxy**: Nginx 将 `/api` 请求转发至 Server，对外暴露宿主机端口 `5901`。

## 快速开始

### 1. 准备配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：
```bash
AI_PROVIDER=gemini  # 或 openai, anthropic
AI_API_KEY=你的真实Key
MODEL_NAME=gemini-1.5-flash
```

### 2. Docker 一键部署

构建并启动服务：
```bash
docker compose up -d --build
```

查看日志：
```bash
docker compose logs -f
```

### 3. 验证

访问浏览器：
http://<SERVER_IP_OR_DOMAIN>:5901

测试 API：
```bash
curl -X POST http://localhost:5901/api/ai/breakdown \
  -H "Content-Type: application/json" \
  -d '{"taskTitle":"Learn Docker"}'
```

### 4. 更新版本

```bash
git pull
docker compose down
docker compose up -d --build
```

## 本地开发 (非 Docker)

**启动后端**:
```bash
cd server
npm install
cp ../.env.example .env # 配置 .env
npm run dev
```

**启动前端**:
```bash
cd client
npm install
npm run dev
```
注意：本地开发时需配置 Vite 代理转发 `/api` 到 `http://localhost:3000`。

## AI API 配置实例

请参考 `server/config/ai.config.md` 获取更多配置示例。

### Gemini (Google AI Studio)
```bash
AI_PROVIDER=gemini
AI_API_KEY=AIzaSy...
MODEL_NAME=gemini-1.5-flash
```

### OpenAI
```bash
AI_PROVIDER=openai
AI_API_KEY=sk-proj-...
MODEL_NAME=gpt-4-turbo
```

### Anthropic Claude
```bash
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
MODEL_NAME=claude-3-5-sonnet-20240620
```

## 安全说明

1.  **Key 不离手**: API Key 仅存在于后端容器的环境变量中，前端代码中无任何 Key。
2.  **内网通信**: 后端服务 (Port 3000) 不直接暴露给公网，仅通过 Nginx 代理访问。
3.  **Git 忽略**: `.env` 和 `dist` 等敏感文件已被 `.gitignore` 排除。

## FAQ

**Q: 5901 端口冲突怎么办？**
A: 修改 `docker-compose.yml` 中的 `ports: - "5901:80"` 为其他端口，如 `"8080:80"`。

**Q: AI 请求返回 401/403？**
A: 检查 `.env` 中的 `AI_API_KEY` 是否正确，或额度是否耗尽。

**Q: Nginx 502 Bad Gateway？**
A: 后端容器可能未启动完成。使用 `docker compose logs server` 查看后端报错。

## GitHub 提交流程

```bash
# 初始化
git init

# 添加文件
git add .

# 提交
git commit -m "feat: initial commit with docker deployment support"

# 关联远程 (替换 <GITHUB_USERNAME> 和 <REPO_NAME>)
git remote add origin https://github.com/<GITHUB_USERNAME>/<REPO_NAME>.git

# 推送
git push -u origin main
```
