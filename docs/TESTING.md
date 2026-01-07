# Testing Guide

DoNow includes both backend (Server) and frontend (Client) tests.

## 1. Server Tests (Backend)

The backend uses **Jest** and **Supertest** for integration testing of the API routes.

### Run Server Tests
```bash
cd server
npm install
npm test
```

### Scope
- **AI Routes**: Verifies `/api/ai/breakdown` and `/api/ai/suggest` endpoints.
- **Mocking**: External AI providers are mocked to ensure tests are deterministic and do not consume API quota.

## 2. Client Tests (Frontend)

The frontend uses **Vitest** for unit testing services and components.

### Run Client Tests
```bash
cd client
npm install
npm test
# Or for a single run:
npm test -- run
```

### Scope
- **Services**: `geminiService` is tested with mocked `fetch` calls to ensure it handles API responses and errors correctly.

## 3. Performance Testing (Optional)

To verify performance, you can use `ab` (Apache Bench) against the running Docker instance:

```bash
# Send 100 requests with concurrency of 10
ab -n 100 -c 10 -p post_data.json -T application/json http://localhost:5901/api/ai/breakdown
```
*(Note: Create `post_data.json` with `{"taskTitle":"test"}` first)*
