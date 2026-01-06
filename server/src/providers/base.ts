export interface Step {
  description: string;
  duration: number;
}

export interface AIProvider {
  breakDownTask(taskTitle: string, context?: string): Promise<Step[]>;
  suggestNextSteps?(taskTitle: string, lang: 'en' | 'zh'): Promise<string[]>;
}
