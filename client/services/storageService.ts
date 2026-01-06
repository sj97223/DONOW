
import { BigTask } from "../types";

const STORAGE_KEY_CURRENT = 'donow_current_task';
const STORAGE_KEY_HISTORY = 'donow_history';

export const saveCurrentTask = (task: BigTask | null) => {
  if (task) {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(task));
  } else {
    localStorage.removeItem(STORAGE_KEY_CURRENT);
  }
};

export const loadCurrentTask = (): BigTask | null => {
  const data = localStorage.getItem(STORAGE_KEY_CURRENT);
  return data ? JSON.parse(data) : null;
};

// Modified to Update existing tasks or Add new ones (Upsert)
export const saveToHistory = (task: BigTask) => {
  const history = loadHistory();
  const index = history.findIndex(t => t.id === task.id);
  
  let updatedHistory;
  if (index >= 0) {
    updatedHistory = [...history];
    updatedHistory[index] = task;
  } else {
    updatedHistory = [task, ...history];
  }
  
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
};

export const removeFromHistory = (taskId: string) => {
  const history = loadHistory();
  const updatedHistory = history.filter(t => t.id !== taskId);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
};

export const loadHistory = (): BigTask[] => {
  const data = localStorage.getItem(STORAGE_KEY_HISTORY);
  return data ? JSON.parse(data) : [];
};

export const getStats = () => {
  const history = loadHistory();
  const totalTasks = history.filter(t => t.status === 'completed').length;
  const totalSteps = history.reduce((acc, task) => acc + task.subTasks.filter(st => st.isCompleted).length, 0);
  return { totalTasks, totalSteps };
};
