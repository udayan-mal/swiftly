import React from 'react';
import Logo from './Logo';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group">
                        <Logo className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:scale-110" />

                        <span className="font-bold text-xl tracking-tight text-white group-hover:text-[#00CFD6] transition-colors duration-300 font-sans">
                            Swiftly
                        </span>
                    </div>

                    {/* Right Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <button className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                History
                            </button>
                            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-700 hover:border-slate-600 shadow-lg shadow-black/20">
                                Connect Device
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
