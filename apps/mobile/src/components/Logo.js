import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Logo({ size = 64, color = "#00CFD6" }) {
    const strokeWidth = size * 0.12;
    const circleRadius = size * 0.44; // Matches r=22/50 scale roughly
    const offset = size * 0.15; // Shift circles left/right

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {/* Ambient Glow */}
            <View
                style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    backgroundColor: color,
                    opacity: 0.2,
                    borderRadius: size,
                    // Note: Blur isn't natively supported on basic Views without libraries, 
                    // so we use opacity/layering for a simple glow feel or skip blur.
                }}
            />

            {/* Container for the symbol */}
            <View style={{ width: size, height: size, position: 'relative' }}>

                {/* Left Circle */}
                <View
                    style={{
                        position: 'absolute',
                        left: (size / 2) - circleRadius - offset,
                        top: (size / 2) - circleRadius,
                        width: circleRadius * 2,
                        height: circleRadius * 2,
                        borderRadius: circleRadius,
                        borderColor: color,
                        borderWidth: strokeWidth,
                    }}
                />

                {/* Right Circle */}
                <View
                    style={{
                        position: 'absolute',
                        left: (size / 2) - circleRadius + offset,
                        top: (size / 2) - circleRadius,
                        width: circleRadius * 2,
                        height: circleRadius * 2,
                        borderRadius: circleRadius,
                        borderColor: color,
                        borderWidth: strokeWidth,
                    }}
                />

                {/* "Cuts" - We simulate these with rotated Views matching background color 
                   Background is #0A0A0B. 
                */}

                {/* Cut 1: Top Intersection */}
                <View
                    style={{
                        position: 'absolute',
                        left: size * 0.45,
                        top: size * 0.15,
                        width: strokeWidth * 0.6,
                        height: size * 0.3,
                        backgroundColor: '#0A0A0B', // App Background Color
                        transform: [{ rotate: '30deg' }],
                    }}
                />

                {/* Cut 2: Bottom Intersection */}
                <View
                    style={{
                        position: 'absolute',
                        left: size * 0.45,
                        top: size * 0.55,
                        width: strokeWidth * 0.6,
                        height: size * 0.3,
                        backgroundColor: '#0A0A0B', // App Background Color
                        transform: [{ rotate: '30deg' }],
                    }}
                />

            </View>
        </View>
    );
}
