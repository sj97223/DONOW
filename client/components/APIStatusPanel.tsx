import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import pkg from 'package.json';

interface APIStats {
    requestsRemaining: number;
    isRateLimited: boolean;
    currentMimoKeyIndex: number;
    totalMimoKeys: number;
    provider: string;
    model: string;
    stats: {
        mimo: { success: number; failed: number; retries: number };
        gemini: { success: number; failed: number; retries: number };
    };
}

export const APIStatusPanel: React.FC = () => {
    const [stats, setStats] = useState<APIStats | null>(null);
    const [error, setError] = useState<boolean>(false);
    const [visible, setVisible] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setVisible(false);
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/ai/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setError(false);
                setLastUpdated(Date.now());
            } else {
                setError(true);
            }
        } catch (e) {
            console.error('Failed to fetch API stats:', e);
            setError(true);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll every 30s as requested
        return () => clearInterval(interval);
    }, []);

    // Helper to determine status color and text
    const getStatusInfo = () => {
        if (error) return { text: 'Unavailable', color: 'bg-red-500', dot: 'bg-red-500' };
        if (stats?.isRateLimited) return { text: 'Limited (429)', color: 'bg-orange-500', dot: 'bg-orange-500' };
        if (!stats) return { text: 'Checking...', color: 'bg-gray-500', dot: 'bg-gray-400' };
        return { text: 'Available', color: 'bg-green-500', dot: 'bg-green-500' };
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="fixed bottom-10 right-4 z-40 font-sans" ref={panelRef}>
            {/* Main Toggle Button */}
            <button 
                onClick={() => setVisible(!visible)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-all duration-300
                    ${error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                    hover:shadow-xl active:scale-95
                `}
            >
                <div className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse shadow-sm`}></div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-0.5">API Status</span>
                    <span className={`text-xs font-bold leading-none ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {statusInfo.text}
                    </span>
                </div>
            </button>
            
            {/* Detailed Panel */}
            <div className={`
                absolute bottom-12 right-0 w-72 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-sm 
                transition-all duration-300 origin-bottom-right
                ${visible ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
            `}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        System Monitor
                        {stats && <span className="text-[10px] font-normal text-gray-400 bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded">v{pkg.version}</span>}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                        Updates in {30 - Math.round((Date.now() - lastUpdated) / 1000) % 30}s
                    </span>
                </div>
                
                {error ? (
                    <div className="text-center py-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="font-bold mb-1">Connection Failed</p>
                        <p className="text-xs opacity-80">Cannot reach backend on port 5901</p>
                        <button onClick={fetchStats} className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-full transition-colors font-medium">
                            Retry Connection
                        </button>
                    </div>
                ) : !stats ? (
                    <div className="text-center py-4 text-gray-500 animate-pulse">
                        Loading telemetry...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Remaining</span>
                                <span className={`text-xl font-mono font-bold ${stats.requestsRemaining < 3 ? 'text-red-500' : 'text-green-600'}`}>
                                    {stats.requestsRemaining}<span className="text-gray-400 text-xs font-normal">/10</span>
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Model</span>
                                <span className="text-xs font-bold text-blue-600 truncate block" title={stats.model}>
                                    {stats.model}
                                </span>
                            </div>
                        </div>

                        {/* Provider Info */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Provider</span>
                                <span className="font-mono font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                    {stats.provider}
                                </span>
                            </div>
                            {stats.provider === 'mimo' && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">Active Key Rotation</span>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: stats.totalMimoKeys }).map((_, i) => (
                                            <div 
                                                key={i}
                                                className={`w-2 h-2 rounded-full transition-colors ${i === stats.currentMimoKeyIndex ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                title={`Key #${i + 1} ${i === stats.currentMimoKeyIndex ? '(Active)' : ''}`}
                                            ></div>
                                        ))}
                                        <span className="ml-1 font-mono text-gray-400">#{stats.currentMimoKeyIndex + 1}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Performance Stats */}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                            <div className="text-[10px] uppercase text-gray-400 font-bold mb-2 flex justify-between">
                                <span>Performance</span>
                                <span>Success / Fail / Retry</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-2 py-1.5 rounded">
                                    <span className="font-bold text-gray-600 dark:text-gray-400">MIMO</span>
                                    <div className="font-mono space-x-2">
                                        <span className="text-green-600">{stats.stats.mimo.success}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-red-500">{stats.stats.mimo.failed}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-yellow-500">{stats.stats.mimo.retries}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-2 py-1.5 rounded">
                                    <span className="font-bold text-gray-600 dark:text-gray-400">GEMINI</span>
                                    <div className="font-mono space-x-2">
                                        <span className="text-green-600">{stats.stats.gemini.success}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-red-500">{stats.stats.gemini.failed}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-yellow-500">{stats.stats.gemini.retries}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

