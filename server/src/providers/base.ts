export interface Step {
  description: string;
  duration: number;
}

export interface AIProvider {
  breakDownTask(taskTitle: string, context?: string, lang?: 'en' | 'zh', stepsToKeep?: Step[]): Promise<Step[]>;
  suggestNextSteps?(taskTitle: string, lang: 'en' | 'zh'): Promise<string[]>;
}
