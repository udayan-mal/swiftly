import React from 'react';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group">
                        {/* CSS/SVG Logo Icon */}
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-lg transform rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                            <div className="absolute inset-0 bg-slate-900 rounded-lg transform scale-90"></div>
                            <svg
                                className="relative w-5 h-5 text-white transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>

                        {/* Text Logo */}
                        <span className="font-bold text-xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-emerald-400 transition-all duration-300">
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
