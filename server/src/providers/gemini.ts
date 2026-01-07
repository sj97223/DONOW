import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, Step } from "./base";
import { config } from "../config";

const retry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    // Don't retry on auth errors
    if (error.message?.includes('401') || error.status === 401 || error.message?.includes('API key')) throw error;
    
    console.warn(`[Gemini] Request failed, retrying... (${retries} left). Error: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async breakDownTask(taskTitle: string, context?: string, lang: 'en' | 'zh' = 'zh', stepsToKeep?: Step[]): Promise<Step[]> {
    const keptInfo = stepsToKeep && stepsToKeep.length > 0 
      ? (lang === 'zh' ? `\n保留以下步骤（请将其整合进计划中）：${JSON.stringify(stepsToKeep)}` : `\nKeep these steps (integrate them into the plan): ${JSON.stringify(stepsToKeep)}`)
      : "";

    const prompt = lang === 'zh' 
      ? `你是一位高效能专家。
        请将以下任务拆解为 5 到 10 个可执行的具体步骤。
        遵循 SMART 原则 (Specific, Measurable, Achievable, Relevant, Time-bound)。
        
        任务: "${taskTitle}"
        ${context ? `背景/备注: "${context}"` : ""}
        ${keptInfo}

        规则:
        1. 每个步骤预计耗时 5 到 15 分钟。
        2. 每个描述必须以动词开头。
        3. 必须使用中文回复。
        4. 确保生成至少 5 个步骤。
      `
      : `You are a productivity expert. 
        Break down the task into at least 5 to 10 actionable steps.
        Follow SMART principles (Specific, Measurable, Achievable, Relevant, Time-bound).
        
        Task: "${taskTitle}"
        ${context ? `Context/Notes: "${context}"` : ""}
        ${keptInfo}

        Rules:
        1. Each step must take between 5 to 15 minutes.
        2. Start each description with a verb.
        3. Response must be in English.
        4. Ensure at least 5 steps are generated.
      `;

    try {
      const response = await retry(() => this.client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: {
                  type: Type.STRING,
                  description: "The actionable step description.",
                },
                duration: {
                  type: Type.INTEGER,
                  description: "Estimated duration in minutes (5-15).",
                },
              },
              required: ["description", "duration"],
            },
          },
        },
      }));

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Provider Error:", error);
      throw error;
    }
  }

  async suggestNextSteps(taskTitle: string, lang: 'en' | 'zh'): Promise<string[]> {
    const prompt = lang === 'zh' 
      ? `用户刚刚完成了任务："${taskTitle}"。请给出 3 到 5 个后续的建议或下一步计划。保持简短，每条建议一行。`
      : `The user just finished the task: "${taskTitle}". Suggest 3 to 5 relevant next steps or proposals. Keep them short, one per line.`;

    try {
      const response = await retry(() => this.client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }));
      const text = response.text;
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error("Gemini Suggest Error:", error);
      return [];
    }
  }
}
