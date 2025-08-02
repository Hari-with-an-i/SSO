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
            return <p className="font-doodle text-xl text-gray-600 p-8">Loading video...</p>;
        }
        if (error) {
            return <p className="font-doodle text-xl text-red-500 p-8">{error}</p>;
        }
        if (videoSrc) {
            return (
                <video
                    key={post.fileId}
                    src={videoSrc}
                    controls
                    autoPlay
                    className="max-w-full max-h-[90vh] bg-black"
                >
                    Your browser does not support the video tag.
                </video>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-85 flex justify-center items-center z-[101]" onClick={onClose}>
            <div className="bg-white p-4 rounded-lg max-w-4xl w-auto max-h-[95vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                {renderContent()}
                <div className="text-center mt-2 flex-shrink-0">
                    <p className="font-handwriting text-2xl text-gray-700">{post.content || post.fileName}</p>
                    <p className="font-doodle text-sm text-gray-500 mt-1">{post.date}</p>
                </div>
            </div>
        </div>
    );
};

export default VideoModal;