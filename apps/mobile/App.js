import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from "socket.io-client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Scanner from './src/components/Scanner';
import QRCodeDisplay from './src/components/QRCodeDisplay';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Logo from './src/components/Logo';
import { generateKeyPair, encodeKey, decryptChunk, encryptChunk, computeSharedSecret } from './src/utils/crypto';

// Server Configuration - UPDATE THIS to your computer's local IP address
// To find your IP: Windows: ipconfig | macOS/Linux: ifconfig
// Use your computer's IP on the local network (e.g., 192.168.1.X)
// Note: 'localhost' only works on iOS Simulator
// Note: '10.0.2.2' is the host machine from Android Emulator
const SERVER_URL = 'http://192.168.0.101:3001';

// Production limits
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max per file
const MAX_FILES_PER_TRANSFER = 10;

export default function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'scanner'
  const [mode, setMode] = useState('send'); // 'send' | 'receive' - Mode toggle
  const [targetId, setTargetId] = useState(null);
  const [manualCode, setManualCode] = useState(''); // Manual connection ID input
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transferInfo, setTransferInfo] = useState(''); // Current file being transferred
  const selectedFilesRef = useRef([]); // Support multiple files
  const currentFileIndexRef = useRef(0);

  // Crypto State
  const keyPairRef = useRef(null);
  const sharedSecretRef = useRef(null);

  // Receiving State
  const incomingChunksRef = useRef([]);
  const [incomingTransfer, setIncomingTransfer] = useState(null);
  const incomingTransferRef = useRef(null);

  // Peer discovery state (prevent spam)
  const lastPeersRef = useRef('');

  useEffect(() => {
    incomingTransferRef.current = incomingTransfer;
  }, [incomingTransfer]);

  // Lobby State
  const [nearbyPeers, setNearbyPeers] = useState([]);

  useEffect(() => {
    // 1. Generate Ephemeral Keys
    const keys = generateKeyPair();
    keyPairRef.current = keys;
    console.log('Mobile: Generated Keys', encodeKey(keys.publicKey));

    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Mobile connected:', newSocket.id);
      setIsConnected(true);

      // LOBBY: Register Device
      newSocket.emit('register-device', {
        deviceType: 'mobile',
        deviceName: Platform.OS === 'ios' ? 'iPhone' : 'Android'
      });
    });

    // LOBBY: Peers Found (with spam prevention)
    newSocket.on('peers-found', (peers) => {
      const peersKey = JSON.stringify(peers.map(p => p.id).sort());
      if (peersKey !== lastPeersRef.current) {
        console.log('Mobile Discovered peers:', peers);
        lastPeersRef.current = peersKey;
        setNearbyPeers(peers);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Mobile disconnected:', reason);
      setIsConnected(false);
      // Reset pairing state on disconnect
      setTargetId(null);
      sharedSecretRef.current = null;
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.log('Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('pairing-request', ({ requesterId, publicKey }) => {
      // Auto-accept incoming pairing requests (e.g. from Desktop)
      console.log('Incoming pairing request from:', requesterId);

      // Compute Shared Secret
      if (publicKey) {
        const secret = computeSharedSecret(publicKey, keyPairRef.current.secretKey);
        sharedSecretRef.current = secret;
        console.log('Mobile: Computed Shared Secret (Receiver)');
      }

      newSocket.emit('pairing-response', {
        targetId: requesterId,
        accepted: true,
        publicKey: encodeKey(keyPairRef.current.publicKey) // Send my key back
      });
      setTargetId(requesterId);
      Alert.alert("Connected", `Paired with ${requesterId}`);
    });

    newSocket.on('pairing-response', ({ responderId, accepted, publicKey }) => {
      if (accepted) {
        // Compute Shared Secret
        if (publicKey) {
          const secret = computeSharedSecret(publicKey, keyPairRef.current.secretKey);
          sharedSecretRef.current = secret;
          console.log('Mobile: Computed Shared Secret (Sender)');
        }

        setTargetId(responderId);
        Alert.alert("Connected", `Successfully paired with ${responderId}`);
      } else {
        setTargetId(null);
        Alert.alert("Failed", "Connection declined by target device");
      }
    });

    // START TRANSFER when Web accepts
    newSocket.on('transfer-accepted', async ({ responderId }) => {
      console.log('Transfer accepted! Starting upload...');
      const files = selectedFilesRef.current;
      if (!files || files.length === 0) return;

      const currentIndex = currentFileIndexRef.current;
      const file = files[currentIndex];
      if (!file) return;

      const fileUri = file.uri;
      setIsTransferring(true);
      setProgress(0);
      setTransferInfo(`Sending ${currentIndex + 1}/${files.length}: ${file.name}`);

      try {
        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.size > MAX_FILE_SIZE) {
          Alert.alert("Error", `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
          setIsTransferring(false);
          return;
        }

        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64'
        });

        // Verify encryption is available
        if (!sharedSecretRef.current) {
          Alert.alert("Security Error", "No secure connection established. Please reconnect.");
          setIsTransferring(false);
          return;
        }

        // Chunking
        const CHUNK_SIZE = 64 * 1024; // 64KB chunks
        const totalLength = fileContent.length;
        const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = fileContent.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

          // ENCRYPT CHUNK before sending
          const { encrypted, nonce } = encryptChunk(chunk, sharedSecretRef.current);

          newSocket.emit('file-chunk', {
            targetId: responderId,
            chunk: encrypted,
            nonce: nonce,
            chunkIndex: i,
            totalChunks
          });

          // Update progress
          setProgress(Math.round(((i + 1) / totalChunks) * 100));

          // Small delay to prevent socket flooding
          if (i % 10 === 0) await new Promise(r => setTimeout(r, 10));
        }

        newSocket.emit('transfer-complete', { targetId: responderId });

        // Check if more files to send
        if (currentIndex + 1 < files.length) {
          currentFileIndexRef.current = currentIndex + 1;
          const nextFile = files[currentIndex + 1];

          // Request transfer for next file
          newSocket.emit('transfer-request', {
            targetId: responderId,
            file: {
              name: nextFile.name,
              size: nextFile.size,
              type: nextFile.mimeType,
            }
          });
          setTransferInfo(`Requesting ${currentIndex + 2}/${files.length}: ${nextFile.name}...`);
        } else {
          // All files sent
          Alert.alert("Success", `${files.length} file(s) sent successfully!`);
          setIsTransferring(false);
          setProgress(0);
          setTransferInfo('');
          selectedFilesRef.current = [];
          currentFileIndexRef.current = 0;
        }

      } catch (e) {
        console.error('Transfer failed', e);
        Alert.alert("Error", "File read failed");
        setIsTransferring(false);
      }
    });

    // --- RECEIVING LOGIC (Desktop -> Mobile) ---
    newSocket.on('transfer-request', ({ senderId, file }) => {
      console.log('Incoming transfer from Web:', file.name);
      setIncomingTransfer({ senderId, file });
      incomingChunksRef.current = []; // Reset Buffer

      Alert.alert(
        "Incoming File",
        `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        [
          { text: "Decline", onPress: () => setIncomingTransfer(null), style: "cancel" },
          {
            text: "Accept",
            onPress: () => {
              // We need the socket instance here, but it's newSocket in scope
              newSocket.emit('transfer-accepted', { targetId: senderId });
              setIsTransferring(true); // Re-use state for visual feedback
              setProgress(0);
            }
          }
        ]
      );
    });

    newSocket.on('file-chunk', ({ chunk, nonce, chunkIndex, totalChunks }) => {
      if (!sharedSecretRef.current) {
        console.error("Mobile: Cannot decrypt chunk - No Shared Secret");
        return;
      }

      const decrypted = decryptChunk(chunk, nonce, sharedSecretRef.current);
      if (decrypted) {
        incomingChunksRef.current.push(decrypted);
        const p = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setProgress(p);
      } else {
        console.error("Mobile: Chunk decryption failed", chunkIndex);
      }
    });

    newSocket.on('transfer-complete', async () => {
      console.log('Receive complete. Saving file...');
      const currentIncomingTransfer = incomingTransferRef.current; // Use Ref!

      if (!currentIncomingTransfer) return;

      setIsTransferring(false);
      const base64Data = incomingChunksRef.current.join('');
      const filename = currentIncomingTransfer.file.name;
      const fileUri = FileSystem.documentDirectory + filename;

      try {
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: 'base64'
        });
        console.log('File saved to:', fileUri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Saved", `File saved to ${fileUri}`);
        }
      } catch (e) {
        console.error('Save failed', e);
        Alert.alert("Error", "Failed to save file.");
      }

      setIncomingTransfer(null);
      incomingChunksRef.current = [];
      setProgress(0);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Auto-scan for peers when not connected
  useEffect(() => {
    if (socket && !targetId) {
      socket.emit('find-peers');
      const interval = setInterval(() => {
        socket.emit('find-peers');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [socket, targetId]);

  const handleScan = (data) => {
    // Initiate pairing
    if (!socket) {
      Alert.alert("Error", "Not connected to server yet.");
      return;
    }

    // SEND PUBLIC KEY
    socket.emit('pairing-request', {
      targetId: data,
      publicKey: encodeKey(keyPairRef.current.publicKey)
    });

    setView('home');
    Alert.alert("Connecting...", "Waiting for device to accept...");
  };

  // Manual connection with code
  const handleManualConnect = () => {
    if (!manualCode.trim()) {
      Alert.alert("Error", "Please enter a connection ID");
      return;
    }
    if (!socket) {
      Alert.alert("Error", "Not connected to server yet.");
      return;
    }

    socket.emit('pairing-request', {
      targetId: manualCode.trim(),
      publicKey: encodeKey(keyPairRef.current.publicKey)
    });

    Alert.alert("Connecting...", "Waiting for device to accept...");
    setManualCode('');
  };

  const pickDocument = async () => {
    if (!isConnected) {
      Alert.alert("Error", "Not connected to server");
      return;
    }
    if (!targetId) {
      Alert.alert("Error", "Connect to a device first!");
      return;
    }
    if (isTransferring) {
      Alert.alert("Error", "A transfer is already in progress.");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
        multiple: true, // Enable multiple file selection
      });

      if (result.assets && result.assets.length > 0) {
        // Check file count limit
        if (result.assets.length > MAX_FILES_PER_TRANSFER) {
          Alert.alert("Error", `Maximum ${MAX_FILES_PER_TRANSFER} files per transfer.`);
          return;
        }

        // Check each file size
        for (const file of result.assets) {
          if (file.size > MAX_FILE_SIZE) {
            Alert.alert("Error", `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            return;
          }
        }

        selectedFilesRef.current = result.assets;
        currentFileIndexRef.current = 0;
        const firstFile = result.assets[0];

        console.log('Files selected:', result.assets.length);

        // Emit transfer request for first file
        socket.emit('transfer-request', {
          targetId: targetId,
          file: {
            name: firstFile.name,
            size: firstFile.size,
            type: firstFile.mimeType,
          }
        });

        const fileCount = result.assets.length;
        Alert.alert(
          "Sent Request",
          `Asking to accept ${fileCount} file${fileCount > 1 ? 's' : ''}: ${firstFile.name}${fileCount > 1 ? ` (+${fileCount - 1} more)` : ''}...`
        );
      }
    } catch (err) {
      console.error("Error picking document:", err);
    }
  };

  // NEW: Disconnect from paired device
  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect",
      "Are you sure you want to disconnect from this device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            setTargetId(null);
            sharedSecretRef.current = null;
            selectedFilesRef.current = [];
            currentFileIndexRef.current = 0;
            setIsTransferring(false);
            setProgress(0);
            setTransferInfo(null);
            Alert.alert("Disconnected", "You can now connect to another device.");
          }
        }
      ]
    );
  };

  if (view === 'scanner') {
    return <Scanner onScanned={handleScan} onCancel={() => setView('home')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Logo size={32} />
          <Text style={styles.logoText}>Swiftly</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#34D399' : '#F43F5E' }]} />
      </View>

      <View style={styles.content}>
        {targetId ? (
          <View>
            <Text style={styles.heroText}>Ready to{'\n'}<Text style={styles.heroAccent}>Transfer.</Text></Text>
            <View style={styles.connectedInfo}>
              <Text style={styles.connectedLabel}>Connected to:</Text>
              <Text style={styles.connectedId}>{targetId.slice(0, 12)}...</Text>
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.heroText}>Transfer files{'\n'}<Text style={styles.heroAccent}>without friction.</Text></Text>
        )}

        {/* MODE TOGGLE - Show always but disable when transferring */}
        {!isTransferring && (
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'send' && styles.modeButtonActive]}
              onPress={() => !targetId && setMode('send')}
              disabled={!!targetId}
            >
              <Text style={[styles.modeButtonText, mode === 'send' && styles.modeButtonTextActive]}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'receive' && styles.modeButtonActive]}
              onPress={() => !targetId && setMode('receive')}
              disabled={!!targetId}
            >
              <Text style={[styles.modeButtonText, mode === 'receive' && styles.modeButtonTextActive]}>Receive</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          {isTransferring ? (
            <View style={styles.transferContainer}>
              <ActivityIndicator size="large" color="#00CFD6" />
              <Text style={styles.progressText}>
                {transferInfo || 'Transferring...'}
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.percentageText}>{progress}%</Text>
            </View>
          ) : (
            <>
              {/* RECEIVE MODE - Show QR Code */}
              {mode === 'receive' && !targetId && (
                <QRCodeDisplay
                  connectionId={socket?.id}
                  onCopy={() => Alert.alert("Copied!", "Connection ID copied to clipboard")}
                />
              )}

              {/* SEND MODE */}
              {mode === 'send' && !targetId && (
                <>
                  {/* NEARBY DEVICES LIST */}
                  {nearbyPeers.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Nearby Devices</Text>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {nearbyPeers.map(peer => (
                          <TouchableOpacity
                            key={peer.id}
                            onPress={() => {
                              // Initiate pairing manually
                              Alert.alert("Connecting", `Pairing with ${peer.deviceName}...`);
                              socket.emit('pairing-request', {
                                targetId: peer.id,
                                publicKey: encodeKey(keyPairRef.current.publicKey)
                              });
                              setTargetId(peer.id);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 16,
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: 12,
                              marginBottom: 8,
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.1)'
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 16 }}>{peer.deviceType === 'mobile' ? '📱' : '💻'}</Text>
                              </View>
                              <View>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{peer.deviceName}</Text>
                                <Text style={{ color: '#888', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{peer.id.slice(0, 6)}...</Text>
                              </View>
                            </View>
                            <Text style={{ color: '#00CFD6', fontSize: 10, fontWeight: 'bold' }}>CONNECT</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* MANUAL CODE ENTRY */}
                  <View style={styles.manualEntry}>
                    <Text style={styles.manualLabel}>Or enter connection ID:</Text>
                    <View style={styles.manualInputRow}>
                      <TextInput
                        style={styles.manualInput}
                        value={manualCode}
                        onChangeText={setManualCode}
                        placeholder="Paste connection ID"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={[styles.manualConnectBtn, !manualCode.trim() && styles.manualConnectBtnDisabled]}
                        onPress={handleManualConnect}
                        disabled={!manualCode.trim()}
                      >
                        <Text style={styles.manualConnectText}>→</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.buttonPrimary} onPress={() => setView('scanner')}>
                    <Text style={styles.buttonText}>Scan QR Code</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Select File Button - Show when paired in send mode */}
              {targetId && mode === 'send' && (
                <TouchableOpacity style={styles.buttonPrimary} onPress={pickDocument}>
                  <Text style={styles.buttonText}>Select Files to Send</Text>
                </TouchableOpacity>
              )}

              {/* Show waiting message in receive mode when connected */}
              {targetId && mode === 'receive' && (
                <View style={styles.waitingContainer}>
                  <ActivityIndicator size="small" color="#00CFD6" />
                  <Text style={styles.waitingText}>Waiting for files...</Text>
                  <Text style={styles.waitingSubtext}>The other device can now send you files</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#34D399',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    lineHeight: 48,
  },
  heroAccent: {
    color: '#00CFD6',
  },
  // Connected Info Styles
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  connectedLabel: {
    color: '#888',
    fontSize: 14,
  },
  connectedId: {
    color: '#00CFD6',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  disconnectButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  disconnectText: {
    color: '#F43F5E',
    fontSize: 12,
    fontWeight: '600',
  },
  // Mode Toggle Styles
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0, 207, 214, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 214, 0.2)',
  },
  modeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#00CFD6',
  },
  // Card Styles
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 16,
  },
  buttonPrimary: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonTextSecondary: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transferContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00CFD6',
    borderRadius: 4,
  },
  percentageText: {
    color: '#00CFD6',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Manual Entry Styles
  manualEntry: {
    marginBottom: 16,
  },
  manualLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  manualConnectBtn: {
    backgroundColor: '#00CFD6',
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualConnectBtnDisabled: {
    backgroundColor: 'rgba(0, 207, 214, 0.3)',
  },
  manualConnectText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Divider Styles
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  // Waiting State Styles
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  waitingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingSubtext: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
});
