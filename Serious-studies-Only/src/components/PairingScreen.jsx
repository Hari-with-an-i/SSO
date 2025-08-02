import React, { useState } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const PairingScreen = ({ user, setCoupleId }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const createCoupleSpace = async () => {
        setError('');
        try {
            const newCoupleRef = db.collection('couples').doc();
            const newCoupleId = newCoupleRef.id;
            const newPairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await newCoupleRef.set({ members: [user.uid], pairingCode: newPairingCode, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            await db.collection('users').doc(user.uid).set({ coupleId: newCoupleId }, { merge: true });
            setCoupleId(newCoupleId);
        } catch (err) {
            console.error("Error creating space:", err);
            setError("Could not create space. Check Firebase rules.");
        }
    };

    const joinCoupleSpace = async () => {
        setError('');
        if (!code.trim()) return;
        try {
            const q = db.collection("couples").where("pairingCode", "==", code.toUpperCase());
            const querySnapshot = await q.get();
            if (querySnapshot.empty) {
                setError("Invalid pairing code.");
                return;
            }
            const coupleDoc = querySnapshot.docs[0];
            await coupleDoc.ref.update({ members: firebase.firestore.FieldValue.arrayUnion(user.uid), pairingCode: null });
            await db.collection('users').doc(user.uid).set({ coupleId: coupleDoc.id }, { merge: true });
            setCoupleId(coupleDoc.id);
        } catch (err) {
            console.error("Error joining space:", err);
            setError("Could not join space. Check Firebase rules.");
        }
    };

    return (
        <div className="app-screen bg-[#A8BFCE] flex justify-center items-center p-4">
            <div className="w-full max-w-md bg-[#FAF7F0] p-8 rounded-2xl shadow-2xl text-center space-y-6">
                <div className="mb-4">
                    <h2 className="font-header text-5xl">How It Works</h2>
                    <p className="font-doodle text-gray-600 mt-2">
                        To get started, **one person** should create a new space to get a code. The **other person** then uses that code to join.
                    </p>
                </div>

                <div>
                    <h2 className="font-header text-5xl mb-2">Create a New Space</h2>
                    <button onClick={createCoupleSpace} className="w-full mt-2 bg-[#9CAF88] text-white font-header text-3xl p-2 rounded-lg">I'm setting up our gift!</button>
                </div>

                <div className="font-doodle text-gray-500">OR</div>

                <div>
                    <h2 className="font-header text-5xl mb-2">Join Your Partner</h2>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Enter pairing code..." className="w-full p-3 rounded-lg border-2 font-doodle text-center uppercase" />
                    <button onClick={joinCoupleSpace} className="w-full mt-4 bg-[#F4A599] text-white font-header text-3xl p-2 rounded-lg">Join their space</button>
                    {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default PairingScreen;