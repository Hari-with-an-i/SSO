import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import SendKissModal from './SendKissModal';
import ViewKissModal from './ViewKissModal';
import StarryNightBackground from './StarryNightBackground';

const KISS_REDEEM_THRESHOLD = 30;

const KissJar = ({ coupleId, userId }) => {
    const [kisses, setKisses] = useState([]);
    const [dateTokens, setDateTokens] = useState([]);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [viewedKiss, setViewedKiss] = useState(null);

    useEffect(() => {
        if (!coupleId) return;
        const unsubscribe = db.collection('couples').doc(coupleId).collection('kisses')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const fetchedKisses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setKisses(fetchedKisses);
            }, err => console.error("Error fetching kisses:", err));
        return () => unsubscribe();
    }, [coupleId]);

    useEffect(() => {
        if (!coupleId) return;
        const unsubscribe = db.collection('couples').doc(coupleId).collection('dateTokens')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const fetchedTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDateTokens(fetchedTokens);
            }, err => console.error("Error fetching date tokens:", err));
        return () => unsubscribe();
    }, [coupleId]);

    const handleRedeemKisses = async () => {
        if (kisses.length < KISS_REDEEM_THRESHOLD) {
            alert("You haven't collected enough kisses yet!");
            return;
        }

        const tokenTitle = prompt("You've collected enough kisses! What is this Date Token for?", "A romantic movie night!");

        if (tokenTitle && tokenTitle.trim()) {
            const tokensCol = db.collection('couples').doc(coupleId).collection('dateTokens');
            await tokensCol.add({
                title: tokenTitle,
                createdBy: userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const batch = db.batch();
            const kissesCol = db.collection('couples').doc(coupleId).collection('kisses');
            kisses.forEach(kiss => {
                batch.delete(kissesCol.doc(kiss.id));
            });
            await batch.commit();
            
            alert("Congratulations! Your new Date Token has been created.");
        }
    };
    
    const fillPercentage = Math.min((kisses.length / KISS_REDEEM_THRESHOLD) * 100, 100);

    const kissPositions = useMemo(() => {
        return kisses.map(() => {
            const topStart = 100 - fillPercentage;
            const randomTop = Math.random() * fillPercentage + topStart;

            return {
                top: `${Math.min(randomTop, 90)}%`, 
                left: `${Math.random() * 80 + 10}%`,
                transform: `rotate(${Math.random() * 40 - 20}deg)`,
                fontSize: `${Math.random() * 1.5 + 1}rem`,
            };
        });
    }, [kisses, fillPercentage]);

    return (
        <div className="app-screen relative bg-[#0a0c27] flex flex-col justify-center items-center p-4 overflow-y-auto">
            <StarryNightBackground />
            <div className="relative z-10 flex flex-col items-center justify-center">
                <h1 className="font-header text-6xl text-white mb-4 flex-shrink-0" style={{textShadow: '0 0 10px rgba(255,250,205,0.5)'}}>Kiss Jar</h1>
                
                <div className="relative w-64 h-80 mb-4 flex-shrink-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[10%] bg-gray-300/20 border-2 border-white/30 rounded-t-lg z-20 backdrop-blur-sm"></div>
                    <div className="absolute bottom-0 w-full h-[90%] bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-b-[45px] rounded-t-[5px] overflow-hidden">
                        
                        <div 
                            className="absolute bottom-0 left-0 w-full transition-all duration-500 ease-out" 
                            style={{ 
                                height: `${fillPercentage}%`,
                                background: 'radial-gradient(circle, rgba(254,240,138,0.2) 0%, rgba(254,240,138,0) 70%)'
                            }}
                        ></div>

                        {kisses.map((kiss, index) => (
                            <div key={kiss.id} onClick={() => setViewedKiss(kiss)}
                                 className="absolute text-yellow-300 cursor-pointer transition-transform hover:scale-150 z-10"
                                 style={{...kissPositions[index], filter: 'drop-shadow(0 0 5px #fef08a)'}}>
                                ✨
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm p-4 rounded-lg border-2 border-white/10 z-20">
                        <span className="font-header text-5xl text-white">{kisses.length}</span>
                        <p className="font-doodle text-gray-300 -mt-2">kisses</p>
                    </div>
                </div>

                <div className="text-center flex-shrink-0">
                    <button onClick={() => setIsSendModalOpen(true)} className="font-header text-3xl bg-yellow-400 text-gray-800 px-8 py-2 rounded-full hover:bg-yellow-300 transition-transform hover:scale-105">
                        Send a Kiss
                    </button>
                    <div className="mt-4">
                        <button onClick={handleRedeemKisses} disabled={kisses.length < KISS_REDEEM_THRESHOLD} className="font-doodle text-xl bg-white/10 text-white px-6 py-2 rounded-full disabled:bg-gray-400/20 disabled:text-gray-400 disabled:cursor-not-allowed border border-white/20 backdrop-blur-sm">
                            Redeem {kisses.length}/{KISS_REDEEM_THRESHOLD} Kisses
                        </button>
                    </div>
                </div>

                {dateTokens.length > 0 && (
                    <div className="mt-8 w-full max-w-md flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/20 p-4 rounded-lg">
                        <h2 className="font-header text-4xl text-white text-center">Our Date Tokens</h2>
                        <div className="space-y-2 mt-2">
                            {dateTokens.map(token => (
                                <div key={token.id} className="bg-black/20 p-3 rounded-lg text-center font-doodle text-gray-200">
                                    {token.title}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <SendKissModal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} coupleId={coupleId} userId={userId} />
            {viewedKiss && <ViewKissModal kiss={viewedKiss} onClose={() => setViewedKiss(null)} />}
        </div>
    );
};

export default KissJar;