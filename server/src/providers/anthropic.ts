import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, Step } from "./base";
import { config } from "../config";

export class AnthropicProvider implements AIProvider {
  private client: any;

  constructor() {
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async breakDownTask(taskTitle: string, context?: string): Promise<Step[]> {
    const prompt = `You are a productivity expert. Break down the task into 5-10 actionable steps (5-15 mins each).
    Task: "${taskTitle}"
    ${context ? `Context: "${context}"` : ""}
    
    Output ONLY valid JSON array: [{"description": string, "duration": number}]`;

    try {
      const response = await this.client.messages.create({
        model: config.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const contentBlock = response.content[0];
      if (contentBlock.type !== 'text') throw new Error("Unexpected response type from Anthropic");
      
      const text = contentBlock.text;
      // Simple extraction of JSON array in case there's extra text
      const jsonMatch = text.match(/\[.*\]/s);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Anthropic Provider Error:", error);
      throw error;
    }
  }
}
