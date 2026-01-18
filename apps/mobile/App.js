import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from "socket.io-client";
import { useEffect, useState, useRef } from 'react';
import Scanner from './src/components/Scanner';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

// Replace with your computer's local IP address (e.g., 192.168.1.X)
// 'localhost' only works on iOS Simulator, use '10.0.2.2' for Android Emulator
const SERVER_URL = 'http://192.168.0.100:3001';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'scanner'
  const [targetId, setTargetId] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState(0);
  const selectedFileRef = useRef(null); // Keep track of file to send

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Mobile connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Mobile disconnected');
      setIsConnected(false);
    });

    newSocket.on('pairing-request', ({ requesterId }) => {
      // Auto-accept incoming pairing requests (e.g. from Desktop)
      console.log('Incoming pairing request from:', requesterId);
      newSocket.emit('pairing-response', { targetId: requesterId, accepted: true });
      setTargetId(requesterId);
      Alert.alert("Connected", `Paired with ${requesterId}`);
    });

    newSocket.on('pairing-response', ({ responderId, accepted }) => {
      if (accepted) {
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
      if (!selectedFileRef.current) return;

      const fileUri = selectedFileRef.current.uri;
      setIsTransferring(true);
      setProgress(0);

      try {
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64'
        });

        // Chunking
        const CHUNK_SIZE = 64 * 1024; // 64KB chunks
        const totalLength = fileContent.length;
        const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = fileContent.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          newSocket.emit('file-chunk', {
            targetId: responderId,
            chunk,
            chunkIndex: i,
            totalChunks
          });

          // Update progress
          setProgress(Math.round(((i + 1) / totalChunks) * 100));

          // Small delay to prevent socket flooding
          if (i % 10 === 0) await new Promise(r => setTimeout(r, 10));
        }

        newSocket.emit('transfer-complete', { targetId: responderId });
        Alert.alert("Success", "File sent successfully!");
        setIsTransferring(false);
        setProgress(0);
        selectedFileRef.current = null;

      } catch (e) {
        console.error('Transfer failed', e);
        Alert.alert("Error", "File read failed");
        setIsTransferring(false);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleScan = (data) => {
    // Initiate pairing
    if (!socket) return;
    socket.emit('pairing-request', { targetId: data });
    setView('home');
    Alert.alert("Connecting...", "Waiting for device to accept...");
  };

  const pickDocument = async () => {
    if (!isConnected) {
      Alert.alert("Error", "Not connected to server");
      return;
    }
    if (!targetId) {
      Alert.alert("Error", "Scan a QR code first!");
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
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        selectedFileRef.current = file; // Store for later
        console.log('File selected:', file);

        // Emit transfer request to signaling server
        socket.emit('transfer-request', {
          targetId: targetId,
          file: {
            name: file.name,
            size: file.size,
            type: file.mimeType,
          }
        });

        Alert.alert("Sent Request", `Asking ${targetId} to accept ${file.name}...`);
      }
    } catch (err) {
      console.error("Error picking document:", err);
    }
  };

  if (view === 'scanner') {
    return <Scanner onScanned={handleScan} onCancel={() => setView('home')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* Simple Circle Logo for now */}
          <View style={styles.logoCircle} />
          <Text style={styles.logoText}>Swiftly</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#34D399' : '#F43F5E' }]} />
      </View>

      <View style={styles.content}>
        {targetId ? (
          <View>
            <Text style={styles.heroText}>Ready to{'\n'}<Text style={styles.heroAccent}>Transfer.</Text></Text>
            <Text style={{ color: 'gray', marginBottom: 20 }}>Connected to: {targetId}</Text>
          </View>
        ) : (
          <Text style={styles.heroText}>Transfer files{'\n'}<Text style={styles.heroAccent}>without friction.</Text></Text>
        )}

        <View style={styles.card}>
          {!targetId && (
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => setView('scanner')}>
              <Text style={styles.buttonText}>Scan to Connect</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.buttonSecondary} onPress={pickDocument}>
            <Text style={styles.buttonTextSecondary}>Select File</Text>
          </TouchableOpacity>
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
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00CFD6',
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
    marginBottom: 48,
    lineHeight: 48,
  },
  heroAccent: {
    color: '#00CFD6',
  },
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
});
