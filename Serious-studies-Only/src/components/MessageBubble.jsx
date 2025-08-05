import React from 'react';
import AudioPlayer from './AudioPlayer';
import googleDriveManager from '../googleDriveManager';
import { useDrag, useLongPress } from 'react-use-gesture';
import { useSpring, animated } from '@react-spring/web';

const MessageBubble = ({ msg, isSender, onReply, onLongPress, isSelected, onMediaClick, googleDriveManager }) => {
    const [{ x }, api] = useSpring(() => ({ x: 0, config: { tension: 250, friction: 30 } }));

    const bindGestures = useDrag(({ down, movement: [mx], longpress, cancel }) => {
        if (longpress && isSender) {
            onLongPress(msg);
            cancel();
            return;
        }

        if (!isSender && mx < 0) return;
        if (isSender && mx > 0) return;
        
        if (!down && Math.abs(mx) > 60) {
            onReply(msg);
        }
        api.start({ x: down ? mx : 0, immediate: down });
    }, {
        axis: 'x',
        filterTaps: true,
        bounds: isSender ? { left: -100, right: 0 } : { left: 0, right: 100 },
        rubberband: true,
        delay: 200
    });

    const MediaMessage = ({ msg, onMediaClick }) => {
        const [isThumbnailReady, setIsThumbnailReady] = useState(false);
        const mediaProps = {
            id: msg.id, fileId: msg.fileId, type: msg.type,
            content: msg.fileName, imageUrl: msg.fileId ? googleDriveManager.getPublicViewUrl(msg.fileId) : null,
        };
        if (!mediaProps.imageUrl) return <div>Error: Media link not found.</div>;
        return (
            <div onClick={() => isThumbnailReady && onMediaClick(mediaProps)} className="relative max-w-xs cursor-pointer">
                <img 
                    src={mediaProps.imageUrl} 
                    referrerPolicy="no-referrer" 
                    className={`rounded-lg w-full transition-opacity duration-300 ${isThumbnailReady ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsThumbnailReady(true)}
                    alt={msg.fileName} 
                />
                {!isThumbnailReady && <div className="absolute inset-0 bg-black/20 rounded-lg flex justify-center items-center"><p className="font-doodle text-sm text-gray-300">Processing...</p></div>}
                {isThumbnailReady && msg.type === 'video' && <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center pointer-events-none rounded-lg"><svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 0111 8v4a1 1 0 01-1.445.894l-3-2a1 1 0 010-1.788l3-2z"></path></svg></div>}
            </div>
        );
    };

    const renderMessageContent = () => {
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
                 <div className="max-w-xs text-red-400 font-doodle">
                    <p>Upload Failed</p>
                    <p className="text-xs">Please try again.</p>
                </div>
            );
        }
        switch (msg.type) {
            case 'text':
                return <p className="break-words whitespace-pre-wrap text-lg md:text-xl">{msg.text}</p>;
            case 'image':
            case 'video':
                return <MediaMessage msg={msg} onMediaClick={onMediaClick} />;
            case 'audio':
                return <AudioPlayer src={msg.fileId} googleDriveManager={googleDriveManager} isSender={isSender} />;
            default:
                return null;
        }
    };

    const ReplyContent = () => (
        <div className={`p-2 rounded-lg mb-1 text-sm ${isSender ? 'bg-black/20' : 'bg-black/10'}`}>
            <p className="font-bold text-xs">{msg.replyTo.originalSenderName || 'User'}</p>
            <p className="truncate opacity-80">{msg.replyTo.originalMessage}</p>
        </div>
    );

    return (
        <div className={`relative mb-4 flex items-center ${isSender ? 'justify-end' : 'justify-start'}`}>
            <div className="absolute top-1/2 -translate-y-1/2 text-3xl opacity-50" style={{ [isSender ? 'right' : 'left']: isSender ? 'auto' : '-50px', [isSender ? 'left' : 'right']: isSender ? '-50px' : 'auto' }}>
                ↩️
            </div>
            <animated.div 
                {...bindGestures()}
                style={{ x, touchAction: 'pan-y' }} 
                className={`relative z-10 transition-colors duration-200 rounded-3xl ${isSelected ? (isSender ? 'bg-yellow-400/30' : 'bg-white/30') : ''}`}
            >
                <div className={`p-3 max-w-[75vw] md:max-w-md font-handwriting text-xl relative rounded-3xl ${isSender ? 'bg-yellow-400/10 text-white rounded-br-lg' : 'bg-white/10 text-gray-200 rounded-bl-lg'} backdrop-blur-md border border-white/10`}>
                    {msg.replyTo && <ReplyContent />}
                    {renderMessageContent()}
                </div>
            </animated.div>
        </div>
    );
};

export default MessageBubble;