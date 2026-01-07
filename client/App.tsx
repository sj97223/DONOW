
import React, { useState, useEffect } from 'react';
import { breakDownTask, getNextSteps, checkApiStatus } from './services/geminiService';
import { saveCurrentTask, loadCurrentTask, saveToHistory, loadHistory, removeFromHistory } from './services/storageService';
import { BigTask, SubTask, AppView, IWindow, Language } from './types';
import { 
  SparklesIcon, MicIcon, PlusIcon, TrashIcon, 
  ArrowUpIcon, ArrowDownIcon, PlayIcon, CheckCircleIcon,
  HistoryIcon, HomeIcon, ChevronLeftIcon, ClockIcon, CalendarIcon, HistoryIcon as RefreshIcon 
} from './components/Icons';
import { FocusTimer } from './components/FocusTimer';
import { Calendar } from './components/Calendar';
import { APIStatusPanel } from './components/APIStatusPanel';

// --- Translations ---

const TRANSLATIONS = {
  en: {
    title: "DoNow",
    subtitle: "Stop thinking. Start moving.",
    placeholder: "e.g. Write my thesis paper...",
    thinking: "Thinking...",
    breakdown: "MiMo Breakdown",
    history: "My Tasks",
    steps: "steps",
    completed: "completed",
    noHistory: "No tasks yet.",
    reviewPlan: "Review the plan.",
    reviewPlanDesc: "MiMo has broken it down. Adjust if needed.",
    addStep: "Add Step",
    startDoing: "Start Doing",
    inProgress: "In Progress",
    nextStep: "Next Step",
    taskComplete: "Task Complete!",
    successMessage: "You crushed it! That was easier than you thought.",
    backHome: "Back to Home",
    taskDetails: "Task Details",
    focusMode: "Focus Mode",
    exitFocus: "Exit Focus",
    pause: "Pause",
    resume: "Resume",
    done: "Done",
    encouragement: "One step at a time. You are doing great.",
    completedOn: "Completed on",
    completedSteps: "Completed Steps",
    editPrompt: "Edit step:",
    deleteTask: "Delete task",
    totalEstTime: "Estimated Total Time",
    mins: "mins",
    calendar: "Calendar",
    noTasksOnDate: "No tasks completed on this date.",
    actualTime: "Actual Time Taken",
    estTime: "Estimated Time",
    proposals: "Next Steps Proposals",
    generatingProposals: "Generating next steps...",
    regenerate: "Regenerate with MiMo",
    regenerateFeedback: "Add instructions (e.g. 'more focus on coding')",
    save: "Save",
    cancel: "Cancel",
    editStep: "Edit Step",
    newStep: "New Step",
    duration: "Duration (min)",
    description: "Description",
    selectToKeep: "Select steps to keep",
    unfinishedAlert: "UNFINISHED",
    continue: "Continue",
    abandonTitle: "Abandon Plan?",
    abandonMessage: "This plan will be discarded. You can start over later.",
    confirmAbandon: "Abandon",
    confirmDelete: "Delete Task?",
    deleteMessage: "This will permanently remove this task record."
  },
  zh: {
    title: "立动",
    subtitle: "拒绝拖延，立刻行动。",
    placeholder: "例如：写毕业论文、准备演讲...",
    thinking: "思考中...",
    breakdown: "MiMo 拆解",
    history: "我的任务",
    steps: "步",
    completed: "已完成",
    noHistory: "暂无任务。",
    reviewPlan: "预览计划",
    reviewPlanDesc: "MiMo 已将其拆解为小任务。如有需要可调整。",
    addStep: "添加步骤",
    startDoing: "开始执行",
    inProgress: "进行中",
    nextStep: "下一步",
    taskComplete: "任务完成！",
    successMessage: "你太棒了！轻松搞定。",
    backHome: "返回主页",
    taskDetails: "任务详情",
    focusMode: "专注模式",
    exitFocus: "退出专注",
    pause: "暂停",
    resume: "继续",
    done: "完成",
    encouragement: "一步一个脚印，你做得很好。",
    completedOn: "完成于",
    completedSteps: "已完成步骤",
    editPrompt: "修改步骤：",
    deleteTask: "删除任务",
    totalEstTime: "预计总耗时",
    mins: "分钟",
    calendar: "日历",
    noTasksOnDate: "该日期无完成任务。",
    actualTime: "实际耗时",
    estTime: "预计耗时",
    proposals: "后续建议",
    generatingProposals: "正在生成后续建议...",
    regenerate: "重新 MiMo 生成",
    regenerateFeedback: "输入提示词 (例如：'增加代码实现细节')",
    save: "保存",
    cancel: "取消",
    editStep: "编辑步骤",
    newStep: "新步骤",
    duration: "耗时 (分钟)",
    description: "内容描述",
    selectToKeep: "勾选需要保留的步骤 (包含新增)",
    unfinishedAlert: "未完成",
    continue: "继续",
    abandonTitle: "放弃计划？",
    abandonMessage: "该拆解计划将被丢弃，你需要重新生成或手动输入。",
    confirmAbandon: "确认放弃",
    confirmDelete: "确认删除？",
    deleteMessage: "此操作将永久删除该任务记录。"
  }
};

