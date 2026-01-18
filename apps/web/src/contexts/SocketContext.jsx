import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [incomingTransfer, setIncomingTransfer] = useState(null); // { senderId, file }
    const [transferProgress, setTransferProgress] = useState(0);
    const chunksRef = useRef([]); // Store chunks in memory before blob creation
    const incomingTransferRef = useRef(null);

    // Keep ref in sync with state for listeners
    useEffect(() => {
        incomingTransferRef.current = incomingTransfer;
    }, [incomingTransfer]);

    useEffect(() => {
        // Connect to the realtime service
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'], // Force WebSocket to avoid polling issues
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setIsConnected(false);
        });

        // Global pair request listener
        newSocket.on('pairing-request', ({ requesterId }) => {
            console.log('Incoming pairing request from:', requesterId);
            newSocket.emit('pairing-response', { targetId: requesterId, accepted: true });
        });

        // Incoming File Transfer Request
        newSocket.on('transfer-request', ({ senderId, file }) => {
            console.log('Incoming transfer request:', file.name);
            setIncomingTransfer({ senderId, file });
            chunksRef.current = []; // Reset chunks
            setTransferProgress(0);
        });

        // Incoming File Chunks
        newSocket.on('file-chunk', ({ chunk, chunkIndex, totalChunks }) => {
            // Append chunk (base64 or ArrayBuffer)
            chunksRef.current.push(chunk);
            const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
            setTransferProgress(progress);
        });

        // Transfer Complete
        newSocket.on('transfer-complete', () => {
            console.log('Transfer complete! Assembling file...');

            const currentIncomingTransfer = incomingTransferRef.current;

            // Assuming base64 chunks for now (from Expo)
            // If using binary, we'd use new Blob(chunksRef.current)
            if (currentIncomingTransfer && currentIncomingTransfer.file) {
                // Convert base64 chunks to blob
                const base64Data = chunksRef.current.join('');
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: currentIncomingTransfer.file.type });

                // Trigger Download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = currentIncomingTransfer.file.name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                alert(`File Received: ${currentIncomingTransfer.file.name}`);
                setIncomingTransfer(null);
                setTransferProgress(0);
                chunksRef.current = [];
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const acceptTransfer = () => {
        if (!incomingTransfer || !socket) return;
        socket.emit('transfer-accepted', {
            targetId: incomingTransfer.senderId,
            fileId: 'current-file' // simple ID
        });
        setTransferProgress(1); // Show started
    };

    const declineTransfer = () => {
        console.log('Declined transfer');
        setIncomingTransfer(null);
    };

    const pairDevice = (targetId) => {
        if (!socket) return Promise.reject(new Error('Not connected'));

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Connection timed out'));
            }, 10000); // 10s timeout

            const cleanup = () => {
                clearTimeout(timeout);
                socket.off('pairing-response', onResponse);
                socket.off('pairing-error', onError);
            };

            const onResponse = ({ responderId, accepted }) => {
                cleanup();
                if (accepted) {
                    resolve({ responderId });
                } else {
                    reject(new Error('Connection declined'));
                }
            };

            const onError = ({ message }) => {
                cleanup();
                reject(new Error(message || 'Connection failed'));
            };

            socket.on('pairing-response', onResponse);
            socket.on('pairing-error', onError);

            socket.emit('pairing-request', { targetId });
        });
    };

    const value = {
        socket,
        isConnected,
        pairDevice,
        incomingTransfer,
        acceptTransfer,
        declineTransfer,
        transferProgress
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
