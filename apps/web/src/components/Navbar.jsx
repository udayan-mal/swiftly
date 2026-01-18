import React from 'react';
import Logo from './Logo';
import { useSocket } from '../contexts/SocketContext';

export default function Navbar({ onHistoryClick, onConnectClick }) {
    // Safely destructure isConnected, defaulting to false if context is missing/loading
    const { isConnected } = useSocket() || { isConnected: false };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group">
                        <Logo size={48} className="transition-transform duration-300 group-hover:scale-110" />

                        <div className="flex flex-col">
                            <span className="font-bold text-2xl tracking-tight text-white group-hover:text-[#00CFD6] transition-colors duration-300 font-sans leading-none">
                                Swiftly
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-rose-500'}`}></span>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 font-bold">
                                    {isConnected ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <button
                                onClick={onHistoryClick}
                                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                History
                            </button>
                            <button
                                onClick={onConnectClick}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-700 hover:border-slate-600 shadow-lg shadow-black/20"
                            >
                                Connect Device
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
