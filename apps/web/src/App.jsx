import React, { useState, useEffect } from 'react';
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

  // Connection State Machine: 'idle' | 'connecting' | 'connected' | 'failed'
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [connectionError, setConnectionError] = useState('');
  const [targetId, setTargetId] = useState('');

  const { socket, pairDevice, incomingTransfer, acceptTransfer, declineTransfer, transferProgress, sendTransferRequest } = useSocket() || {};

  // Reset state on tab switch
  useEffect(() => {
    // Optional: could warn user here if they are connected
  }, [activeTab]);

  const handleConnect = async () => {
    if (!targetId.trim()) {
      setConnectionError('Please enter a Connection ID');
      return;
    }
    if (!socket) {
      setConnectionError('Not connected to server');
      return;
    }

    setConnectionStatus('connecting');
    setConnectionError('');

    try {
      await pairDevice(targetId);
      setConnectionStatus('connected');
    } catch (err) {
      setConnectionStatus('failed');
      setConnectionError(err.message || 'Connection failed');
      // Reset to idle after 3s so user can try again
      setTimeout(() => setConnectionStatus('idle'), 3000);
    }
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
      // For MVP, handle single file drop
      const file = e.dataTransfer.files[0];
      if (isConnected && targetId) {
        sendTransferRequest(file, targetId);
        alert(`Sending request to ${targetId}...`);
      } else {
        alert('Please connect to a device first!');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isConnected && targetId) {
        sendTransferRequest(file, targetId);
        alert(`Sending request to ${targetId}...`);
      } else {
        alert('Please connect to a device first!');
      }
    }
  };

  const isConnected = connectionStatus === 'connected';

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
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">1. Connect Device</p>
                      {connectionStatus === 'connecting' && <span className="text-xs text-[#00CFD6] animate-pulse">Connecting...</span>}
                      {connectionStatus === 'failed' && <span className="text-xs text-red-400">{connectionError}</span>}
                    </div>

                    <div className="flex gap-2 relative">
                      <input
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="Enter Connection ID"
                        disabled={isConnected || connectionStatus === 'connecting'}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#00CFD6]/50 focus:ring-1 focus:ring-[#00CFD6]/30 transition-all disabled:opacity-50"
                      />

                      {/* Paste Button (only show if empty and supported) */}
                      {!targetId && navigator.clipboard && (
                        <button
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setTargetId(text);
                            } catch (e) { console.error('Paste failed', e); }
                          }}
                          className="absolute right-[120px] top-1/2 -translate-y-1/2 p-1.5 text-xs bg-slate-800 rounded text-slate-400 hover:text-white"
                        >
                          PASTE
                        </button>
                      )}

                      <button
                        onClick={handleConnect}
                        disabled={isConnected || connectionStatus === 'connecting'}
                        className={`px-6 py-3 font-bold rounded-xl transition-all duration-300 min-w-[100px] flex items-center justify-center ${isConnected
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : 'bg-[#00CFD6] text-black hover:bg-[#00CFD6]/80 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100'
                          }`}
                      >
                        {connectionStatus === 'connecting' ? (
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : isConnected ? (
                          '✓ Paired'
                        ) : (
                          'Connect'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full flex items-center gap-4">
                    <div className={`flex-1 h-px transition-colors duration-300 ${isConnected ? 'bg-[#00CFD6]/30' : 'bg-white/10'}`}></div>
                    <span className={`text-sm transition-colors duration-300 ${isConnected ? 'text-[#00CFD6]' : 'text-slate-600'}`}>2. Select Files</span>
                    <div className={`flex-1 h-px transition-colors duration-300 ${isConnected ? 'bg-[#00CFD6]/30' : 'bg-white/10'}`}></div>
                  </div>

                  {/* File Selection */}
                  <div
                    className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all duration-500 ${isDragging ? 'border-[#00CFD6] bg-[#00CFD6]/10' : 'border-white/10 hover:border-white/20'
                      } ${!isConnected ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <Logo size={48} color={isConnected ? "#00CFD6" : "#444"} />
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white">
                          {selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Selected` : 'Select Files to Send'}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {selectedFiles.length > 0 ? selectedFiles.map(f => f.name).join(', ') : 'Drag & drop or click below'}
                        </p>
                      </div>
                      <label className={`cursor-pointer px-8 py-3 font-bold rounded-xl transition-all duration-300 ${isConnected
                        ? 'bg-white text-black hover:bg-[#00CFD6] hover:text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}>
                        Choose Files
                        <input type="file" className="hidden" onChange={handleFileSelect} disabled={!isConnected} />
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
                      <div className="relative">
                        <QRCodeDisplay text={socket.id} width={256} />
                        {/* Overlay for instructions if needed, or keeping it clean */}
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-[#0A0A0B] rounded-2xl border border-white/10 flex items-center justify-center">
                        <span className="text-slate-500 font-mono text-sm tracking-wider animate-pulse">Connecting...</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full text-center space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Your Connection ID</p>
                      <p className="text-xs text-slate-600">Scan QR or enter this code on sender</p>
                    </div>

                    <div
                      onClick={() => {
                        if (socket?.id) {
                          navigator.clipboard.writeText(socket.id);
                          alert('ID Copied to clipboard!');
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

      {/* Incoming Transfer Modal */}
      <AnimatePresence>
        {incomingTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121214] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Glow Effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-[#00CFD6]"></div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#00CFD6]/20 flex items-center justify-center">
                  <Logo size={40} color="#00CFD6" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Incoming File Request</h3>
                  <p className="text-slate-400 text-sm">
                    <span className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">{incomingTransfer.senderId.slice(0, 4)}...</span> wants to send:
                  </p>
                </div>

                <div className="w-full bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="font-medium text-white break-all mb-1">{incomingTransfer.file.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">
                    {(incomingTransfer.file.size / 1024 / 1024).toFixed(2)} MB • {incomingTransfer.file.type.split('/')[1] || 'FILE'}
                  </p>
                </div>

                {transferProgress > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Receiving...</span>
                      <span>{transferProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00CFD6] transition-all duration-300 ease-out"
                        style={{ width: `${transferProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={declineTransfer}
                      className="flex-1 py-3 rounded-xl font-bold text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={acceptTransfer}
                      className="flex-1 py-3 rounded-xl font-bold bg-[#00CFD6] text-black hover:bg-[#00CFD6]/90 transition-transform active:scale-95 shadow-[0_0_20px_rgba(0,207,214,0.2)]"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
