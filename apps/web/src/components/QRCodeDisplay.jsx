import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeDisplay({ text, width = 200, color = '#00CFD6' }) {
    const [src, setSrc] = useState('');

    useEffect(() => {
        if (!text) return;

        QRCode.toDataURL(text, {
            width: width,
            margin: 2,
            color: {
                dark: color,
                light: '#00000000', // Transparent background
            },
        })
            .then((url) => {
                setSrc(url);
            })
            .catch((err) => {
                console.error('Error generating QR code', err);
            });
    }, [text, width, color]);

    if (!src) {
        return (
            <div
                className="flex items-center justify-center bg-slate-900/50 rounded-xl border border-white/10"
                style={{ width: width, height: width }}
            >
                <span className="animate-pulse text-slate-500 text-xs font-mono">Generating...</span>
            </div>
        );
    }

    return (
        <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-[#00CFD6]/30 rounded-2xl opacity-50 blur-lg group-hover:opacity-75 transition-opacity duration-500"></div>
            <img
                src={src}
                alt="QR Code"
                className="relative z-10 rounded-xl border border-white/10 shadow-2xl"
                style={{ width: width, height: width }}
            />
        </div>
    );
}
