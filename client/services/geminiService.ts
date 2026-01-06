import { SubTask } from "../types";

// Note: In development, ensure your Vite proxy is set up or CORS is allowed.
// In Docker, Nginx will handle the routing /api -> backend:3000
const API_BASE = '/api/ai';

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
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("AI breakdown error:", error);
    // Fallback
    return [
      { description: "准备工作环境 (Prepare environment)", duration: 5 },
      { description: "明确任务的核心目标 (Define core goals)", duration: 10 },
      { description: "拆解第一个具体子任务 (Detail first sub-task)", duration: 10 },
      { description: "执行核心开发/写作内容 (Execute core content)", duration: 15 },
      { description: "初步检查与回顾 (Initial review)", duration: 5 },
    ];
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
