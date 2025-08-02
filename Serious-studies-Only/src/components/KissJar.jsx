import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import SendKissModal from './SendKissModal';
import ViewKissModal from './ViewKissModal';

const KISS_REDEEM_THRESHOLD = 30;

const KissJar = ({ coupleId, userId }) => {
    const [kisses, setKisses] = useState([]);
    const [dateTokens, setDateTokens] = useState([]);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [viewedKiss, setViewedKiss] = useState(null);

    // Fetch kisses
    useEffect(() => {
        if (!coupleId) return;
        const unsubscribe = db.collection('couples').doc(coupleId).collection('kisses')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const fetchedKisses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setKisses(fetchedKisses);
            });
        return () => unsubscribe();
    }, [coupleId]);

    // Fetch date tokens
    useEffect(() => {
        if (!coupleId) return;
        const unsubscribe = db.collection('couples').doc(coupleId).collection('dateTokens')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const fetchedTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDateTokens(fetchedTokens);
            });
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

    // Generate stable random positions for each kiss within the filled area
    const kissPositions = useMemo(() => {
        return kisses.map(() => {
            // The top boundary of the liquid (e.g., if 20% full, top starts at 80%)
            const topStart = 100 - fillPercentage;
            // Randomize the top position only within the liquid's area
            const randomTop = Math.random() * fillPercentage + topStart;

            return {
                // Clamp the value to ensure it stays visually within the jar
                top: `${Math.min(randomTop, 90)}%`, 
                left: `${Math.random() * 80 + 10}%`,
                transform: `rotate(${Math.random() * 40 - 20}deg) scale(${Math.random() * 0.4 + 0.8})`,
            };
        });
    }, [kisses, fillPercentage]);

    return (
        <div className="app-screen bg-[#F4A599] flex flex-col justify-center items-center p-4 overflow-y-auto">
            <h1 className="font-header text-6xl text-white mb-4 flex-shrink-0" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>Kiss Jar</h1>
            
            <div className="relative w-64 h-80 mb-4 flex-shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[15%] bg-[#9CAF88] border-8 border-[#8a9f7a] rounded-t-2xl z-20" />
                <div className="absolute bottom-0 w-full h-[85%] bg-white/50 border-8 border-[#A8BFCE] border-t-0 rounded-b-[45px] backdrop-blur-sm overflow-hidden">
                    
                    {/* Rising fill effect */}
                    <div 
                        className="absolute bottom-0 left-0 w-full bg-pink-300 transition-all duration-500 ease-out" 
                        style={{ height: `${fillPercentage}%` }}
                    ></div>

                    {/* Kiss icons floating on top */}
                    {kisses.map((kiss, index) => (
                        <div key={kiss.id} style={kissPositions[index]} onClick={() => setViewedKiss(kiss)}
                             className="absolute text-4xl cursor-pointer transition-transform hover:scale-125 z-10">
                            ❤️
                        </div>
                    ))}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF7F0] p-4 rounded-lg shadow-md border-2 border-dashed border-gray-700 z-20">
                    <span className="font-header text-5xl text-gray-700">{kisses.length}</span>
                    <p className="font-doodle text-gray-500 -mt-2">kisses</p>
                </div>
            </div>

            <div className="text-center flex-shrink-0">
                <button onClick={() => setIsSendModalOpen(true)} className="font-header text-3xl bg-white text-[#F4A599] px-8 py-2 rounded-full hover:bg-opacity-90 transition-transform hover:scale-105">
                    Send a Kiss
                </button>
                <div className="mt-4">
                    <button onClick={handleRedeemKisses} disabled={kisses.length < KISS_REDEEM_THRESHOLD} className="font-doodle text-xl bg-[#A8BFCE] text-white px-6 py-2 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Redeem {kisses.length}/{KISS_REDEEM_THRESHOLD} Kisses
                    </button>
                </div>
            </div>

            {dateTokens.length > 0 && (
                <div className="mt-8 w-full max-w-md flex-shrink-0">
                    <h2 className="font-header text-4xl text-white text-center">Our Date Tokens</h2>
                    <div className="space-y-2 mt-2">
                        {dateTokens.map(token => (
                            <div key={token.id} className="bg-white/70 p-3 rounded-lg text-center font-doodle text-gray-700">
                                {token.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <SendKissModal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} coupleId={coupleId} userId={userId} />
            {viewedKiss && <ViewKissModal kiss={viewedKiss} onClose={() => setViewedKiss(null)} />}
        </div>
    );
};

export default KissJar;