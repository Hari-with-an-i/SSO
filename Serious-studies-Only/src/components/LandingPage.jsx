import React from 'react';

// A single, self-contained component for the navigation buttons
const NavItem = ({ onClick, viewName, icon, label }) => (
    <button
        onClick={() => onClick(viewName)}
        className="flex items-center gap-4 w-full text-left p-4 rounded-xl text-white font-doodle text-2xl hover:bg-white/10 transition-colors duration-200"
    >
        <span className="w-8 h-8 text-white">{icon}</span>
        {label}
    </button>
);

const LandingPage = ({ setActiveView }) => {
    // A self-contained SVG for the sky, stars, and moon
    const StarryNightBackground = () => (
        <svg className="absolute inset-0 w-full h-full z-0" preserveAspectRatio="xMidYMid slice">
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
    
    // Define the custom icons for the menu
    const icons = {
        wall: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" /></svg>,
        calendar: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" /></svg>,
        tasks: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        chat: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.934.09-1.405 0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
        kisses: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
        settings: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.95.542.057 1.007.56 1.061 1.11M15.75 10.494v.001M21.122 11.258l-3.32 3.32a1.5 1.5 0 01-2.121 0l-3.32-3.32a1.5 1.5 0 012.121-2.121l3.32 3.32a1.5 1.5 0 010 2.121zM9.594 15.75v3.136c0 .542-.424 1.011-.95 1.11-.542.099-1.007-.367-1.11-.951v-3.136c0-.542.424-1.011.95-1.11.542-.099 1.007.367 1.11.951z" /></svg>,
    };

    return (
        <div className="app-screen bg-[#0a0c27] flex justify-center items-center relative overflow-hidden">
            <StarryNightBackground />

            {/* Centered Menu */}
            <div className="relative z-20 bg-black/20 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-white/20 w-full max-w-xs">
                <h1 className="font-header text-5xl md:text-6xl text-white text-center mb-6">Serious Studies Only</h1>
                <nav className="flex flex-col gap-2">
                    <NavItem onClick={setActiveView} viewName="wall" icon={icons.wall} label="The Wall" />
                    <NavItem onClick={setActiveView} viewName="calendar" icon={icons.calendar} label="Calendar" />
                    <NavItem onClick={setActiveView} viewName="tasks" icon={icons.tasks} label="Daily Tasks" />
                    <NavItem onClick={setActiveView} viewName="chat" icon={icons.chat} label="Chat" />
                     <NavItem onClick={setActiveView} viewName="kisses" icon={icons.kisses} label="Kiss Jar" />
                    <NavItem onClick={setActiveView} viewName="settings" icon={icons.settings} label="Settings" />
                </nav>
            </div>
        </div>
    );
};

export default LandingPage;