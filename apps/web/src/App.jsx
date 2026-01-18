import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import { SocketProvider } from './contexts/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';

import { useSocket } from './contexts/SocketContext';
import QRCodeDisplay from './components/QRCodeDisplay';

function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const { socket } = useSocket() || {};

  const handleConnect = () => {
    if (!targetId.trim()) {
      alert('Please enter a Connection ID');
      return;
    }
    if (!socket) {
      alert('Not connected to server');
      return;
    }
    // For now, just mark as paired - actual signaling will be added later
    setIsPaired(true);
    alert(`Paired with ${targetId}!`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#00CFD6]/30 font-sans overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00CFD6]/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      </div>

      <Navbar />

      <main className="relative pt-32 px-4 pb-12 flex flex-col items-center min-h-screen w-full max-w-7xl mx-auto z-10">

        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-4 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-[#00CFD6] mr-3 animate-pulse"></span>
            <span className="text-xs text-slate-300 font-medium tracking-widest uppercase">System Operational</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Transfer files <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00CFD6]">
              without friction.
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed font-light max-w-xl mx-auto">
            The fastest way to move data between devices. Peer-to-peer, encrypted, and open source. No logins required.
          </p>
        </div>

        {/* Action Panel */}
        <div className="w-full max-w-md relative">

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 mb-8 relative shadow-2xl">
            {/* Active Tab Background Pill */}
            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#00CFD6]/10 border border-[#00CFD6]/20 rounded-xl transition-all duration-300 ease-out ${activeTab === 'send' ? 'left-1.5' : 'left-[calc(50%+4.5px)]'}`}
            ></div>

            <button
              onClick={() => setActiveTab('send')}
              className={`relative z-10 py-3 text-sm font-bold transition-all duration-300 ${activeTab === 'send' ? 'text-[#00CFD6] shadow-[0_0_20px_rgba(0,207,214,0.1)]' : 'text-slate-500 hover:text-white'}`}
            >
              Send
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`relative z-10 py-3 text-sm font-bold transition-all duration-300 ${activeTab === 'receive' ? 'text-[#00CFD6] shadow-[0_0_20px_rgba(0,207,214,0.1)]' : 'text-slate-500 hover:text-white'}`}
            >
              Receive
            </button>
          </div>

          {/* Main Card */}
          <div
            className={`
                relative bg-slate-900/40 backdrop-blur-2xl border rounded-[2rem] p-8 shadow-2xl transition-all duration-500
                ${isDragging ? 'border-[#00CFD6] bg-[#00CFD6]/5 scale-[1.02] shadow-[0_0_50px_rgba(0,207,214,0.15)]' : 'border-white/5 hover:border-white/10'}
              `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            <AnimatePresence mode="wait">
              {activeTab === 'send' ? (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col items-center space-y-6 py-6"
                >
                  {/* Connect to Device Section */}
                  <div className="w-full space-y-4">
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold text-center">Connect to Device</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="Enter Connection ID"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#00CFD6]/50 focus:ring-1 focus:ring-[#00CFD6]/30 transition-all"
                      />
                      <button
                        onClick={handleConnect}
                        disabled={isPaired}
                        className={`px-6 py-3 font-bold rounded-xl transition-all duration-300 ${isPaired
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : 'bg-[#00CFD6] text-black hover:bg-[#00CFD6]/80 hover:scale-105'
                          }`}
                      >
                        {isPaired ? '✓ Paired' : 'Connect'}
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-slate-500 text-sm">then select files</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>

                  {/* File Selection */}
                  <div
                    className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-[#00CFD6] bg-[#00CFD6]/10' : 'border-white/10 hover:border-white/20'
                      } ${!isPaired ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <Logo size={48} color={isPaired ? "#00CFD6" : "#666"} />
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white">
                          {selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Selected` : 'Select Files to Send'}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {selectedFiles.length > 0 ? selectedFiles.map(f => f.name).join(', ') : 'Drag & drop or click below'}
                        </p>
                      </div>
                      <label className={`cursor-pointer px-8 py-3 font-bold rounded-xl transition-all duration-300 ${isPaired
                        ? 'bg-white text-black hover:bg-[#00CFD6] hover:text-white'
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        }`}>
                        Choose Files
                        <input type="file" multiple className="hidden" onChange={handleFileSelect} disabled={!isPaired} />
                      </label>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="receive"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col items-center space-y-8 py-8"
                >
                  <div className="relative group cursor-pointer">
                    {/* QR Code Display */}
                    {socket?.id ? (
                      <QRCodeDisplay text={socket.id} width={256} />
                    ) : (
                      <div className="w-64 h-64 bg-[#0A0A0B] rounded-2xl border border-white/10 flex items-center justify-center">
                        <span className="text-slate-500 font-mono text-sm tracking-wider animate-pulse">Connecting...</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full text-center">
                    <p className="text-sm text-slate-500 mb-4 uppercase tracking-widest font-semibold">Your Connection ID</p>

                    <div
                      onClick={() => {
                        if (socket?.id) {
                          navigator.clipboard.writeText(socket.id);
                          alert('ID Copied to clipboard!'); // Simple feedback for now, could be a toast later
                        }
                      }}
                      className="group relative inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00CFD6]/50 rounded-xl cursor-pointer transition-all duration-300"
                    >
                      <span className="font-mono text-[#00CFD6] text-lg select-all max-w-[280px] truncate sm:max-w-none sm:overflow-visible">
                        {socket?.id || 'Connecting...'}
                      </span>

                      {/* Copy Icon */}
                      <svg className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>

                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#00CFD6] text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Click to Copy
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </main>
    </div>
  )
}

export default App
