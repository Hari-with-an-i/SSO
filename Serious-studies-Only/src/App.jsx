import React, { useState, useEffect, Suspense } from 'react';
import { auth, db } from './firebase';
import AuthScreen from './components/AuthScreen';
import PairingScreen from './components/PairingScreen';
import LandingPage from './components/LandingPage';
import ConnectDriveScreen from './components/ConnectDriveScreen'; // Import the new screen
import googleDriveManager from './googleDriveManager';

const TheWall = React.lazy(() => import('./components/TheWall'));
const Calendar = React.lazy(() => import('./components/Calendar'));
const DailyTasks = React.lazy(() => import('./components/DailyTasks'));
const Chat = React.lazy(() => import('./components/Chat'));
const KissJar = React.lazy(() => import('./components/KissJar'));
const SettingsScreen = React.lazy(() => import('./components/SettingsScreen'));

const LoadingFallback = () => (
    <div className="app-screen flex justify-center items-center bg-[#1a1a1a]">
        <h1 className="font-header text-4xl text-white animate-pulse">Loading...</h1>
    </div>
);

const App = () => {
    const [user, setUser] = useState(null);
    const [coupleId, setCoupleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDriveReady, setIsDriveReady] = useState(false);
    const [activeView, setActiveView] = useState('landing');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const userDocRef = db.collection('users').doc(currentUser.uid);
                const userDocSnap = await userDocRef.get();
                if (userDocSnap.exists && userDocSnap.data().coupleId) {
                    setCoupleId(userDocSnap.data().coupleId);
                    // Check for an existing connection without forcing a popup
                    googleDriveManager.silentConnect().then(success => {
                        setIsDriveReady(success);
                    });
                } else {
                    setCoupleId(null);
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setCoupleId(null);
                setIsDriveReady(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        if (loading) return <LoadingFallback />;
        if (!user) return <AuthScreen />;
        if (!coupleId) return <PairingScreen user={user} setCoupleId={setCoupleId} />;
        
        // This is the new step in the flow
        if (!isDriveReady) return <ConnectDriveScreen onConnected={() => setIsDriveReady(true)} />;

        if (activeView === 'landing') {
            return <LandingPage setActiveView={setActiveView} />;
        }

        const BackButton = () => (
            <button 
                onClick={() => setActiveView('landing')}
                className="fixed top-4 left-4 z-50 bg-white/20 text-white font-header px-4 py-1 rounded-full backdrop-blur-sm hover:bg-white/40 transition-colors"
            >
                ‹ Home
            </button>
        );

        return (
            <Suspense fallback={<LoadingFallback />}>
                <BackButton />
                {activeView === 'wall' && <TheWall coupleId={coupleId} userId={user.uid} googleDriveManager={googleDriveManager} />}
                {activeView === 'calendar' && <Calendar coupleId={coupleId} userId={user.uid} />}
                {activeView === 'tasks' && <DailyTasks coupleId={coupleId} userId={user.uid} />}
                {activeView === 'chat' && <Chat coupleId={coupleId} userId={user.uid} googleDriveManager={googleDriveManager} />}
                {activeView === 'kisses' && <KissJar coupleId={coupleId} userId={user.uid} />}
                {activeView === 'settings' && <SettingsScreen coupleId={coupleId} userId={user.uid} setCoupleId={setCoupleId} />}
            </Suspense>
        );
    };

    return renderContent();
};

export default App;