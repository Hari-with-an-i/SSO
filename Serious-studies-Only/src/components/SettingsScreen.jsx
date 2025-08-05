import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';
import StarryNightBackground from './StarryNightBackground';

const SettingsScreen = ({ coupleId, userId, setCoupleId }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(googleDriveManager.accessToken ? 'Already connected!' : 'Not connected.');
    const [coupleData, setCoupleData] = useState(null);

    useEffect(() => {
        if (!coupleId) return;
        const fetchCoupleData = async () => {
            const coupleDoc = await db.collection('couples').doc(coupleId).get();
            if (coupleDoc.exists) {
                setCoupleData(coupleDoc.data());
            }
        };
        fetchCoupleData();
    }, [coupleId]);
    
    const handleConnectDrive = async () => {
        setIsConnecting(true);
        setConnectionStatus('Connecting to Google Drive...');
        try {
            const success = await googleDriveManager.connectDrive();
            setConnectionStatus(success ? 'Successfully connected to Google Drive!' : 'Failed to connect.');
        } catch (error) {
            setConnectionStatus('Connection failed or was cancelled.');
        }
        setIsConnecting(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('googleDriveFolderIds');
        googleDriveManager.accessToken = null;
        auth.signOut();
    };

    const handleLeaveSpace = async () => {
        const confirmation = prompt("Type 'LEAVE' to confirm leaving your current space. This cannot be undone and is intended for fixing pairing issues.");
        if (confirmation === 'LEAVE') {
            try {
                const coupleDocRef = db.collection('couples').doc(coupleId);
                await coupleDocRef.update({
                    members: firebase.firestore.FieldValue.arrayRemove(userId)
                });
                
                const userDocRef = db.collection('users').doc(userId);
                await userDocRef.update({
                    coupleId: null
                });
                
                setCoupleId(null);
                
            } catch (error) {
                console.error("Error leaving space:", error);
                alert("Failed to leave the space. Please try again.");
            }
        } else {
            alert("Action cancelled.");
        }
    };

    return (
        <div className="app-screen relative bg-[#0a0c27] p-4 flex flex-col justify-center items-center">
            <StarryNightBackground />
            <div className="relative z-10 w-full max-w-md">
                <h1 className="font-header text-6xl text-white text-center mb-8" style={{textShadow: '0 0 10px rgba(255,250,205,0.5)'}}>Settings</h1>
                <div className="bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-lg text-white text-center space-y-8">
                    
                    {/* Pairing Section */}
                    <div>
                        <h2 className="font-doodle text-2xl mb-4 text-gray-300">Pairing</h2>
                        {coupleData?.pairingCode ? (
                            <div>
                                <p className="font-doodle text-gray-300">Share this code with your partner:</p>
                                <p className="font-mono text-2xl bg-black/20 p-2 mt-2 rounded-md text-yellow-300">{coupleData.pairingCode}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-doodle text-gray-400">You are paired with your partner!</p>
                            </div>
                        )}
                    </div>

                    {/* Google Drive Section */}
                    <div>
                        <h2 className="font-doodle text-2xl mb-4 text-gray-300">Google Drive</h2>
                        <button onClick={handleConnectDrive} disabled={isConnecting || !!googleDriveManager.accessToken} className="w-full bg-yellow-400 text-gray-800 font-header text-3xl p-2 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500/20 disabled:text-gray-400 disabled:cursor-not-allowed">
                            {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
                        </button>
                        {connectionStatus && <p className="mt-4 text-gray-400 font-doodle">{connectionStatus}</p>}
                    </div>

                    {/* Account Section */}
                    <div>
                        <h2 className="font-doodle text-2xl mb-4 text-gray-300">Account</h2>
                        <button onClick={handleLogout} className="w-full bg-white/10 text-white font-header text-3xl p-2 rounded-lg hover:bg-white/20 transition-colors">
                            Logout
                        </button>
                        <div className="mt-4">
                            <button onClick={handleLeaveSpace} className="w-full bg-red-800/50 border border-red-500/50 text-white font-header text-2xl p-2 rounded-lg hover:bg-red-700/50 transition-colors">
                                Leave Space & Re-pair
                            </button>
                            <p className="text-xs text-gray-500 font-doodle mt-2">
                                Use this if you and your partner accidentally created separate spaces.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;