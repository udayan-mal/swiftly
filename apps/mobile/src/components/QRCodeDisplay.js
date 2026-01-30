import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

/**
 * QRCodeDisplay - Shows QR code for pairing on mobile
 * Similar to web's receive mode
 * Note: Using native Share instead of Clipboard to avoid expo-clipboard dependency issues
 */
export default function QRCodeDisplay({ connectionId, onCopy }) {
    const handleCopy = async () => {
        // Use Share API as a workaround for clipboard
        if (connectionId) {
            try {
                await Share.share({
                    message: connectionId,
                });
                onCopy?.();
            } catch (error) {
                console.error('Copy/Share failed:', error);
            }
        }
    };

    const handleShare = async () => {
        if (connectionId) {
            try {
                await Share.share({
                    message: `Connect to my Swiftly device: ${connectionId}`,
                });
            } catch (error) {
                console.error('Share failed:', error);
            }
        }
    };

    if (!connectionId) {
        return (
            <View style={styles.container}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Connecting...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* QR Code with glow effect */}
            <View style={styles.qrWrapper}>
                <View style={styles.qrGlow} />
                <View style={styles.qrContainer}>
                    <QRCode
                        value={connectionId}
                        size={200}
                        color="#00CFD6"
                        backgroundColor="transparent"
                    />
                </View>
            </View>

            {/* Instructions */}
            <Text style={styles.title}>Your Connection ID</Text>
            <Text style={styles.subtitle}>
                Scan this QR or enter the code on the sender device
            </Text>

            {/* Connection ID with copy button */}
            <TouchableOpacity style={styles.idContainer} onPress={handleCopy} activeOpacity={0.7}>
                <Text style={styles.connectionId} numberOfLines={1} ellipsizeMode="middle">
                    {connectionId}
                </Text>
                <View style={styles.copyIcon}>
                    <Text style={styles.copyIconText}>📋</Text>
                </View>
            </TouchableOpacity>

            {/* Share button */}
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share ID</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    placeholder: {
        width: 200,
        height: 200,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    placeholderText: {
        color: '#666',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    qrWrapper: {
        position: 'relative',
        marginBottom: 24,
    },
    qrGlow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        backgroundColor: '#00CFD6',
        opacity: 0.1,
        borderRadius: 30,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: 'rgba(10, 10, 11, 0.9)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 207, 214, 0.3)',
    },
    title: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    subtitle: {
        color: '#555',
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 207, 214, 0.2)',
        maxWidth: '100%',
    },
    connectionId: {
        color: '#00CFD6',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        flex: 1,
        marginRight: 8,
    },
    copyIcon: {
        padding: 4,
    },
    copyIconText: {
        fontSize: 16,
    },
    shareButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
