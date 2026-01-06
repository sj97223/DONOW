
import React, { useState, useEffect, useRef } from 'react';
import { SubTask, Language } from '../types';
import { CheckCircleIcon } from './Icons';

interface FocusTimerProps {
  task: SubTask;
  onComplete: (elapsedSeconds: number) => void;
  onBack: () => void;
  lang: Language;
  t: any;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ task, onComplete, onBack, lang, t }) => {
  const initialTime = task.duration * 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);
  const elapsedRef = useRef(0);
  const voicedHalfway = useRef(false);
  const voicedOneMin = useRef(false);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / initialTime) * 100;

  // Visual urgency colors
  const getThemeColor = () => {
    if (progressPercentage > 50) return '#FDE047'; // yellow
    if (progressPercentage > 20) return '#C084FC'; // purple
    return '#F87171'; // red
  };

  const themeColor = getThemeColor();

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          
          // Audio Cues
          if (next === Math.floor(initialTime / 2) && !voicedHalfway.current) {
            speak(lang === 'zh' ? "时间过半，加油！" : "Halfway there, keep going!");
            voicedHalfway.current = true;
          }
          if (next === 60 && !voicedOneMin.current) {
            speak(lang === 'zh' ? "还剩最后一分钟！" : "One minute remaining!");
            voicedOneMin.current = true;
          }
          
          return next;
        });
        elapsedRef.current += 1;
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    triggerConfetti();
    setTimeout(() => {
        onComplete(elapsedRef.current);
    }, 2000);
  };

  const triggerConfetti = () => {
    const colors = ['#FDE047', '#C084FC', '#22D3EE', '#F472B6'];
    for (let i = 0; i < 50; i++) {
        const div = document.createElement('div');
        div.classList.add('confetti');
        div.style.left = `${Math.random() * 100}vw`;
        div.style.top = '-10px';
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        div.style.animationDuration = `${Math.random() * 2 + 1}s`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
  };

  const getEncouragement = () => {
    if (progressPercentage > 80) return t[lang].encouragement;
    if (progressPercentage > 50) return lang === 'zh' ? "稳扎稳打，你已经进入状态了！" : "Solid progress, you're in the zone!";
    if (progressPercentage > 20) return lang === 'zh' ? "再坚持一下，目标就在眼前！" : "Hang in there, you're almost there!";
    return lang === 'zh' ? "最后冲刺，立刻完成！" : "Final sprint! Finish strong!";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-zinc-950 relative overflow-hidden transition-colors duration-1000">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div 
              style={{ backgroundColor: themeColor }}
              className={`w-80 h-80 rounded-full blur-3xl transition-colors duration-1000 ${isActive ? 'animate-pulse-slow' : ''}`}
            ></div>
        </div>

        <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors z-20"
        >
            {t[lang].exitFocus}
        </button>

        <div className="z-10 text-center space-y-10 w-full max-w-md">
            <div className="space-y-4">
                <span 
                  style={{ color: themeColor, borderColor: `${themeColor}44` }}
                  className="inline-block px-4 py-1.5 rounded-full bg-zinc-900 border text-sm font-semibold tracking-wide transition-colors"
                >
                    {t[lang].focusMode}
                </span>
                <h2 className="text-3xl font-bold text-white leading-tight">
                    {task.description}
                </h2>
            </div>

            <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
                    <circle
                        cx="128"
                        cy="128"
                        r="115"
                        stroke="#27272a"
                        strokeWidth="12"
                        fill="transparent"
                    />
                    <circle
                        cx="128"
                        cy="128"
                        r="115"
                        stroke={themeColor}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 115}
                        strokeDashoffset={2 * Math.PI * 115 * (1 - progressPercentage / 100)}
                        className="transition-all duration-1000 ease-linear"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-mono font-bold text-white tracking-tighter">
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className="px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-bold shadow-lg hover:bg-zinc-800 transition active:scale-95"
                >
                    {isActive ? t[lang].pause : t[lang].resume}
                </button>
                <button
                    onClick={handleComplete}
                    style={{ backgroundColor: themeColor }}
                    className="px-8 py-4 rounded-2xl text-black font-bold shadow-lg hover:brightness-110 transition flex items-center gap-2 active:scale-95"
                >
                    <CheckCircleIcon className="w-5 h-5" />
                    {t[lang].done}
                </button>
            </div>
            
            <p className="text-zinc-500 text-sm h-10">
               {getEncouragement()}
            </p>
        </div>
    </div>
  );
};
