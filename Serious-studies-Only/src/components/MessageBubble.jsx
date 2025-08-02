import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';

const MessageBubble = ({ msg, isSender, onReply, onDeleteForMe, onDeleteForEveryone, onMediaClick, googleDriveManager }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isThumbnailReady, setIsThumbnailReady] = useState(false);

    const renderMessageContent = () => {
        // Handle temporary local states first
        if (msg.status === 'uploading') {
            return (
                <div className="relative max-w-xs">
                    <img src={msg.localUrl} className="max-w-xs rounded-lg opacity-40" alt="Uploading..." />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-center items-center text-white font-doodle rounded-lg">
                        <p>Uploading...</p>
                    </div>
                </div>
            );
        }
        if (msg.status === 'failed') {
            return (
                 <div className="max-w-xs text-red-500 font-doodle">
                    <p>Upload Failed</p>
                    <p className="text-xs">Please try sending the file again.</p>
                </div>
            )
        }
        
        // Handle messages from Firestore
        if (msg.type === 'deleted') {
            return <p className="italic text-gray-400">🗑️ This message was deleted</p>;
        }

        const mediaProps = {
            id: msg.id, fileId: msg.fileId, type: msg.type,
            content: msg.fileName || msg.text,
        };

        switch (msg.type) {
            case 'text':
                return <p className="break-words whitespace-pre-wrap">{msg.text}</p>;
            case 'image':
            case 'video':
                const imageUrl = googleDriveManager.getPublicViewUrl(msg.fileId);
                return (
                    <div onClick={() => isThumbnailReady && onMediaClick({...mediaProps, imageUrl})} className="relative max-w-xs cursor-pointer">
                        <img 
                            src={imageUrl} 
                            referrerPolicy="no-referrer" 
                            className={`rounded-lg w-full transition-opacity duration-300 ${isThumbnailReady ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setIsThumbnailReady(true)}
                            alt={msg.fileName} 
                        />
                        {!isThumbnailReady && (
                            <div className="absolute inset-0 bg-gray-200 rounded-lg flex justify-center items-center">
                                <p className="font-doodle text-sm text-gray-500">Processing...</p>
                            </div>
                        )}
                        {isThumbnailReady && msg.type === 'video' && (
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center pointer-events-none rounded-lg">
                                <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 0111 8v4a1 1 0 01-1.445.894l-3-2a1 1 0 010-1.788l3-2z"></path></svg>
                            </div>
                        )}
                    </div>
                );
            case 'audio':
                return <AudioPlayer src={`https://drive.google.com/uc?export=download&id=${msg.fileId}`} />;
            default:
                return null;
        }
    };

    const ReplyContent = () => (
        <div className={`p-2 rounded-lg mb-1 text-sm ${isSender ? 'bg-black/10' : 'bg-gray-200'}`}>
            <p className="font-bold text-xs">{msg.replyTo.originalSenderName || 'User'}</p>
            <p className="truncate opacity-80">{msg.replyTo.originalMessage}</p>
        </div>
    );

    return (
        <div 
            className={`flex items-end gap-2 group mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}
            onMouseLeave={() => setShowMenu(false)}
        >
            {!isSender && msg.type !== 'deleted' && (
                 <button onClick={() => onReply(msg)} className="mb-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">↩️</button>
            )}

            <div 
                className={`p-3 max-w-[75%] font-handwriting text-xl relative ${isSender ? 'bg-[#A8BFCE] text-white rounded-3xl rounded-br-lg' : 'bg-white rounded-3xl rounded-bl-lg'}`}
                style={{ maskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><filter id=\"filter\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.04\" numOctaves=\"5\" seed=\"20\" /><feDisplacementMap in=\"SourceGraphic\" scale=\"4\" /></filter></defs><rect width=\"100%\" height=\"100%\" filter=\"url(%23filter)\" /></svg>')" }}
            >
                {msg.replyTo && <ReplyContent />}
                {renderMessageContent()}
            </div>

            {isSender && msg.type !== 'deleted' && (
                <div className="relative mb-2 flex items-center">
                    <button onClick={() => onReply(msg)} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">↩️</button>
                    <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">⋮</button>
                    {showMenu && (
                        <div className="absolute bottom-full right-0 mb-1 w-48 bg-white rounded-lg shadow-lg z-20 font-doodle text-left">
                            <button onClick={() => {onDeleteForMe(msg.id); setShowMenu(false);}} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Delete for Me</button>
                            <button onClick={() => {onDeleteForEveryone(msg.id); setShowMenu(false);}} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Delete for Everyone</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;