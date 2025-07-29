import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';

const Chat = ({ coupleId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!coupleId) return;
        const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
        const q = messagesCol.orderBy('createdAt', 'asc');
        const unsubscribe = q.onSnapshot((snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [coupleId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
        await messagesCol.add({ 
            type: 'text',
            text: input, 
            senderId: userId, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
        });
        setInput('');
    };
    
    const handleSendMedia = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!googleDriveManager.accessToken) {
            alert("Please connect to Google Drive in Settings to send media.");
            return;
        }

        const fileId = await googleDriveManager.uploadFile(file, 'chat_media');
        if (fileId) {
            const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
            await messagesCol.add({
                type: file.type.startsWith('image/') ? 'image' : 'file',
                fileId: fileId,
                fileName: file.name,
                senderId: userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    };

    return (
        <div className="app-screen flex flex-col h-screen bg-[#FAF7F0]" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')"}}>
            <header className="bg-[#9CAF88] p-4 text-center shadow-md"><h1 className="font-header text-4xl text-white">Love Notes</h1></header>
            <main className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex group relative ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 px-5 max-w-[75%] font-handwriting text-xl relative ${msg.senderId === userId ? 'bg-[#A8BFCE] text-white rounded-3xl rounded-br-lg' : 'bg-white rounded-3xl rounded-bl-lg'}`}
                            style={{ maskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><filter id=\"filter\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.04\" numOctaves=\"5\" seed=\"20\" /><feDisplacementMap in=\"SourceGraphic\" scale=\"4\" /></filter></defs><rect width=\"100%\" height=\"100%\" filter=\"url(%23filter)\" /></svg>')" }}>
                            {msg.type === 'text' && msg.text}
                            {msg.type === 'image' && <img src={googleDriveManager.getPublicViewUrl(msg.fileId)} className="max-w-xs rounded-lg" />}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t-2 border-dashed border-[#9CAF88]">
                <div className="bg-white rounded-full flex items-center p-2 shadow-inner">
                    <input type="file" ref={fileInputRef} onChange={handleSendMedia} className="hidden" />
                    <button onClick={() => fileInputRef.current.click()} className="text-2xl mx-2 transition-transform hover:scale-110">📎</button>
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-grow bg-transparent border-none focus:ring-0 px-4 font-comfortaa" placeholder="Type a love note..." />
                    <button onClick={sendMessage} className="text-3xl transition-transform hover:scale-110 p-2">
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Chat;