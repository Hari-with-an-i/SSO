import React, { useState } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const kissTypes = {
    "Good Morning": "☀️",
    "Good Night": "🌙",
    "Miss You": "🥰",
    "Thank You": "🙏",
    "I'm Sorry": "😔",
    "Just Because": "✨"
};

const SendKissModal = ({ isOpen, onClose, coupleId, userId }) => {
    const [selectedType, setSelectedType] = useState("Just Because");
    const [note, setNote] = useState("");

    if (!isOpen) return null;

    const handleSendKiss = async () => {
        if (!selectedType) {
            alert("Please select a type of kiss!");
            return;
        }
        await db.collection('couples').doc(coupleId).collection('kisses').add({
            senderId: userId,
            type: selectedType,
            note: note,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setNote("");
        setSelectedType("Just Because");
        onClose();
    };

    const typeButtonClass = (type) => 
        `p-2 rounded-lg border-2 transition-all ${selectedType === type ? 'bg-yellow-400/20 border-yellow-400 scale-105' : 'bg-white/10 border-white/20'}`;


    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-sm text-white">
                <h2 className="font-header text-5xl text-center mb-4 text-white">Send a Kiss</h2>
                <p className="font-doodle text-center text-gray-300 mb-4">What kind of kiss is it?</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(kissTypes).map(([type, emoji]) => (
                        <button key={type} onClick={() => setSelectedType(type)}
                                className={typeButtonClass(type)}>
                            <span className="text-2xl">{emoji}</span>
                            <span className="block text-xs font-doodle">{type}</span>
                        </button>
                    ))}
                </div>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a short note... (optional)"
                    className="w-full p-3 bg-transparent border-b-2 border-dashed border-white/30 font-doodle text-xl focus:outline-none focus:border-yellow-400 mb-6"
                    rows="2"
                    maxLength="100"
                />
                <div className="flex justify-between">
                    <button onClick={onClose} className="font-header text-3xl px-6 py-1 rounded-full text-gray-300 hover:text-white">Cancel</button>
                    <button onClick={handleSendKiss} className="font-header text-3xl px-8 py-2 rounded-full text-gray-800 bg-yellow-400 hover:bg-yellow-300">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendKissModal;