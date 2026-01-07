import OpenAI from 'openai';
import { AIProvider, Step } from './base';
import { config } from '../config';
import { apiManager } from '../lib/api-manager';

export class MimoProvider implements AIProvider {
  constructor() {}

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
        5. 只返回纯 JSON 数组，不要包含 Markdown 标记。格式如下：
        [{"description": "步骤描述", "duration": 10}, ...]
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
        5. Return ONLY a raw JSON array, no Markdown formatting. Format:
        [{"description": "Step description", "duration": 10}, ...]
      `;

    return apiManager.executeWithRetry('mimo', async (apiKey) => {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.xiaomimimo.com/v1',
      });

      const completion = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("No response from AI");
      
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.error("MiMo Breakdown Parse Error. Raw content:", content);
        throw new Error("Failed to parse AI response: " + parseError);
      }
    });
  }

  async suggestNextSteps(taskTitle: string, lang: 'en' | 'zh'): Promise<string[]> {
    const prompt = lang === 'zh' 
      ? `用户刚刚完成了任务："${taskTitle}"。请给出 3 到 5 个后续的建议或下一步计划。保持简短，每条建议一行。只返回纯 JSON 字符串数组，不要Markdown。`
      : `The user just finished the task: "${taskTitle}". Suggest 3 to 5 relevant next steps or proposals. Keep them short, one per line. Return ONLY a raw JSON string array, no Markdown.`;

    try {
      return await apiManager.executeWithRetry('mimo', async (apiKey) => {
        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.xiaomimimo.com/v1',
        });

        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [
              { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
              { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];
        
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch (parseError) {
          console.error("MiMo Suggest Parse Error. Raw content:", content);
          return [];
        }
      });
    } catch (error) {
      console.error("MiMo Suggest Error:", error);
      return [];
    }
  }
}
