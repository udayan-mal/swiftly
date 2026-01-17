import React from 'react';

/**
 * Swiftly Brand Logo - "The Interlocked Infinity"
 * Recreated from user reference (image_e56e25).
 * Two thick circular links interlocking with diagonal cuts.
 * * @param {object} props
 * @param {string} [props.className] - Tailwind classes
 * @param {number} [props.size] - Size in pixels (default: 64)
 * @param {string} [props.color] - Brand color (default: Swiftly Teal #00CFD6)
 */
export default function Logo({ className = "", size = 64, color = "#00CFD6" }) {
    const maskId = React.useId();

    return (
        <div
            className={`relative flex items-center justify-center select-none ${className}`}
            style={{ width: size, height: size }}
        >
            {/* 1. Ambient Glow (Matches the reference's bold feel) */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-20"
                style={{ backgroundColor: color }}
            ></div>

            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-full h-full drop-shadow-md"
                aria-label="Swiftly Logo"
            >
                <defs>
                    {/* The Mask: Defines where the "Cuts" are.
                        White = Visible, Black = Hidden (The Cut).
                    */}
                    <mask id={maskId}>
                        <rect x="0" y="0" width="100" height="100" fill="white" />

                        {/* Cut 1: Top Intersection Slash (Diagonal / ) */}
                        <rect
                            x="46"
                            y="15"
                            width="8"
                            height="30"
                            transform="rotate(30 50 30)"
                            fill="black"
                        />

                        {/* Cut 2: Bottom Intersection Slash (Diagonal / ) 
                             Matches the symmetry of the first cut.
                         */}
                        <rect
                            x="46"
                            y="55"
                            width="8"
                            height="30"
                            transform="rotate(30 50 70)"
                            fill="black"
                        />
                    </mask>
                </defs>

                {/* The Geometry: Two overlapping circles masked by the cuts */}
                <g mask={`url(#${maskId})`}>
                    {/* Left Circle */}
                    <circle
                        cx="35"
                        cy="50"
                        r="22"
                        stroke={color}
                        strokeWidth="12"
                    />

                    {/* Right Circle */}
                    <circle
                        cx="65"
                        cy="50"
                        r="22"
                        stroke={color}
                        strokeWidth="12"
                    />
                </g>
            </svg>
        </div>
    );
}