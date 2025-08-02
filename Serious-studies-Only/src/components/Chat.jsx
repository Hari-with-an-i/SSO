import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';
import PhotoModal from './PhotoModal';
import VideoModal from './VideoModal';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';

const Chat = ({ coupleId, userId, googleDriveManager }) => {
    const [messages, setMessages] = useState([]);
    const [viewedMedia, setViewedMedia] = useState(null);
    const [inputMode, setInputMode] = useState('text');
    const [recordingTime, setRecordingTime] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [locallyDeletedIds, setLocallyDeletedIds] = useState(new Set());
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    
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
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
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
    };

    const handleDeleteForEveryone = async (messageId) => {
        const messageRef = db.collection('couples').doc(coupleId).collection('messages').doc(messageId);
        await messageRef.update({
            type: 'deleted', text: null, fileId: null, fileName: null, replyTo: null
        });
    };

    const visibleMessages = messages.filter(msg => !locallyDeletedIds.has(msg.id));

    return (
        <div className="app-screen flex flex-col h-screen bg-[#FAF7F0]" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')"}}>
            <header className="bg-[#9CAF88] p-4 text-center shadow-md flex-shrink-0"><h1 className="font-header text-4xl text-white">Love Notes</h1></header>
            
            <main className="flex-grow p-4 overflow-y-auto">
                {visibleMessages.map(msg => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isSender={msg.senderId === userId}
                        onReply={setReplyingTo}
                        onDeleteForMe={handleDeleteForMe}
                        onDeleteForEveryone={handleDeleteForEveryone}
                        onMediaClick={setViewedMedia}
                        googleDriveManager={googleDriveManager}
                    />
                ))}
                {isPartnerTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="p-3 bg-white rounded-3xl rounded-bl-lg font-doodle text-gray-500">
                            typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t-2 border-dashed border-[#9CAF88] flex-shrink-0">
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

            {viewedMedia && viewedMedia.type === 'image' && (
                <PhotoModal post={viewedMedia} onClose={() => setViewedMedia(null)} />
            )}
             {viewedMedia && viewedMedia.type === 'video' && (
                <VideoModal post={viewedMedia} onClose={() => setViewedMedia(null)} />
            )}
        </div>
    );
};

export default Chat;