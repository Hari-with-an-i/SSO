import React from 'react';

const PhotoModal = ({ post, onClose }) => {
    if (!post) return null;

    // Using your original, working logic for the image source
    const imageSrc = `${post.imageUrl}&t=${new Date().getTime()}`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[101]" onClick={onClose}>
            <div 
                className="bg-gray-800/50 backdrop-blur-xl border border-white/20 p-4 rounded-lg shadow-xl w-auto max-w-4xl max-h-[95vh] flex flex-col items-center" 
                onClick={e => e.stopPropagation()}
            >
                <img src={imageSrc} alt={post.content || post.fileName} referrerPolicy="no-referrer" className="max-w-full max-h-[85vh] object-contain rounded-md"/>
                <div className="text-center mt-4 flex-shrink-0 text-white">
                    <p className="font-handwriting text-2xl text-gray-200">{post.content || post.fileName}</p>
                    <p className="font-doodle text-sm text-gray-400 mt-1">{post.date}</p>
                </div>
            </div>
        </div>
    );
};

export default PhotoModal;