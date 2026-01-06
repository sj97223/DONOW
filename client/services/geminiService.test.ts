import { describe, it, expect, vi, beforeEach } from 'vitest';
import { breakDownTask } from './geminiService';

global.fetch = vi.fn();

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('breakDownTask should return steps on success', async () => {
    const mockResponse = [
      { description: 'Step 1', duration: 10 },
      { description: 'Step 2', duration: 15 }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await breakDownTask('Test Task');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/ai/breakdown', expect.any(Object));
  });

  it('breakDownTask should return fallback on failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500
    });

    const result = await breakDownTask('Test Task');
    expect(result).toHaveLength(5); // Fallback has 5 steps
    expect(result[0].description).toContain('Prepare environment'); // 准备工作环境
  });
});
