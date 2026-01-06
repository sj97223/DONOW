export interface SubTask {
  id: string;
  description: string;
  duration: number; // estimated in minutes
  actualDuration?: number; // actual in seconds
  isCompleted: boolean;
  completedAt?: number;
}

export interface BigTask {
  id: string;
  title: string;
  subTasks: SubTask[];
  status: 'planning' | 'active' | 'completed';
  createdAt: number;
  completedAt?: number;
  proposals?: string[]; // AI suggested next steps
}

export type AppView = 'home' | 'planner' | 'executor' | 'focus' | 'success' | 'history' | 'calendar';

export type Language = 'en' | 'zh';

// For Speech Recognition
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}