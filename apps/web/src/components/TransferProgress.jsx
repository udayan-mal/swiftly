import React, { useState, useEffect, useRef } from 'react';
import { formatFileSize, formatTransferSpeed, formatTimeRemaining, getFileIcon } from '../utils/format';
import Logo from './Logo';

/**
 * TransferProgress - Displays file transfer progress with speed and ETA
 */
export default function TransferProgress({ 
    file, 
    progress = 0, 
    onCancel,
    direction = 'receiving' // 'sending' | 'receiving'
}) {
    const [speed, setSpeed] = useState(0);
    const [eta, setEta] = useState(null);
    const startTimeRef = useRef(Date.now());
    const lastProgressRef = useRef(0);
    const lastTimeRef = useRef(Date.now());

    useEffect(() => {
        // Calculate speed and ETA based on progress changes
        const now = Date.now();
        const timeDiff = (now - lastTimeRef.current) / 1000; // seconds
        const progressDiff = progress - lastProgressRef.current;

        if (timeDiff > 0.5 && progressDiff > 0 && file?.size) {
            // Calculate bytes transferred
            const bytesTransferred = (progressDiff / 100) * file.size;
            const currentSpeed = bytesTransferred / timeDiff;
            
            // Smooth speed calculation with moving average
            setSpeed(prev => prev === 0 ? currentSpeed : (prev * 0.7 + currentSpeed * 0.3));

            // Calculate ETA
            const remainingBytes = file.size * ((100 - progress) / 100);
            const remainingTime = currentSpeed > 0 ? remainingBytes / currentSpeed : null;
            setEta(remainingTime);

            lastProgressRef.current = progress;
            lastTimeRef.current = now;
        }
    }, [progress, file]);

    // Reset on new transfer
    useEffect(() => {
        if (progress === 0 || progress === 1) {
            startTimeRef.current = Date.now();
            lastProgressRef.current = 0;
            lastTimeRef.current = Date.now();
            setSpeed(0);
            setEta(null);
        }
    }, [file]);

    const isComplete = progress >= 100;

    return (
        <div className="w-full space-y-4 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00CFD6]/10 flex items-center justify-center text-xl">
                        {getFileIcon(file?.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate max-w-[200px]">
                            {file?.name || 'Unknown File'}
                        </p>
                        <p className="text-slate-500 text-xs">
                            {formatFileSize(file?.size)}
                        </p>
                    </div>
                </div>

                {/* Cancel Button */}
                {!isComplete && onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        aria-label="Cancel transfer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${
                            isComplete 
                                ? 'bg-emerald-500' 
                                : 'bg-gradient-to-r from-blue-500 to-[#00CFD6]'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                        {/* Progress Percentage */}
                        <span className={`font-mono font-bold ${isComplete ? 'text-emerald-400' : 'text-[#00CFD6]'}`}>
                            {Math.round(progress)}%
                        </span>

                        {/* Speed */}
                        {!isComplete && speed > 0 && (
                            <span className="text-slate-400">
                                {formatTransferSpeed(speed)}
                            </span>
                        )}
                    </div>

                    {/* ETA / Status */}
                    <span className={`${isComplete ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {isComplete 
                            ? '✓ Complete' 
                            : eta 
                                ? `~${formatTimeRemaining(eta)} remaining`
                                : direction === 'sending' ? 'Sending...' : 'Receiving...'
                        }
                    </span>
                </div>
            </div>

            {/* Animated indicator for active transfer */}
            {!isComplete && (
                <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[#00CFD6] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[#00CFD6] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[#00CFD6] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span>Transfer in progress - keep this window open</span>
                    </div>
                </div>
            )}
        </div>
    );
}
