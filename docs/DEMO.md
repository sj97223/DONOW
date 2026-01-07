# DoNow Demo & Verification Guide

This guide describes how to run the demo environment and verify the functionality of the DoNow application.

## Prerequisites

- Docker & Docker Compose installed.
- An API Key for Gemini, OpenAI, or Anthropic.

## 1. Setup Environment

Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` and set your API Key:
```bash
AI_PROVIDER=gemini
AI_API_KEY=your_real_key_here
```

## 2. Start Application

Run the following command to build and start the containers:
```bash
docker compose up -d --build
```

Wait for a few moments for the services to initialize.

## 3. Verify Functionality

### Web Interface
Open your browser and navigate to:
**http://localhost:5901**

- **Task Creation**: Add a new task (e.g., "Learn React").
- **AI Breakdown**: Click the "Magic Wand" icon (or "Breakdown" button) on the task.
    - Expectation: The task should be split into sub-steps (e.g., "Setup Environment", "Learn JSX").
    - If configured correctly, this uses the backend API to fetch steps from the AI provider.

### API Testing (Manual)
You can test the backend API directly using `curl`:

**Test Breakdown Endpoint:**
```bash
curl -X POST http://localhost:5901/api/ai/breakdown \
  -H "Content-Type: application/json" \
  -d '{"taskTitle":"Plan a weekend trip"}'
```
**Expected Output:** A JSON array of steps.

**Test Health Check:**
```bash
# Note: Health check is internal to the server container (port 3000), 
# but exposed via Nginx if configured, or you can exec into container.
# Currently Nginx only proxies /api, so health check might be at /api/ai/health if routed, 
# or strictly on the backend.
# The server exposes /health, but Nginx config maps /api/ -> server:3000/api/.
# So /health is not exposed via Nginx in the current config.
```

## 4. Troubleshooting

- **Logs**: View server logs to check for API errors.
  ```bash
  docker compose logs -f server
  ```
- **Port Conflicts**: If 5901 is busy, change `docker-compose.yml`.
