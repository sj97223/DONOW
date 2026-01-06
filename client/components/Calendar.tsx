
import React, { useState } from 'react';
import { BigTask, Language } from '../types';
import { ChevronLeftIcon, CheckCircleIcon } from './Icons';

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

  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    return history.filter(task => {
       const d = new Date(task.completedAt || 0);
       return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition"><ChevronLeftIcon /></button>
        <h2 className="text-xl font-bold text-white">{t[lang].calendar}</h2>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 mb-6">
         <div className="flex items-center justify-between mb-6">
             <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-zinc-400 p-2">&lt;</button>
             <h3 className="font-bold text-white text-lg">{currentDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}</h3>
             <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-zinc-400 p-2">&gt;</button>
         </div>
         <div className="grid grid-cols-7 gap-2 text-center mb-2">
             {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs font-bold text-zinc-600">{d}</span>)}
         </div>
         <div className="grid grid-cols-7 gap-2">
             {days.map((day, idx) => {
                 if (!day) return <div key={`empty-${idx}`}></div>;
                 const hasTask = history.some(tk => { const d = new Date(tk.completedAt || 0); return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; });
                 const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
                 return (
                     <button key={day} onClick={() => setSelectedDate(new Date(year, month, day))} className={`h-10 w-10 rounded-full flex flex-col items-center justify-center text-sm font-medium relative transition ${isSelected ? 'bg-accent-purple text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                         {day}{hasTask && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-accent-yellow rounded-full"></span>}
                     </button>
                 );
             })}
         </div>
      </div>

      <div className="flex-1 overflow-auto">
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-4">{selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}</h4>
          {getTasksForSelectedDate().length > 0 ? (
              <div className="space-y-3">
                  {getTasksForSelectedDate().map(task => (
                      <div key={task.id} onClick={() => onTaskClick(task)} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-700 active:scale-95 transition">
                          <div><p className="font-medium text-white">{task.title}</p><p className="text-xs text-zinc-500 mt-1">{task.subTasks.length} {t[lang].steps} • {Math.round(task.subTasks.reduce((a, s) => a + (s.actualDuration || 0), 0) / 60)} min</p></div>
                          <CheckCircleIcon className="text-green-500 w-5 h-5" />
                      </div>
                  ))}
              </div>
          ) : <p className="text-zinc-600 text-center py-4">{t[lang].noTasksOnDate}</p>}
      </div>
    </div>
  );
};
