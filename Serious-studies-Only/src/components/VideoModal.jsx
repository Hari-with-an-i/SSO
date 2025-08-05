import React, { useState, useEffect } from 'react';

const VideoModal = ({ post, onClose, googleDriveManager }) => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!post || !googleDriveManager?.accessToken) {
            setError('Could not authenticate to load video.');
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        let objectUrl = null;

        const fetchVideo = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${post.fileId}?alt=media`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${googleDriveManager.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch video file from Google Drive.');
                }

                const videoBlob = await response.blob();
                if (isMounted) {
                    objectUrl = URL.createObjectURL(videoBlob);
                    setVideoSrc(objectUrl);
                }
            } catch (err) {
                console.error("Error fetching video:", err);
                if (isMounted) {
                    setError('Could not load the video. It might be too large or the file may be corrupt.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchVideo();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [post, googleDriveManager]);

    const renderContent = () => {
        if (isLoading) {
            return <p className="font-doodle text-xl text-gray-300 p-8">Loading video...</p>;
        }
        if (error) {
            return <p className="font-doodle text-xl text-red-400 p-8">{error}</p>;
        }
        if (videoSrc) {
            return (
                <video
                    key={post.fileId}
                    src={videoSrc}
                    controls
                    autoPlay
                    className="max-w-full max-h-[85vh] bg-black rounded-md"
                >
                    Your browser does not support the video tag.
                </video>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[101]" onClick={onClose}>
            <div 
                className="bg-gray-800/50 backdrop-blur-xl border border-white/20 p-4 rounded-lg shadow-xl w-auto max-w-4xl max-h-[95vh] flex flex-col items-center" 
                onClick={e => e.stopPropagation()}
            >
                {renderContent()}
                <div className="text-center mt-4 flex-shrink-0 text-white">
                    <p className="font-handwriting text-2xl text-gray-200">{post.content || post.fileName}</p>
                    <p className="font-doodle text-sm text-gray-400 mt-1">{post.date}</p>
                </div>
            </div>
        </div>
    );
};

export default VideoModal;