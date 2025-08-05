import React, { useState, useRef } from 'react';
import AttachmentMenu from './AttachmentMenu';

const ChatFooter = ({ onSendMessage, onSendFile, onStartRecording, onCancelRecording, onSendRecording, inputMode, recordingTime, replyingTo, onCancelReply, onTyping }) => {
    const [input, setInput] = useState('');
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    
    const galleryInputRef = useRef(null);
    const cameraImageInputRef = useRef(null);
    const cameraVideoInputRef = useRef(null);

    const handleSend = () => {
        if (input.trim() || replyingTo) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onSendFile(file);
        }
        setShowAttachmentMenu(false);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (onTyping) {
            onTyping();
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (inputMode === 'recording') {
        return (
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center p-2 shadow-inner text-white">
                <button onClick={onCancelRecording} className="text-3xl text-red-400 p-2 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div className="flex-grow text-center rounded-full bg-red-500/20 animate-pulse">
                    <span className="font-doodle text-red-300">Recording... ({formatTime(recordingTime)})</span>
                </div>
                <button onClick={onSendRecording} className="text-3xl text-green-400 p-2 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
             {replyingTo && (
                <div className="bg-black/20 backdrop-blur-md p-2 rounded-t-lg mx-2 flex justify-between items-center border-b border-white/10">
                    <div className="border-l-4 border-yellow-400 pl-2 text-sm overflow-hidden text-white">
                        <p className="font-bold text-gray-200">Replying to {replyingTo.senderId === userId ? "Yourself" : "Your Partner"}</p>
                        <p className="truncate text-gray-400">{replyingTo.text || replyingTo.fileName || 'Media'}</p>
                    </div>
                    <button onClick={onCancelReply} className="p-1 text-gray-400 hover:text-white">✖</button>
                </div>
            )}
            {showAttachmentMenu && (
                <AttachmentMenu 
                    onGalleryClick={() => galleryInputRef.current.click()}
                    onCameraImageClick={() => cameraImageInputRef.current.click()}
                    onCameraVideoClick={() => cameraVideoInputRef.current.click()}
                />
            )}
            <div className={`bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center p-2 shadow-inner ${replyingTo ? 'rounded-t-none' : ''}`} onClick={() => setShowAttachmentMenu(false)}>
                <input type="file" ref={galleryInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                <input type="file" ref={cameraImageInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="user" />
                <input type="file" ref={cameraVideoInputRef} onChange={handleFileChange} className="hidden" accept="video/*" capture="user" />
                
                <button onClick={(e) => { e.stopPropagation(); setShowAttachmentMenu(!showAttachmentMenu); }} className="text-2xl p-2 text-gray-300 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                
                <input type="text" value={input} onChange={handleInputChange} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-grow bg-transparent border-none focus:ring-0 px-2 md:px-4 font-comfortaa text-lg text-white placeholder:text-gray-400" placeholder="Type a love note..." />
                
                {input ? (
                    <button onClick={handleSend} className="p-2 text-gray-800 bg-yellow-400 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </button>
                ) : (
                    <button onClick={onStartRecording} className="p-2 text-gray-300 hover:text-white">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatFooter;