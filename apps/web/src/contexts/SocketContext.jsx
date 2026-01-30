import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { generateKeyPair, encodeKey, decodeKey, computeSharedSecret, encryptChunk, decryptChunk } from '../utils/crypto';

const SocketContext = createContext();

// Server URL - can be overridden by environment variable
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.0.101:3001';

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [incomingTransfer, setIncomingTransfer] = useState(null); // { senderId, file }
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferStatus, setTransferStatus] = useState('idle'); // 'idle' | 'sending' | 'receiving' | 'complete' | 'error'
    const [nearbyPeers, setNearbyPeers] = useState([]);
    const [pairedPeerId, setPairedPeerId] = useState(null);

    // Crypto State
    const keyPairRef = useRef(null); // My Public/Secret Key
    const sharedSecretRef = useRef(null); // Shared Secret with Peer
    const peerPublicKeyRef = useRef(null);

    const chunksRef = useRef([]);
    const incomingTransferRef = useRef(null);
    const socketRef = useRef(null); // Fix for stale closure


    // Keep ref in sync with state for listeners
    useEffect(() => {
        incomingTransferRef.current = incomingTransfer;
    }, [incomingTransfer]);

    useEffect(() => {
        // 1. Generate Ephemeral Keys on Mount
        const keys = generateKeyPair();
        keyPairRef.current = keys;
        console.log('App: Generated Ephemeral Keys', encodeKey(keys.publicKey));

        const newSocket = io(SERVER_URL, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
            setConnectionError(null);

            // LOBBY: Register Device
            newSocket.emit('register-device', {
                deviceType: 'desktop',
                deviceName: 'Desktop Web'
            });
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            // Reset pairing state on disconnect
            setPairedPeerId(null);
            sharedSecretRef.current = null;
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
            setConnectionError(error.message);
            setIsConnected(false);
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log('Reconnection attempt:', attemptNumber);
            setConnectionError(`Reconnecting... (attempt ${attemptNumber})`);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            setConnectionError(null);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('Failed to reconnect');
            setConnectionError('Failed to connect to server. Please refresh the page.');
        });

        // LOBBY: Peers Found
        newSocket.on('peers-found', (peers) => {
            console.log('Discovered peers:', peers);
            setNearbyPeers(peers);
        });

        // Global pair request listener (Receiver Side)
        newSocket.on('pairing-request', ({ requesterId, publicKey }) => {
            console.log('Incoming pairing request from:', requesterId);

            // Compute Shared Secret immediately if they sent a key
            if (publicKey) {
                const secret = computeSharedSecret(publicKey, keyPairRef.current.secretKey);
                sharedSecretRef.current = secret;
                peerPublicKeyRef.current = publicKey;
                console.log('Computed Shared Secret (Receiver)');
            }

            // Respond with MY public key
            newSocket.emit('pairing-response', {
                targetId: requesterId,
                accepted: true,
                publicKey: encodeKey(keyPairRef.current.publicKey)
            });

            setPairedPeerId(requesterId);
        });

        newSocket.on('transfer-request', ({ senderId, file }) => {
            console.log('Incoming transfer request:', file.name);
            setIncomingTransfer({ senderId, file });
            chunksRef.current = [];
            setTransferProgress(0);
        });

        // DECRYPT Incoming Chunks
        newSocket.on('file-chunk', ({ chunk, nonce, chunkIndex, totalChunks }) => {
            if (!sharedSecretRef.current) {
                console.error('Cannot decrypt: No shared secret established!');
                return;
            }

            const decryptedChunk = decryptChunk(chunk, nonce, sharedSecretRef.current);
            if (decryptedChunk) {
                chunksRef.current.push(decryptedChunk);
                const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
                setTransferProgress(progress);
            } else {
                console.error('Decryption failed for chunk', chunkIndex);
            }
        });

        newSocket.on('transfer-complete', () => {
            console.log('Transfer complete! Assembling file...');
            const currentIncomingTransfer = incomingTransferRef.current;

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

                alert(`File Received (Decrypted): ${currentIncomingTransfer.file.name}`);
                setIncomingTransfer(null);
                setTransferProgress(0);
                chunksRef.current = [];
            }
        });

        newSocket.on('transfer-accepted', ({ responderId }) => {
            console.log('Mobile accepted transfer!', responderId);
            setTransferStatus('sending');
            if (fileToSendRef.current) {
                sendFileData(fileToSendRef.current, responderId);
            }
        });

        setSocket(newSocket);

        return () => {
            // Cleanup on unmount
            newSocket.removeAllListeners();
            newSocket.close();
        };
    }, []);

    const fileToSendRef = useRef(null);

    const acceptTransfer = () => {
        if (!incomingTransfer || !socket) return;
        socket.emit('transfer-accepted', {
            targetId: incomingTransfer.senderId,
            fileId: 'current-file'
        });
        setTransferProgress(1);
    };

    const declineTransfer = () => {
        setIncomingTransfer(null);
    };

    const sendTransferRequest = (file, targetId) => {
        const currentSocket = socketRef.current; // Use Ref!
        if (!currentSocket) return;
        fileToSendRef.current = file;
        currentSocket.emit('transfer-request', {
            targetId,
            file: {
                name: file.name,
                size: file.size,
                type: file.type
            }
        });
    };

    const sendFileData = (file, targetId) => {
        const currentSocket = socketRef.current; // Use Ref!
        if (!sharedSecretRef.current || !currentSocket) {
            alert('Security/Connection Error.');
            return;
        }

        const reader = new FileReader();
        const CHUNK_SIZE = 64 * 1024; // 64KB

        reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

                // ENCRYPT CHUNK
                const { encrypted, nonce } = encryptChunk(chunk, sharedSecretRef.current);

                currentSocket.emit('file-chunk', {
                    targetId,
                    chunk: encrypted, // Encrypted payload
                    nonce: nonce,     // Nonce needed for decryption
                    chunkIndex: i,
                    totalChunks
                });

                setTransferProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            currentSocket.emit('transfer-complete', { targetId });
            setTransferProgress(0);
            fileToSendRef.current = null;
            alert('File Sent Successfully (Encrypted)!');
        };

        reader.readAsDataURL(file);
    };

    const pairDevice = (targetId) => {
        if (!socket) return Promise.reject(new Error('Not connected'));

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Connection timed out'));
            }, 10000);

            const cleanup = () => {
                clearTimeout(timeout);
                socket.off('pairing-response', onResponse);
                socket.off('pairing-error', onError);
            };

            const onResponse = ({ responderId, accepted, publicKey }) => {
                cleanup();
                if (accepted) {
                    // Compute Shared Secret (Sender Side)
                    if (publicKey) {
                        const secret = computeSharedSecret(publicKey, keyPairRef.current.secretKey);
                        sharedSecretRef.current = secret;
                        peerPublicKeyRef.current = publicKey;
                        console.log('Computed Shared Secret (Sender)');
                    }
                    setPairedPeerId(responderId);
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

            // SEND PUBLIC KEY IN REQUEST
            socket.emit('pairing-request', {
                targetId,
                publicKey: encodeKey(keyPairRef.current.publicKey)
            });
        });
    };

    const findPeers = () => {
        if (!socket) return;
        socket.emit('find-peers');
    };

    const cancelTransfer = useCallback(() => {
        setIncomingTransfer(null);
        setTransferProgress(0);
        setTransferStatus('idle');
        chunksRef.current = [];
        fileToSendRef.current = null;
    }, []);

    const disconnectPeer = useCallback(() => {
        setPairedPeerId(null);
        sharedSecretRef.current = null;
        peerPublicKeyRef.current = null;
    }, []);

    const value = {
        socket,
        isConnected,
        connectionError,
        pairDevice,
        incomingTransfer,
        acceptTransfer,
        declineTransfer,
        transferProgress,
        transferStatus,
        sendTransferRequest,
        findPeers,
        nearbyPeers,
        pairedPeerId,
        cancelTransfer,
        disconnectPeer
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
