# Implement Robust API Management System

I will implement a comprehensive API management layer with error handling, key rotation, and rate limiting as requested.

## 1. Backend Infrastructure (`server/`)
### A. Configuration & Environment
- Create `server/.env` with the provided MiMo and Gemini API keys.
- Update `server/src/config.ts` to support multiple API keys for MiMo and the specific model configurations.

### B. API Manager (`server/src/lib/api-manager.ts`)
Create a new `APIManager` class responsible for:
- **Key Management**: securely storing and rotating the 3 MiMo keys.
- **Rate Limiting**: Enforcing the 10 requests/minute global limit.
- **Retry Logic**: Implementing the exponential backoff (1s to 10s) and automatic key switching on failure.
- **Monitoring**: Tracking request counts and success/failure stats.

### C. Provider Refactoring
- **`MimoProvider` (`server/src/providers/mimo.ts`)**: Refactor to use `APIManager`. instead of a static client, it will request an execution context from the manager which handles the retries and client instantiation with the active key.
- **`GeminiProvider` (`server/src/providers/gemini.ts`)**: Update to use `APIManager` for rate limiting and consistent error handling.

### D. API Routes (`server/src/routes/ai.ts`)
- Add a new endpoint `GET /api/ai/status` to expose real-time metrics (current provider, active key index, remaining requests) to the frontend.
- Integrate the `APIManager` into the existing `breakdown` and `suggest` routes.

## 2. Frontend Implementation (`client/`)
### A. API Status Panel
- Create `client/src/components/APIStatusPanel.tsx`.
- Features:
  - **Visual Indicator**: Shows current API endpoint (MIMO/GEMINI).
  - **Rate Limit Counter**: Real-time countdown of remaining requests (e.g., "8/10 available").
  - **Status**: Visual feedback on system health.
- Integrate this panel into the bottom footer of `client/App.tsx`.

## 3. Verification & Testing
- **Rate Limit Test**: Verify 429 response after 10 requests.
- **Failover Test**: Simulate API failures to confirm automatic switching from Primary -> Backup 1 -> Backup 2.
- **Backoff Test**: Confirm the delay increases (1s -> 2s...) between retries.

This approach ensures robust service availability while strictly adhering to your rate limits and fallback requirements.