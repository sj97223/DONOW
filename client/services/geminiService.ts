import { SubTask } from "../types";

// Note: In development, ensure your Vite proxy is set up or CORS is allowed.
// In Docker, Nginx will handle the routing /api -> backend:3000
const API_BASE = '/api/ai';

export const checkApiStatus = async (): Promise<{ status: 'verified' | 'missing', provider?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (e) {
    console.warn("API Status check failed", e);
    return { status: 'missing' };
  }
};

export const breakDownTask = async (taskDescription: string, feedback?: string, stepsToKeep?: SubTask[]): Promise<Omit<SubTask, 'id' | 'isCompleted'>[]> => {
  try {
    const response = await fetch(`${API_BASE}/breakdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskTitle: taskDescription,
        context: feedback ? `User feedback: ${feedback}` : undefined
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("AI breakdown error:", error);
    throw error;
  }
};

export const getNextSteps = async (taskTitle: string, lang: 'en' | 'zh'): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskTitle, lang })
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("AI proposals error:", error);
    return [];
  }
};
