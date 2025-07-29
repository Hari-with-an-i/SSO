import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';

const SettingsScreen = ({ coupleId, userId, setCoupleId }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(googleDriveManager.accessToken ? 'Already connected!' : 'Not connected.');
    const [coupleData, setCoupleData] = useState(null);

    useEffect(() => {
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

    const handleRemovePartner = async () => {
        if (!coupleData || coupleData.members.length < 2) {
            alert("There is no partner to remove.");
            return;
        }

        if (window.confirm("Are you sure you want to remove your partner? This will allow you to invite someone new.")) {
            try {
                const partnerId = coupleData.members.find(id => id !== userId);
                const newPairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                await db.collection('couples').doc(coupleId).update({
                    members: firebase.firestore.FieldValue.arrayRemove(partnerId),
                    pairingCode: newPairingCode
                });

                await db.collection('users').doc(partnerId).update({
                    coupleId: null
                });

                alert("Partner removed. You can now invite someone new with the updated pairing code.");
                setCoupleData(prev => ({...prev, pairingCode: newPairingCode, members: [userId]}));
            } catch (error) {
                console.error("Error removing partner:", error);
                alert("Failed to remove partner.");
            }
        }
    };

    return (
        <div className="app-screen p-4 bg-[#A8BFCE] flex flex-col justify-center items-center">
            <h1 className="font-header text-5xl text-white mb-8">Settings</h1>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center space-y-6">
                <div>
                    <h2 className="font-doodle text-2xl mb-4">Pairing</h2>
                    {coupleData?.pairingCode ? (
                        <div>
                            <p className="font-doodle">Share this code with your partner:</p>
                            <p className="font-mono text-2xl bg-gray-200 p-2 rounded-md">{coupleData.pairingCode}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-doodle text-gray-500">Your partner has joined!</p>
                            <button onClick={handleRemovePartner} className="mt-2 w-full bg-red-400 text-white font-header text-2xl p-2 rounded-lg">
                                Remove Partner
                            </button>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="font-doodle text-2xl mb-4">Google Drive</h2>
                    <button onClick={handleConnectDrive} disabled={isConnecting || !!googleDriveManager.accessToken} className="w-full bg-[#9CAF88] text-white font-header text-3xl p-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400">
                        {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
                    </button>
                    {connectionStatus && <p className="mt-4 text-gray-600">{connectionStatus}</p>}
                </div>
                <div>
                     <h2 className="font-doodle text-2xl mb-4">Account</h2>
                     <button onClick={handleLogout} className="w-full bg-[#F4A599] text-white font-header text-3xl p-2 rounded-lg hover:bg-opacity-90 transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;