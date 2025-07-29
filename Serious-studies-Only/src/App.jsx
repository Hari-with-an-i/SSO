
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import AuthScreen from './components/AuthScreen';
import PairingScreen from './components/PairingScreen';
import TheWall from './components/TheWall';
import Calendar from './components/Calendar';
import DailyTasks from './components/DailyTasks';
import Chat from './components/Chat';
import KissJar from './components/KissJar';
import SettingsScreen from './components/SettingsScreen';
import googleDriveManager from './googleDriveManager';

const App = () => {
    const [user, setUser] = useState(null);
    const [coupleId, setCoupleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDriveReady, setIsDriveReady] = useState(false);
    const [activeView, setActiveView] = useState('wall');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const userDocRef = db.collection('users').doc(currentUser.uid);
                const userDocSnap = await userDocRef.get();
                if (userDocSnap.exists && userDocSnap.data().coupleId) {
                    const currentCoupleId = userDocSnap.data().coupleId;
                    setCoupleId(currentCoupleId);
                    googleDriveManager.silentConnect().then(success => {
                        if (success) {
                            setIsDriveReady(true);
                        }
                    });
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

    const NavItem = ({ view, icon, label }) => (
        <button onClick={() => setActiveView(view)} className={`text-center text-white transition-transform hover:translate-y-[-5px] ${activeView !== view ? 'opacity-70' : ''}`}>
            <span className="text-3xl">{icon}</span>
            <span className="block text-xs font-doodle">{label}</span>
        </button>
    );

    const renderContent = () => {
        if (loading) return <div className="app-screen flex justify-center items-center"><h1 className="font-header text-4xl animate-pulse">Loading...</h1></div>;
        if (!user) return <AuthScreen />;
        if (!coupleId) return <PairingScreen user={user} setCoupleId={setCoupleId} />;
        if (!isDriveReady) return <div className="app-screen flex justify-center items-center"><h1 className="font-header text-4xl animate-pulse">Connecting to Google Drive...</h1></div>;

        return (
            <React.Fragment>
                <div className="relative">
                    {activeView === 'wall' && <TheWall coupleId={coupleId} userId={user.uid} googleDriveManager={googleDriveManager} />}
                    {activeView === 'calendar' && <Calendar coupleId={coupleId} />}
                    {activeView === 'tasks' && <DailyTasks coupleId={coupleId} userId={user.uid} />}
                    {activeView === 'chat' && <Chat coupleId={coupleId} userId={user.uid} />}
                    {activeView === 'kisses' && <KissJar coupleId={coupleId} />}
                    {activeView === 'settings' && <SettingsScreen coupleId={coupleId} userId={user.uid} setCoupleId={setCoupleId} />}
                </div>
                <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#9CAF88] flex justify-around items-center rounded-t-2xl shadow-lg z-50">
                    <NavItem view="wall" icon="🖼️" label="Wall" />
                    <NavItem view="calendar" icon="🗓️" label="Dates" />
                    <NavItem view="tasks" icon="📝" label="Tasks" />
                    <NavItem view="chat" icon="💬" label="Chat" />
                    <NavItem view="kisses" icon="🍯" label="Kisses" />
                    <NavItem view="settings" icon="⚙️" label="Settings" />
                </nav>
            </React.Fragment>
        );
    };

    return renderContent();
};

export default App;
