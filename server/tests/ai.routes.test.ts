import request from 'supertest';
import app from '../src/app';

// Mock the GeminiProvider
jest.mock('../src/providers/gemini', () => {
  return {
    GeminiProvider: jest.fn().mockImplementation(() => {
      return {
        breakDownTask: jest.fn().mockResolvedValue([
          { description: 'Step 1', duration: 10 },
          { description: 'Step 2', duration: 15 },
        ]),
        suggestNextSteps: jest.fn().mockResolvedValue([
          'Next Step 1',
          'Next Step 2'
        ]),
      };
    }),
  };
});

// Mock config to ensure Gemini is selected
jest.mock('../src/config', () => ({
  config: {
    provider: 'gemini',
    apiKey: 'test-key',
    model: 'test-model',
  },
  PORT: 3000,
}));

describe('AI Routes', () => {
  it('should return breakdown steps', async () => {
    const res = await request(app)
      .post('/api/ai/breakdown')
      .send({ taskTitle: 'Test Task' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].description).toBe('Step 1');
  });

  it('should return 400 if taskTitle is missing', async () => {
    const res = await request(app)
      .post('/api/ai/breakdown')
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return suggestions', async () => {
    const res = await request(app)
      .post('/api/ai/suggest')
      .send({ taskTitle: 'Test Task' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toBe('Next Step 1');
  });
});
