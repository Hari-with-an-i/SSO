import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import DoodleCanvas from './DoodleCanvas';

const KissJar = ({ coupleId }) => {
    const [kissCount, setKissCount] = useState(0);
    const [isDoodling, setIsDoodling] = useState(false);
    const jarWrapperRef = useRef(null);
    const MAX_KISSES = 100;

    useEffect(() => {
        if (!coupleId) return;
        const coupleDocRef = db.collection('couples').doc(coupleId);
        const unsubscribe = coupleDocRef.onSnapshot((docSnap) => {
            if (docSnap.exists) setKissCount(docSnap.data().kissCount || 0);
        });
        return () => unsubscribe();
    }, [coupleId]);

    const sendKiss = async () => {
        if (!coupleId) return;
        await db.collection('couples').doc(coupleId).update({ kissCount: firebase.firestore.FieldValue.increment(1) });
    };
    
    const collectKisses = async () => {
        if (!coupleId || kissCount === 0) return;
        await db.collection('couples').doc(coupleId).update({ kissCount: 0 });
    }

    const fillPercentage = Math.min((kissCount / MAX_KISSES) * 100, 100);

    return (
        <div className="app-screen bg-[#F4A599] flex flex-col justify-center items-center p-4">
            <button onClick={() => setIsDoodling(true)} className="font-doodle text-2xl fixed top-4 right-4 bg-white p-3 rounded-full shadow-lg z-50">✏️</button>
            <DoodleCanvas isActive={isDoodling} onClose={() => setIsDoodling(false)} />
            <h1 className="font-header text-6xl text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>Kiss Jar</h1>
            <div ref={jarWrapperRef} className="relative w-64 h-80">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[15%] bg-[#9CAF88] border-8 border-[#8a9f7a] rounded-t-2xl" />
                <div className="absolute bottom-0 w-full h-[85%] bg-white/50 border-8 border-[#A8BFCE] border-t-0 rounded-b-[45px] backdrop-blur-sm overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full bg-pink-300 transition-all duration-500 ease-out" style={{ height: `${fillPercentage}%` }}></div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF7F0] p-4 rounded-lg shadow-md border-2 border-dashed border-gray-700">
                    <span className="font-header text-5xl text-gray-700">{kissCount}</span>
                    <p className="font-doodle text-gray-500 -mt-2">kisses</p>
                </div>
            </div>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
                <button onClick={sendKiss} className="font-doodle text-xl bg-white border-2 border-gray-700 rounded-2xl px-5 py-2 shadow-[2px_2px_0_#444] active:shadow-none active:translate-y-0.5">☀️ Morning</button>
                <button onClick={sendKiss} className="font-doodle text-xl bg-white border-2 border-gray-700 rounded-2xl px-5 py-2 shadow-[2px_2px_0_#444] active:shadow-none active:translate-y-0.5">❤️ Love</button>
            </div>
            <button onClick={collectKisses} className="mt-6 font-header text-3xl bg-[#A8BFCE] text-white px-8 py-2 rounded-full hover:bg-opacity-90 transition-colors">Collect Kisses!</button>
        </div>
    );
};

export default KissJar;