// --- Helper Components ---

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const TaskItem = ({ 
  task, index, total, isPlanning, 
  onToggle, onDelete, onMoveUp, onMoveDown, onClick, isSelected, onSelect 
}: any) => {
  return (
    <div 
      onClick={onClick}
      className={`
        group relative p-4 rounded-2xl border transition-all duration-300
        ${task.isCompleted 
          ? 'bg-[var(--bg-secondary)] border-[var(--border-color)] opacity-40' 
          : isPlanning
             ? `bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--border-color)] ${isSelected ? 'ring-2 ring-accent-yellow' : ''}`
             : 'bg-accent-purple border-accent-purple shadow-lg shadow-purple-900/20 transform scale-[1.02]' 
        }
        ${!task.isCompleted && !isPlanning ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isPlanning ? (
             <button 
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className={`flex items-center justify-center w-6 h-6 rounded-full border transition-colors
                   ${isSelected ? 'bg-accent-yellow border-accent-yellow text-black' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'}
                `}
             >
               {isSelected ? <CheckCircleIcon className="w-4 h-4" /> : <span className="text-xs">{index + 1}</span>}
             </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                ${task.isCompleted 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-[var(--bg-secondary)] border-zinc-900 text-transparent'
                }
              `}
            >
               {task.isCompleted && <CheckCircleIcon className="w-4 h-4 text-[var(--text-primary)]" />}
               {!task.isCompleted && <div className="w-2 h-2 rounded-full bg-[var(--bg-secondary)]"></div>}
            </button>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-lg leading-snug ${task.isCompleted ? 'text-[var(--text-secondary)] line-through' : (isPlanning ? 'text-zinc-200' : 'text-zinc-900 font-bold')}`}>
            {task.description}
          </p>
          <div className="flex items-center gap-3 mt-1">
             <p className={`text-xs flex items-center gap-1 ${task.isCompleted || isPlanning ? 'text-[var(--text-secondary)]' : 'text-zinc-800 opacity-80'}`}>
                <ClockIcon className="w-3 h-3" />
                {task.duration}m
            </p>
            {task.actualDuration && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                    Act: {Math.round(task.actualDuration / 60)}m
                </p>
            )}
          </div>
        </div>

        {isPlanning && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
              disabled={index === 0}
              className="p-1 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)] disabled:opacity-20"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={index === total - 1}
              className="p-1 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)] disabled:opacity-20"
            >
              <ArrowDownIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {isPlanning && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="self-center p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-secondary)] rounded-lg ml-1 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentTask, setCurrentTask] = useState<BigTask | null>(null);
  const [view, setView] = useState<AppView>('home');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<BigTask[]>([]);
  const [historyDetail, setHistoryDetail] = useState<BigTask | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('zh');
  const [proposals, setProposals] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'verified' | 'missing' | 'checking'>('checking');
  const [apiInfo, setApiInfo] = useState<{ provider?: string, model?: string }>({});
  
  // Settings
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#09090b');
      root.style.setProperty('--bg-secondary', '#18181b');
      root.style.setProperty('--border-color', '#27272a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#71717a');
      root.style.setProperty('--bg-bottom-bar', '#121212');
    } else {
      root.style.setProperty('--bg-primary', '#f5f5f5');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--bg-bottom-bar', '#f5f5f5');
    }
  }, [theme]);

  // Selection and Modals
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<SubTask | null>(null);
  const [regenFeedback, setRegenFeedback] = useState('');

  const t = TRANSLATIONS;

  // Voice Input
  const startListening = () => {
    const Win = window as unknown as IWindow;
    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Not supported");
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    recognition.onresult = (e: any) => setInputText(e.results[0][0].transcript);
    recognition.start();
  };

  useEffect(() => {
    const saved = loadCurrentTask();
    if (saved) {
      setCurrentTask(saved);
      if (saved.status === 'planning') setView('planner');
      else if (saved.status === 'active') setView('executor');
    }
    setHistory(loadHistory());
    checkApiStatus().then(s => {
      setApiStatus(s.status);
      setApiInfo({ provider: s.provider, model: s.model });
    });
  }, []);

  // Sync current task changes to both current storage and history (for persistence)
  useEffect(() => { 
    saveCurrentTask(currentTask); 
    if (currentTask) {
        saveToHistory(currentTask);
        // Update history view if we are on it
        setHistory(loadHistory());
    }
  }, [currentTask]);

  useEffect(() => {
    if (view === 'success' && currentTask && (!currentTask.proposals || currentTask.proposals.length === 0)) {
       const fetchProposals = async () => {
         const steps = await getNextSteps(currentTask.title, lang);
         setProposals(steps);
         const updatedTask = { ...currentTask, proposals: steps };
         setCurrentTask(updatedTask);
         saveToHistory(updatedTask);
         setHistory(loadHistory());
       };
       fetchProposals();
    } else if (view === 'success' && currentTask?.proposals) {
        setProposals(currentTask.proposals);
    }
  }, [view, currentTask?.status]);

  const handleCreateTask = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const steps = await breakDownTask(inputText, lang);
      const newTask: BigTask = {
        id: Date.now().toString(),
        title: inputText,
        subTasks: steps.map((s, i) => ({ ...s, id: `${Date.now()}-${i}`, isCompleted: false })),
        status: 'planning',
        createdAt: Date.now(),
      };
      setCurrentTask(newTask);
      saveToHistory(newTask); // Save immediately
      setView('planner');
    } catch (e: any) { 
      console.error(e);
      alert(t[lang].title + " Error: " + (e.message || "Failed to generate steps")); 
    } finally { setIsProcessing(false); }
  };

  const handleRegenerate = async () => {
    if (!currentTask) return;
    setIsProcessing(true);
    setIsRegenModalOpen(false);
    try {
      // Logic: Selected items are the ones to REGENERATE (discard). Unselected are KEPT.
      // If nothing selected, regenerate ALL (keep nothing).
      const keptSteps = selectedSteps.size > 0 
        ? currentTask.subTasks.filter(s => !selectedSteps.has(s.id))
        : [];

      const steps = await breakDownTask(currentTask.title, lang, regenFeedback, keptSteps);
      setCurrentTask({
        ...currentTask,
        subTasks: steps.map((s, i) => ({ ...s, id: `${Date.now()}-${i}`, isCompleted: false }))
      });
      setSelectedSteps(new Set());
      setRegenFeedback('');
    } catch (e: any) { 
      console.error(e);
      alert(t[lang].title + " Error: " + (e.message || "Failed to regenerate")); 
    } finally { setIsProcessing(false); }
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t[lang].confirmDelete + "\n" + t[lang].deleteMessage)) {
        removeFromHistory(taskId);
        if (currentTask?.id === taskId) {
            setCurrentTask(null);
            saveCurrentTask(null);
        }
        setHistory(loadHistory());
    }
  };

  const handleStartPlan = () => {
    if (!currentTask) return;
    const updated = { ...currentTask, status: 'active' as const };
    setCurrentTask(updated);
    saveToHistory(updated);
    setView('executor');
  };

  const saveStepEdit = (desc: string, dur: number) => {
    if (!currentTask) return;
    if (editingStep) {
        const updatedSteps = currentTask.subTasks.map(s => s.id === editingStep.id ? { ...s, description: desc, duration: dur } : s);
        setCurrentTask({ ...currentTask, subTasks: updatedSteps });
    } else {
        const newStep: SubTask = { id: Date.now().toString(), description: desc, duration: dur, isCompleted: false };
        setCurrentTask({ ...currentTask, subTasks: [...currentTask.subTasks, newStep] });
    }
    setIsEditModalOpen(false);
    setEditingStep(null);
  };

  const handleMoveStep = (index: number, direction: -1 | 1) => {
    if (!currentTask) return;
    const items = [...currentTask.subTasks];
    const [reorderedItem] = items.splice(index, 1);
    items.splice(index + direction, 0, reorderedItem);
    setCurrentTask({ ...currentTask, subTasks: items });
  };

  const startFocusMode = (stepId: string) => {
    setActiveStepId(stepId);
    setView('focus');
  };

  const completeFocusStep = (elapsedSeconds: number) => {
    if (!currentTask || !activeStepId) return;
    const updatedSteps = currentTask.subTasks.map(s => s.id === activeStepId ? { ...s, isCompleted: true, completedAt: Date.now(), actualDuration: elapsedSeconds } : s);
    const allDone = updatedSteps.every(s => s.isCompleted);
    const updatedTask = { ...currentTask, subTasks: updatedSteps, status: allDone ? 'completed' as const : 'active' as const, completedAt: allDone ? Date.now() : undefined };
    setCurrentTask(updatedTask);
    setActiveStepId(null);
    if (allDone) { setView('success'); saveToHistory(updatedTask); setHistory(loadHistory()); } else { setView('executor'); }
  };

  const handleFinishTask = () => {
    setCurrentTask(null);
    setInputText('');
    setProposals([]);
    setHistory(loadHistory());
    setView('home');
  };

  const resumeTask = (task: BigTask) => {
      setCurrentTask(task);
      if (task.status === 'planning') setView('planner');
      else setView('executor');
  };

  const getTotalTime = (task: BigTask | null, type: 'est' | 'act') => {
      if (!task) return 0;
      return type === 'est' 
        ? task.subTasks.reduce((acc, curr) => acc + curr.duration, 0)
        : Math.round(task.subTasks.reduce((acc, curr) => acc + (curr.actualDuration || 0), 0) / 60);
  }

  // Views
  const renderHome = () => (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 pt-8 bg-[var(--bg-primary)] 2xl:max-w-2xl 2xl:p-12 transition-all duration-300">
        <header className="mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight 2xl:text-6xl">{t[lang].title}</h1>
                <p className="text-[var(--text-secondary)] 2xl:text-xl">{t[lang].subtitle}</p>
            </div>
            <div className="flex gap-3 items-start">
                <div className="flex flex-col items-end gap-1">
                    {/* Replaced offline div with consistent button style or unified panel logic */}
                    {/* The APIStatusPanel component now handles the detailed status. 
                        We keep a minimal indicator here if needed, or rely on the panel.
                        Per user request Scheme B: we remove the old offline div logic or replace it.
                        Here we just keep the controls and let the bottom panel handle status. */}
                </div>
                <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-1 h-fit 2xl:p-2">
                    <button onClick={() => setView('calendar')} className="px-2 py-1 text-xs rounded-md font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 2xl:text-base 2xl:px-4 2xl:py-2">
                        <CalendarIcon className="w-3 h-3 2xl:w-5 2xl:h-5" />
                    </button>
                    <div className="w-px bg-[var(--bg-secondary)] mx-1"></div>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-2 py-1 text-xs rounded-md font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors 2xl:text-base 2xl:px-4 2xl:py-2">
                        {theme === 'dark' ? '☀' : '🌙'}
                    </button>
                    <div className="w-px bg-[var(--bg-secondary)] mx-1"></div>
                    <button onClick={() => setMuted(!muted)} className="px-2 py-1 text-xs rounded-md font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors 2xl:text-base 2xl:px-4 2xl:py-2">
                        {muted ? '🔇' : '🔊'}
                    </button>
                    <div className="w-px bg-[var(--bg-secondary)] mx-1"></div>
                    <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs rounded-md font-bold transition-colors 2xl:text-base 2xl:px-4 2xl:py-2 ${lang === 'en' ? 'bg-zinc-700 text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>EN</button>
                    <button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs rounded-md font-bold transition-colors 2xl:text-base 2xl:px-4 2xl:py-2 ${lang === 'zh' ? 'bg-zinc-700 text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>中</button>
                </div>
            </div>
        </header>

        <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-color)] mb-8 relative overflow-hidden group 2xl:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-yellow opacity-5 blur-2xl rounded-full pointer-events-none 2xl:w-64 2xl:h-64"></div>
            <div className="relative mb-4">
                <textarea
                    className="w-full p-4 pr-12 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:ring-1 focus:ring-accent-yellow focus:border-accent-yellow outline-none resize-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all 2xl:text-xl 2xl:p-6"
                    rows={3}
                    placeholder={t[lang].placeholder}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button onClick={startListening} className="absolute bottom-3 right-3 p-2 text-[var(--text-secondary)] hover:text-accent-yellow transition 2xl:bottom-5 2xl:right-5"><MicIcon className="2xl:w-6 2xl:h-6" /></button>
            </div>
            <button
                onClick={handleCreateTask}
                disabled={!inputText.trim() || isProcessing}
                className={`w-full py-4 rounded-2xl font-bold text-black shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 2xl:py-6 2xl:text-xl
                    ${isProcessing ? 'bg-zinc-700 cursor-not-allowed text-[var(--text-secondary)]' : 'bg-accent-yellow hover:bg-yellow-300'}
                `}
            >
                {isProcessing ? <span>{t[lang].thinking}</span> : <><SparklesIcon className="w-5 h-5 2xl:w-7 2xl:h-7" /><span>{t[lang].breakdown}</span></>}
            </button>
        </div>

        <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--text-primary)] tracking-wide text-sm uppercase 2xl:text-lg">{t[lang].history}</h3>
                <button onClick={() => setView('calendar')} className="text-xs font-medium text-[var(--text-secondary)] hover:text-accent-yellow flex items-center gap-1 2xl:text-base"><CalendarIcon className="w-4 h-4 2xl:w-5 2xl:h-5" />{t[lang].calendar}</button>
            </div>
            {history.length === 0 ? (
                <div className="text-center text-[var(--text-secondary)] py-12"><HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-20 2xl:w-20 2xl:h-20" /><p className="text-sm 2xl:text-lg">{t[lang].noHistory}</p></div>
            ) : (
                <div className="space-y-3 pb-8 2xl:space-y-4">
                    {[...history].sort((a, b) => {
                        if (a.status !== 'completed' && b.status === 'completed') return -1;
                        if (a.status === 'completed' && b.status !== 'completed') return 1;
                        if (a.status === 'completed') return (b.completedAt || 0) - (a.completedAt || 0);
                        return b.createdAt - a.createdAt;
                    }).map(task => {
                        const isCompleted = task.status === 'completed';
                        return (
                            <div 
                                key={task.id} 
                                onClick={() => isCompleted ? (setHistoryDetail(task), setView('history')) : resumeTask(task)} 
                                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition relative overflow-hidden group bg-[var(--bg-secondary)] 2xl:p-6
                                    ${isCompleted 
                                        ? 'border-[var(--border-color)] hover:border-[var(--text-secondary)]' 
                                        : 'border-red-500/50 hover:border-red-400 shadow-sm shadow-red-900/10'
                                    }`}
                            >
                                { /* Unfinished Indicator Background */ }
                                {!isCompleted && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                )}
                                
                                <div className="flex-1 min-w-0 ml-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`truncate font-medium group-hover:text-[var(--text-primary)] 2xl:text-lg ${isCompleted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{task.title}</span>
                                        {!isCompleted && <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider 2xl:text-xs">{t[lang].unfinishedAlert}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] 2xl:text-sm">
                                        <span className="flex items-center gap-1"><CheckCircleIcon className={`w-3 h-3 2xl:w-4 2xl:h-4 ${isCompleted ? 'text-green-500' : 'text-[var(--text-secondary)]'}`} />{task.subTasks.filter(s => s.isCompleted).length}/{task.subTasks.length}</span>
                                        <span>•</span>
                                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                        <ChevronLeftIcon className="w-5 h-5 text-[var(--text-secondary)] rotate-180 2xl:w-6 2xl:h-6" />
                                    ) : (
                                        <div className="p-2 bg-red-500/10 rounded-full text-red-500 group-hover:bg-red-500 group-hover:text-white transition 2xl:p-3">
                                            <PlayIcon className="w-4 h-4 2xl:w-5 2xl:h-5" />
                                        </div>
                                    )}
                                    <button 
                                        onClick={(e) => handleDeleteTask(task.id, e)}
                                        className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-primary)] rounded-full transition opacity-0 group-hover:opacity-100 2xl:p-3"
                                    >
                                        <TrashIcon className="w-4 h-4 2xl:w-5 2xl:h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        <div className="fixed bottom-2 right-4 text-[10px] text-[var(--text-secondary)] opacity-80 pointer-events-none z-50 2xl:text-xs">
            v0.0.2
        </div>
    </div>
  );

  const renderPlanner = () => {
    if (!currentTask) return null;
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-[var(--bg-primary)]">
        <div className="p-6 bg-[var(--bg-primary)]/80 backdrop-blur-sm sticky top-0 border-b border-[var(--border-color)] z-10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsAbandonModalOpen(true)} className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"><ChevronLeftIcon /></button>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{t[lang].reviewPlan}</h2>
                </div>
                <button onClick={() => { setCurrentTask(null); setView('home'); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"><HomeIcon /></button>
            </div>
            <div className="flex justify-between items-center text-sm text-[var(--text-secondary)]">
                <p>{t[lang].reviewPlanDesc}</p>
                <div className="flex items-center gap-1 font-mono text-accent-yellow bg-[var(--bg-secondary)] px-2 py-1 rounded">
                    <ClockIcon className="w-3 h-3" />{getTotalTime(currentTask, 'est')} {t[lang].mins}
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentTask.subTasks.map((step, index) => (
                <TaskItem 
                    key={step.id} task={step} index={index} total={currentTask.subTasks.length} isPlanning={true}
                    onDelete={() => setCurrentTask({ ...currentTask, subTasks: currentTask.subTasks.filter(s => s.id !== step.id) })}
                    onMoveUp={() => handleMoveStep(index, -1)} onMoveDown={() => handleMoveStep(index, 1)}
                    onClick={() => { setEditingStep(step); setIsEditModalOpen(true); }}
                    isSelected={selectedSteps.has(step.id)}
                    onSelect={() => {
                        const next = new Set(selectedSteps);
                        next.has(step.id) ? next.delete(step.id) : next.add(step.id);
                        setSelectedSteps(next);
                    }}
                />
            ))}
            <div className="flex gap-2">
                <button onClick={() => { setEditingStep(null); setIsEditModalOpen(true); }} className="flex-1 py-4 rounded-2xl border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:text-accent-purple font-medium flex items-center justify-center gap-2 transition"><PlusIcon className="w-5 h-5" />{t[lang].addStep}</button>
                <button onClick={() => setIsRegenModalOpen(true)} className="flex-1 py-4 rounded-2xl border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:text-accent-yellow font-medium flex items-center justify-center gap-2 transition"><RefreshIcon className="w-5 h-5 rotate-45" />{t[lang].regenerate}</button>
            </div>
        </div>
        <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
             <button onClick={handleStartPlan} className="w-full py-4 rounded-2xl font-bold text-black bg-accent-yellow shadow-lg hover:bg-yellow-300 transition flex items-center justify-center gap-2 active:scale-95"><PlayIcon className="w-5 h-5" />{t[lang].startDoing}</button>
        </div>

        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingStep ? t[lang].editStep : t[lang].newStep}>
            <div className="space-y-4">
                <div><label className="text-xs text-[var(--text-secondary)] mb-1 block uppercase">{t[lang].description}</label><input autoFocus id="stepDesc" defaultValue={editingStep?.description || ''} className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-accent-yellow outline-none" /></div>
                <div><label className="text-xs text-[var(--text-secondary)] mb-1 block uppercase">{t[lang].duration}</label><input id="stepDur" type="number" defaultValue={editingStep?.duration || 10} className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-accent-yellow outline-none" /></div>
                <div className="flex gap-3"><button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-[var(--text-secondary)] font-bold">{t[lang].cancel}</button>
                <button onClick={() => {
                    const desc = (document.getElementById('stepDesc') as HTMLInputElement).value;
                    const dur = parseInt((document.getElementById('stepDur') as HTMLInputElement).value) || 10;
                    saveStepEdit(desc, dur);
                }} className="flex-1 py-3 bg-accent-yellow text-black rounded-xl font-bold">{t[lang].save}</button></div>
            </div>
        </Modal>

        <Modal isOpen={isRegenModalOpen} onClose={() => setIsRegenModalOpen(false)} title={t[lang].regenerate}>
            <div className="space-y-4">
                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">{t[lang].selectToKeep}</p>
                
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {currentTask.subTasks.map((step, index) => (
                        <div key={step.id} 
                             onClick={() => {
                                const next = new Set(selectedSteps);
                                next.has(step.id) ? next.delete(step.id) : next.add(step.id);
                                setSelectedSteps(next);
                             }}
                             className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all
                                ${selectedSteps.has(step.id) 
                                    ? 'bg-[var(--bg-secondary)] border-accent-yellow/50' 
                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--border-color)]'}
                             `}
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border mr-3 transition-colors
                                ${selectedSteps.has(step.id) ? 'bg-accent-yellow border-accent-yellow text-black' : 'border-zinc-600'}
                            `}>
                                {selectedSteps.has(step.id) && <CheckCircleIcon className="w-3 h-3" />}
                            </div>
                            <span className={`text-sm ${selectedSteps.has(step.id) ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{step.description}</span>
                        </div>
                    ))}
                </div>

                <div className="h-px bg-[var(--bg-secondary)] my-2"></div>

                <textarea 
                    placeholder={t[lang].regenerateFeedback} value={regenFeedback} onChange={(e) => setRegenFeedback(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-accent-yellow outline-none min-h-[100px]"
                />
                <button onClick={handleRegenerate} disabled={isProcessing} className="w-full py-3 bg-accent-yellow text-black rounded-xl font-bold flex items-center justify-center gap-2">
                    {isProcessing ? t[lang].thinking : <><RefreshIcon className="w-4 h-4" />{t[lang].regenerate}</>}
                </button>
            </div>
        </Modal>

        <Modal isOpen={isAbandonModalOpen} onClose={() => setIsAbandonModalOpen(false)} title={t[lang].abandonTitle}>
            <div className="space-y-6">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{t[lang].abandonMessage}</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsAbandonModalOpen(false)} className="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl font-bold">{t[lang].cancel}</button>
                    <button onClick={() => {
                        if (currentTask) {
                            removeFromHistory(currentTask.id);
                        }
                        setIsAbandonModalOpen(false);
                        setCurrentTask(null);
                        saveCurrentTask(null);
                        setHistory(loadHistory());
                        setView('home');
                    }} className="flex-1 py-3 bg-red-500 text-[var(--text-primary)] rounded-xl font-bold">{t[lang].confirmAbandon}</button>
                </div>
            </div>
        </Modal>
      </div>
    );
  };

  const renderExecutor = () => {
    if (!currentTask) return null;
    const progress = (currentTask.subTasks.filter(s => s.isCompleted).length / currentTask.subTasks.length) * 100;
    const nextStep = currentTask.subTasks.find(s => !s.isCompleted);
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-[var(--bg-primary)] relative">
         <div className="p-6 bg-[var(--bg-primary)] sticky top-0 border-b border-zinc-900 z-10">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setView('home')} className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"><HomeIcon /></button>
                <span className="text-xs font-bold text-accent-yellow tracking-widest uppercase border border-yellow-900/30 bg-yellow-900/10 px-2 py-1 rounded">{t[lang].inProgress}</span>
                <div className="w-8"></div>
            </div>
            <div className="flex items-end justify-between mb-2"><h2 className="text-xl font-bold text-[var(--text-primary)] truncate max-w-[70%]">{currentTask.title}</h2><span className="text-xs font-mono text-[var(--text-secondary)] mb-1">{Math.round(progress)}%</span></div>
            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden"><div className="bg-accent-yellow h-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
            {currentTask.subTasks.map((step, index) => (
                <TaskItem 
                    key={step.id} task={step} index={index} isPlanning={false}
                    onToggle={() => {
                        const updated = currentTask.subTasks.map(s => s.id === step.id ? { ...s, isCompleted: !s.isCompleted, completedAt: !s.isCompleted ? Date.now() : undefined } : s);
                        const updatedTask = { ...currentTask, subTasks: updated };
                        setCurrentTask(updatedTask);
                        saveToHistory(updatedTask);
                    }}
                    onClick={() => !step.isCompleted && startFocusMode(step.id)}
                />
            ))}
        </div>
        {nextStep && (
            <div className="absolute bottom-8 left-0 right-0 px-6 z-20 bg-[var(--bg-bottom-bar)] pb-8 pt-4"><button onClick={() => startFocusMode(nextStep.id)} className="w-full py-4 rounded-2xl font-bold text-black bg-accent-yellow shadow-2xl hover:bg-yellow-300 transition flex items-center justify-between px-6 group active:scale-95"><span className="flex flex-col items-start text-left"><span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">{t[lang].nextStep}</span><span className="text-sm truncate max-w-[200px] leading-tight">{nextStep.description}</span></span><div className="bg-black/10 p-2 rounded-full"><PlayIcon className="w-5 h-5" /></div></button></div>
        )}
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 bg-[var(--bg-primary)] overflow-y-auto transition-colors duration-300">
        <div className="flex flex-col items-center text-center mt-8">
            <div className="w-24 h-24 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center mb-8 animate-bounce"><SparklesIcon className="w-10 h-10 text-accent-yellow" /></div>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mb-3">{t[lang].taskComplete}</h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-xs">{t[lang].successMessage}</p>
            <div className="w-full bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] mb-8 grid grid-cols-2 gap-4">
                <div className="text-center border-r border-[var(--border-color)]"><p className="text-xs text-[var(--text-secondary)] uppercase mb-1">{t[lang].estTime}</p><p className="text-2xl font-bold text-[var(--text-primary)]">{getTotalTime(currentTask, 'est')}m</p></div>
                <div className="text-center"><p className="text-xs text-[var(--text-secondary)] uppercase mb-1">{t[lang].actualTime}</p><p className={`text-2xl font-bold text-green-400`}>{getTotalTime(currentTask, 'act')}m</p></div>
            </div>
            <div className="w-full text-left mb-8">
                 <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-4">{t[lang].proposals}</h3>
                 {proposals.length === 0 ? <div className="p-4 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] text-[var(--text-secondary)] text-sm animate-pulse">{t[lang].generatingProposals}</div> : (
                    <ul className="space-y-3">
                        {proposals.map((prop, idx) => (
                            <li key={idx} onClick={() => { setInputText(prop); setView('home'); }} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-sm flex gap-3 items-center cursor-pointer hover:border-accent-purple transition active:scale-95 group">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-purple group-hover:scale-150 transition-transform"></span>{prop}
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
            <button onClick={handleFinishTask} className="w-full py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-lg hover:opacity-90 transition transform active:scale-95 mb-8">{t[lang].backHome}</button>
        </div>
    </div>
  );

  const renderHistoryDetail = () => {
    if (!historyDetail) return null;
    return (
        <div className="flex flex-col h-full max-w-md mx-auto bg-[var(--bg-primary)]">
            <div className="p-4 border-b border-zinc-900 flex items-center gap-4">
                <button onClick={() => { setHistoryDetail(null); setView('home'); }} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-full"><ChevronLeftIcon /></button>
                <h2 className="font-bold text-[var(--text-primary)]">{t[lang].taskDetails}</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex-1">{historyDetail.title}</h1>
                    <button 
                        onClick={(e) => {
                            handleDeleteTask(historyDetail.id, e);
                            setHistoryDetail(null);
                            setView('home');
                        }}
                        className="p-3 text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-secondary)] rounded-full transition"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-sm text-[var(--text-secondary)] mb-8"><span>{t[lang].completedOn} {new Date(historyDetail.completedAt || 0).toLocaleDateString()}</span></div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl"><span className="text-xs text-[var(--text-secondary)] block">{t[lang].estTime}</span><span className="text-xl font-bold text-[var(--text-primary)]">{getTotalTime(historyDetail, 'est')}m</span></div>
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl"><span className="text-xs text-[var(--text-secondary)] block">{t[lang].actualTime}</span><span className="text-xl font-bold text-green-400">{getTotalTime(historyDetail, 'act')}m</span></div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t[lang].completedSteps}</h3>
                    <ul className="space-y-6 relative border-l border-[var(--border-color)] ml-2 pl-6">
                        {historyDetail.subTasks.map((step, i) => (
                            <li key={i} className="relative"><div className="absolute -left-[29px] top-1 bg-[var(--bg-secondary)] w-4 h-4 rounded-full border border-[var(--border-color)]"></div><p className="text-[var(--text-primary)] font-medium mb-1">{step.description}</p><p className="text-xs text-[var(--text-secondary)]">Est: {step.duration}m • Act: {Math.round((step.actualDuration || 0) / 60)}m</p></li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
  };

  const renderContent = () => {
    if (view === 'planner') return renderPlanner();
    if (view === 'executor') return renderExecutor();
    if (view === 'success') return renderSuccess();
    if (view === 'history') return renderHistoryDetail();
    if (view === 'calendar') return <Calendar history={history} onBack={() => setView('home')} lang={lang} t={t} onTaskClick={(task) => { setHistoryDetail(task); setView('history'); }} onResume={resumeTask} />;
    if (view === 'focus' && currentTask && activeStepId) {
      const step = currentTask.subTasks.find(s => s.id === activeStepId);
      if (step) return <FocusTimer task={step} onComplete={completeFocusStep} onBack={() => setView('executor')} lang={lang} t={t} volume={volume} muted={muted} />;
    }
    return renderHome();
  };

  return (
    <>
      {renderContent()}
      <APIStatusPanel />
    </>
  );
};

export default App;
