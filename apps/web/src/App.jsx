import React, { useState } from 'react';
import Navbar from './components/Navbar';

function App() {
  const [activeTab, setActiveTab] = useState('send');

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-blue-500/30 font-sans">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
      </div>

      <Navbar />

      <main className="relative pt-32 px-4 pb-12 flex flex-col items-center min-h-screen w-full max-w-7xl mx-auto">

        {/* Hero Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-sm mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">System Operational</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Transfer files <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400">
              without friction.
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed font-light max-w-xl mx-auto">
            The fastest way to move data between devices. Peer-to-peer, encrypted, and open source. No logins required.
          </p>
        </div>

        {/* Action Panel */}
        <div className="w-full max-w-md relative z-10">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 mb-6 relative">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-xl transition-all duration-300 shadow-lg ${activeTab === 'send' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
            ></div>
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 relative z-10 py-3 text-sm font-semibold transition-colors duration-200 ${activeTab === 'send' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Send
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 relative z-10 py-3 text-sm font-semibold transition-colors duration-200 ${activeTab === 'receive' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Receive
            </button>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 hover:border-slate-700/50 transition-colors duration-500 min-h-[400px] flex flex-col items-center justify-center text-center group">

            {activeTab === 'send' ? (
              <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/10 to-blue-600/5 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Upload Files</h3>
                  <p className="text-sm text-slate-500 max-w-[200px]">Drag and drop your files here or click to browse</p>
                </div>
                <button className="mt-4 px-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-colors transform active:scale-95">
                  Choose Files
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-64 h-64 bg-black/40 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group-hover:border-emerald-500/30 transition-colors">
                  <div className="absolute inset-0 bg-scan-line animate-scan pointer-events-none"></div>
                  <span className="text-slate-600 font-mono text-xs">Waiting for QR Code...</span>
                </div>
                <div>
                  <p className="text-sm text-slate-400">
                    Or enter 6-digit code
                  </p>
                  <div className="flex gap-2 mt-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-10 h-12 bg-slate-800 rounded-lg border border-slate-700"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  )
}

export default App
