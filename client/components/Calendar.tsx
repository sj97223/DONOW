import React, { useState } from 'react';
import { BigTask, Language } from '../types';
import { ChevronLeftIcon, CheckCircleIcon, ClockIcon } from './Icons';

interface CalendarProps {
  history: BigTask[];
  onBack: () => void;
  lang: Language;
  t: any;
  onTaskClick: (task: BigTask) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ history, onBack, lang, t, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getTaskDate = (task: BigTask) => {
    return new Date(task.status === 'completed' ? (task.completedAt || task.createdAt) : task.createdAt);
  };

  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    return history.filter(task => {
       const d = getTaskDate(task);
       return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] p-6 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-full transition border border-[var(--border-color)]"><ChevronLeftIcon /></button>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{t[lang].calendar}</h2>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-color)] mb-6 shadow-sm">
         <div className="flex items-center justify-between mb-6">
             <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2">&lt;</button>
             <h3 className="font-bold text-[var(--text-primary)] text-lg">{currentDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}</h3>
             <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2">&gt;</button>
         </div>
         <div className="grid grid-cols-7 gap-2 text-center mb-2">
             {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs font-bold text-[var(--text-secondary)] opacity-70">{d}</span>)}
         </div>
         <div className="grid grid-cols-7 gap-2">
             {days.map((day, idx) => {
                 if (!day) return <div key={`empty-${idx}`}></div>;
                 const dayTasks = history.filter(tk => { 
                    const d = getTaskDate(tk); 
                    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; 
                 });
                 const hasTask = dayTasks.length > 0;
                 const hasUnfinished = dayTasks.some(t => t.status !== 'completed');
                 const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
                 
                 return (
                     <button key={day} onClick={() => setSelectedDate(new Date(year, month, day))} className={`h-10 w-10 rounded-full flex flex-col items-center justify-center text-sm font-medium relative transition border 
                        ${isSelected 
                            ? 'bg-accent-purple text-white border-accent-purple' 
                            : 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)] hover:border-[var(--border-color)]'
                        }`}>
                         {day}
                         {hasTask && !isSelected && (
                             <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${hasUnfinished ? 'bg-red-500' : 'bg-green-500'}`}></span>
                         )}
                     </button>
                 );
             })}
         </div>
      </div>

      <div className="flex-1 overflow-auto">
          <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4 flex justify-between items-center">
            <span>{selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}</span>
            <span className="text-xs font-normal opacity-60">
                {getTasksForSelectedDate().length} Tasks
            </span>
          </h4>
          {getTasksForSelectedDate().length > 0 ? (
              <div className="space-y-3 pb-8">
                  {getTasksForSelectedDate().map(task => {
                      const isCompleted = task.status === 'completed';
                      return (
                        <div key={task.id} onClick={() => onTaskClick(task)} className={`p-4 bg-[var(--bg-secondary)] rounded-2xl border flex items-center justify-between cursor-pointer hover:border-[var(--text-secondary)] active:scale-95 transition group
                            ${isCompleted ? 'border-[var(--border-color)]' : 'border-red-500/30 shadow-sm shadow-red-500/5'}
                        `}>
                            <div className="min-w-0 flex-1 mr-4">
                                <p className={`font-medium truncate ${isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] font-bold'}`}>{task.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                                    <span>{task.subTasks.length} {t[lang].steps}</span>
                                    {!isCompleted && <span className="text-red-500 font-bold bg-red-500/10 px-1.5 rounded uppercase text-[10px]">Unfinished</span>}
                                </div>
                            </div>
                            {isCompleted ? <CheckCircleIcon className="text-green-500 w-5 h-5" /> : <ClockIcon className="text-red-400 w-5 h-5" />}
                        </div>
                      );
                  })}
              </div>
          ) : <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)] opacity-50">
                <p>{t[lang].noTasksOnDate}</p>
              </div>
          }
      </div>
    </div>
  );
};
