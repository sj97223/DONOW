# 常用 AI API 配置实例

以下配置可直接用于 `ai.config.json` 或参考环境变量设置。

## 示例 1：Gemini (Google AI Studio)

```json
{
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "apiKey": "<AI_API_KEY>",
  "timeout": 30000
}
```

**Docker 环境变量**:
```bash
AI_PROVIDER=gemini
AI_API_KEY=AIzaSy...
MODEL_NAME=gemini-1.5-flash
```

## 示例 2：OpenAI

```json
{
  "provider": "openai",
  "model": "gpt-4-turbo",
  "apiKey": "<AI_API_KEY>",
  "timeout": 60000
}
```

**Docker 环境变量**:
```bash
AI_PROVIDER=openai
AI_API_KEY=sk-proj-...
MODEL_NAME=gpt-4-turbo
```

## 示例 3：Anthropic Claude

```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20240620",
  "apiKey": "<AI_API_KEY>",
  "timeout": 60000
}
```

**Docker 环境变量**:
```bash
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
MODEL_NAME=claude-3-5-sonnet-20240620
```
