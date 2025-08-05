import React from 'react';

const StarryNightBackground = () => (
    <svg className="fixed inset-0 w-full h-full z-0" preserveAspectRatio="xMidYMid slice">
        <defs>
            <radialGradient id="skyGradient" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="#2b133d" />
                <stop offset="100%" stopColor="#0a0c27" />
            </radialGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#skyGradient)" />

        {[...Array(100)].map((_, i) => (
            <circle
                key={i}
                cx={`${Math.random() * 100}%`}
                cy={`${Math.random() * 100}%`}
                r={Math.random() * 1.2}
                fill="white"
                style={{ animation: `twinkle ${Math.random() * 5 + 3}s ease-in-out infinite` }}
            />
        ))}
        
        <circle cx="15%" cy="20%" r="40" fill="#fffacd" filter="url(#glow)" />
    </svg>
);

export default StarryNightBackground;