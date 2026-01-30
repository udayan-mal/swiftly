import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Animated, Vibration, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Scanner({ onScanned, onCancel }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [hasScanned, setHasScanned] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Scanning line animation
    useEffect(() => {
        const scanAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        scanAnimation.start();

        return () => scanAnimation.stop();
    }, []);

    // Pulse animation for scan frame
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, []);

    const handleBarCodeScanned = ({ data }) => {
        if (hasScanned) return;
        
        // Validate QR code format (should be a socket.io ID format)
        if (!data || data.length < 10) {
            // Invalid QR code
            Vibration.vibrate([0, 100, 50, 100]); // Error pattern
            return;
        }

        setHasScanned(true);
        Vibration.vibrate(100); // Success feedback
        
        // Small delay for visual feedback
        setTimeout(() => {
            onScanned(data);
        }, 300);
    };

    if (!permission) {
        // Camera permissions are still loading.
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Initializing camera...</Text>
                </View>
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <View style={styles.permissionIcon}>
                        <Text style={{ fontSize: 48 }}>📷</Text>
                    </View>
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionMessage}>
                        To scan QR codes, Swiftly needs access to your camera. 
                        Your camera data stays private and is never stored.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButtonAlt} onPress={onCancel}>
                        <Text style={styles.cancelTextAlt}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 220],
    });

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={flashEnabled}
                onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.flashButton} 
                        onPress={() => setFlashEnabled(!flashEnabled)}
                    >
                        <Text style={styles.flashIcon}>{flashEnabled ? '⚡' : '🔦'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Scan Frame */}
                <Animated.View 
                    style={[
                        styles.scanFrame,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    {/* Corner decorations */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                    
                    {/* Animated scan line */}
                    <Animated.View 
                        style={[
                            styles.scanLine,
                            { transform: [{ translateY: scanLineTranslate }] }
                        ]}
                    />
                </Animated.View>

                <Text style={styles.scanText}>
                    {hasScanned ? 'Connecting...' : 'Point at the QR Code on your computer'}
                </Text>
                <Text style={styles.scanHint}>
                    Make sure the QR code is well-lit and within the frame
                </Text>

                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#00CFD6',
        fontSize: 16,
        fontWeight: '500',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    permissionIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 207, 214, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    permissionTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionMessage: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    permissionButton: {
        backgroundColor: '#00CFD6',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 16,
        marginBottom: 16,
    },
    permissionButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButtonAlt: {
        paddingVertical: 12,
    },
    cancelTextAlt: {
        color: '#888',
        fontSize: 14,
    },
    header: {
        position: 'absolute',
        top: 60,
        right: 20,
    },
    flashButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flashIcon: {
        fontSize: 24,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    scanFrame: {
        width: 250,
        height: 250,
        backgroundColor: 'transparent',
        borderRadius: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00CFD6',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 24,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 24,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 24,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 24,
    },
    scanLine: {
        position: 'absolute',
        left: 10,
        right: 10,
        height: 2,
        backgroundColor: '#00CFD6',
        shadowColor: '#00CFD6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    scanText: {
        color: 'white',
        marginTop: 32,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    scanHint: {
        color: '#888',
        marginTop: 8,
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    cancelButton: {
        position: 'absolute',
        bottom: 60,
        paddingVertical: 14,
        paddingHorizontal: 40,
        backgroundColor: 'rgba(255, 68, 68, 0.9)',
        borderRadius: 25,
    },
    cancelText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
