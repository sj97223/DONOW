import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, Step } from "./base";
import { config } from "../config";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async breakDownTask(taskTitle: string, context?: string): Promise<Step[]> {
    const prompt = `You are a productivity expert. 
      Break down the task into at least 5 to 10 actionable steps.
      Follow SMART principles (Specific, Measurable, Achievable, Relevant, Time-bound).
      
      Task: "${taskTitle}"
      ${context ? `Context/Notes: "${context}"` : ""}

      Rules:
      1. Each step must take between 5 to 15 minutes.
      2. Start each description with a verb.
      3. Use the same language as the user's task input.
      4. Ensure at least 5 steps are generated.
    `;

    try {
      const response = await this.client.models.generateContent({
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
      });

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
      const response = await this.client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const text = response.text;
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error("Gemini Suggest Error:", error);
      return [];
    }
  }
}
