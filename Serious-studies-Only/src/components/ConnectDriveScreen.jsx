import React, { useState } from 'react';
import StarryNightBackground from './StarryNightBackground';
import googleDriveManager from '../googleDriveManager';

const ConnectDriveScreen = ({ onConnected }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        setIsConnecting(true);
        setError('');
        try {
            const success = await googleDriveManager.connectDrive();
            if (success) {
                onConnected();
            } else {
                throw new Error("Connection was not successful.");
            }
        } catch (err) {
            setError("Connection failed or was cancelled. Please try again.");
            console.error("Drive connection error:", err);
        }
        setIsConnecting(false);
    };

    return (
        <div className="app-screen relative bg-[#0a0c27] flex justify-center items-center p-4">
            <StarryNightBackground />
            <div className="relative z-10 w-full max-w-md bg-black/20 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-xl text-center text-white">
                <h1 className="font-header text-5xl mb-4">One Last Step</h1>
                <p className="font-doodle text-lg text-gray-300 mb-8">
                    To save and share all your photos and videos, please connect your shared Google Drive account.
                </p>
                <button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="w-full bg-yellow-400 text-gray-800 font-header text-3xl p-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500/50"
                >
                    {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
                </button>
                {error && <p className="text-red-400 mt-4 text-sm font-doodle">{error}</p>}
            </div>
        </div>
    );
};

export default ConnectDriveScreen;