import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import { SocketProvider } from './contexts/SocketContext';

import { useSocket } from './contexts/SocketContext';
import QRCodeDisplay from './components/QRCodeDisplay';

function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const { socket } = useSocket() || {};

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

            {activeTab === 'send' ? (
              <div className="flex flex-col items-center space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`
                     w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500
                     ${isDragging ? 'bg-[#00CFD6]/20 scale-110' : 'bg-gradient-to-tr from-blue-500/10 to-[#00CFD6]/10 border border-white/5 group-hover:scale-105'}
                  `}>
                  <Logo size={96} className={`transition-transform duration-500 ${isDragging ? 'scale-110' : ''}`} color="#00CFD6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Selected` : (isDragging ? 'Drop files to send' : 'Upload Files')}
                  </h3>
                  <p className="text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                    {selectedFiles.length > 0 ? selectedFiles.map(f => f.name).join(', ') : 'Drag and drop your files here or click to browse'}
                  </p>
                </div>

                <label className="cursor-pointer px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-[#00CFD6] hover:text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(0,207,214,0.3)] transition-all duration-300 transform active:scale-95">
                  Choose Files
                  <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                <div className="w-full">
                  <p className="text-sm text-center text-slate-500 mb-4 uppercase tracking-widest font-semibold">Your ID: <span className="text-[#00CFD6] select-all">{socket?.id?.slice(0, 6)}...</span></p>
                  {/* Placeholder for manual code entry if needed later */}
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
