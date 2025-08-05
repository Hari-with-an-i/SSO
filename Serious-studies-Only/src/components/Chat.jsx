import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';
import PhotoModal from './PhotoModal';
import VideoModal from './VideoModal';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';
import StarryNightBackground from './StarryNightBackground';

const Chat = ({ coupleId, userId, googleDriveManager }) => {
    const [messages, setMessages] = useState([]);
    const [viewedMedia, setViewedMedia] = useState(null);
    const [inputMode, setInputMode] = useState('text');
    const [recordingTime, setRecordingTime] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [locallyDeletedIds, setLocallyDeletedIds] = useState(new Set());
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!coupleId) return;
        const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
        const q = messagesCol.orderBy('createdAt', 'asc');
        const unsubscribe = q.onSnapshot((snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(fetchedMessages);
        });
        return () => unsubscribe();
    }, [coupleId]);

    useEffect(() => {
        if (!coupleId) return;
        const coupleDocRef = db.collection('couples').doc(coupleId);
        const unsubscribe = coupleDocRef.onSnapshot((doc) => {
            const data = doc.data();
            if (data && data.typingStatus) {
                const partnerId = Object.keys(data.typingStatus).find(id => id !== userId);
                if (partnerId) {
                    setIsPartnerTyping(data.typingStatus[partnerId]);
                }
            }
        });
        return () => unsubscribe();
    }, [coupleId, userId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isPartnerTyping]);

    const updateTypingStatus = (isTyping) => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        const coupleDocRef = db.collection('couples').doc(coupleId);
        coupleDocRef.set({ typingStatus: { [userId]: isTyping } }, { merge: true });
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => updateTypingStatus(false), 3000);
        }
    };

    const handleSendMessage = async (text) => {
        if (!text.trim() && !replyingTo) return;
        updateTypingStatus(false);
        const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
        let messageData = { 
            type: 'text', text, senderId: userId, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
        };
        if (replyingTo) {
            messageData.replyTo = {
                originalMessageId: replyingTo.id,
                originalSenderName: replyingTo.senderId === userId ? "You" : "Your Partner",
                originalMessage: replyingTo.text || replyingTo.fileName || 'Media'
            };
            setReplyingTo(null);
        }
        await messagesCol.add(messageData);
    };
    
    const handleSendFile = async (file) => {
        if (!googleDriveManager.accessToken) {
            alert("Please connect to Google Drive in Settings to send media.");
            return;
        }
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        const tempId = `temp_${Date.now()}`;
        const localUrl = URL.createObjectURL(file);
        const tempMessage = {
            id: tempId, type: fileType, senderId: userId,
            localUrl, status: 'uploading'
        };
        setMessages(prev => [...prev, tempMessage]);
        try {
            const fileId = await googleDriveManager.uploadFile(file, 'chat_media');
            if (fileId) {
                const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
                await messagesCol.add({
                    type: fileType, fileId: fileId, fileName: file.name, senderId: userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            setMessages(prev => prev.map(m => 
                m.id === tempId ? { ...m, status: 'failed' } : m
            ));
        } finally {
            URL.revokeObjectURL(localUrl);
        }
    };

    const handleStartRecording = async () => {
        if (!googleDriveManager.accessToken) {
            alert("Please connect Google Drive in Settings to send voice notes.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const supportedMimeTypes = ['audio/mp4', 'audio/webm'];
            const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
            
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                clearInterval(recordingIntervalRef.current);
                setRecordingTime(0);
                setInputMode('text');
            };
            mediaRecorderRef.current.start();
            setInputMode('recording');
            recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check your browser permissions.");
        }
    };
    
    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && inputMode === 'recording') {
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
        }
    };

    const handleSendRecording = async () => {
        if (mediaRecorderRef.current && inputMode === 'recording') {
            mediaRecorderRef.current.onstop = async () => {
                const mimeType = mediaRecorderRef.current.mimeType;
                const fileExtension = mimeType.split('/')[1];
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${fileExtension}`, { type: mimeType });
                
                const fileId = await googleDriveManager.uploadFile(audioFile, 'voice_messages');
                if (fileId) {
                    const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
                    await messagesCol.add({
                        type: 'audio', fileId: fileId, fileName: audioFile.name, senderId: userId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                audioChunksRef.current = [];
                clearInterval(recordingIntervalRef.current);
                setRecordingTime(0);
                setInputMode('text');
            };
            mediaRecorderRef.current.stop();
        }
    };

    const handleDeleteForMe = (messageId) => {
        setLocallyDeletedIds(prev => new Set(prev).add(messageId));
        setSelectedMessage(null);
    };

    const handleDeleteForEveryone = async (messageId) => {
        await db.collection('couples').doc(coupleId).collection('messages').doc(messageId).delete();
        setSelectedMessage(null);
    };

    const visibleMessages = messages.filter(msg => !locallyDeletedIds.has(msg.id));

    return (
        <div className="app-screen relative bg-[#0a0c27] grid grid-rows-[auto_1fr_auto] h-screen">
            <StarryNightBackground />
            
            <header className="relative z-20 bg-black/20 p-4 text-center backdrop-blur-sm flex items-center justify-between">
                {selectedMessage ? (
                    <>
                        <button onClick={() => setSelectedMessage(null)} className="font-header text-lg text-white">Cancel</button>
                        <div className="font-doodle text-white">1 Selected</div>
                        <div className="flex gap-4">
                            <button onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }} className="text-2xl text-white">↩️</button>
                            <button onClick={() => handleDeleteForEveryone(selectedMessage.id)} className="text-2xl text-white">🗑️</button>
                        </div>
                    </>
                ) : (
                    <h1 className="font-header text-4xl text-white w-full" style={{textShadow: '0 0 5px rgba(255,250,205,0.5)'}}>Love Notes</h1>
                )}
            </header>
            
            <main className="relative z-10 overflow-y-auto p-4">
                {visibleMessages.map(msg => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isSender={msg.senderId === userId}
                        onReply={setReplyingTo}
                        onLongPress={setSelectedMessage}
                        isSelected={selectedMessage?.id === msg.id}
                        onMediaClick={setViewedMedia}
                        googleDriveManager={googleDriveManager}
                    />
                ))}
                {isPartnerTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-3xl rounded-bl-lg font-doodle text-gray-300">
                            typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="relative z-20 p-4 border-t border-white/20">
                <ChatFooter
                    onSendMessage={handleSendMessage}
                    onSendFile={handleSendFile}
                    onStartRecording={handleStartRecording}
                    onCancelRecording={handleCancelRecording}
                    onSendRecording={handleSendRecording}
                    inputMode={inputMode}
                    recordingTime={recordingTime}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    onTyping={() => updateTypingStatus(true)}
                />
            </footer>

            {/* --- THIS IS THE CORRECTED SECTION --- */}
            {viewedMedia && viewedMedia.type === 'image' && (
                <PhotoModal post={viewedMedia} onClose={() => setViewedMedia(null)} />
            )}
            {viewedMedia && viewedMedia.type === 'video' && (
                <VideoModal post={viewedMedia} onClose={() => setViewedMedia(null)} googleDriveManager={googleDriveManager} />
            )}
        </div>
    );
};

export default Chat;