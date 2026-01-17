import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { io } from "socket.io-client";
import { useEffect, useState } from 'react';

// Replace with your computer's local IP address (e.g., 192.168.1.X)
// 'localhost' only works on iOS Simulator, use '10.0.2.2' for Android Emulator
const SERVER_URL = 'http://192.168.1.5:3001';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

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

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

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
        <Text style={styles.heroText}>Transfer files{'\n'}<Text style={styles.heroAccent}>without friction.</Text></Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.buttonPrimary}>
            <Text style={styles.buttonText}>Scan to Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSecondary}>
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
