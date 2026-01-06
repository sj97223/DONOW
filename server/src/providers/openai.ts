import OpenAI from "openai";
import { AIProvider, Step } from "./base";
import { config } from "../config";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async breakDownTask(taskTitle: string, context?: string): Promise<Step[]> {
    const prompt = `You are a productivity expert. Break down the task into 5-10 actionable steps (5-15 mins each).
    Task: "${taskTitle}"
    ${context ? `Context: "${context}"` : ""}
    Return JSON format: [{"description": string, "duration": number}]`;

    try {
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // Ensure model supports this or use system prompt to force JSON
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      
      // OpenAI JSON mode usually requires the prompt to say "JSON".
      // Also the structure might be wrapped. Let's parse and validate.
      const parsed = JSON.parse(content);
      // Handle case where it returns { steps: [...] } or just [...]
      if (Array.isArray(parsed)) return parsed;
      if (parsed.steps && Array.isArray(parsed.steps)) return parsed.steps;
      
      throw new Error("Unexpected JSON structure from OpenAI");
    } catch (error) {
      console.error("OpenAI Provider Error:", error);
      throw error;
    }
  }
}
