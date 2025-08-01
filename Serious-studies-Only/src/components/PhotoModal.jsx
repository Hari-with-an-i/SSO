import React from 'react';

const PhotoModal = ({ post, onClose }) => {
    if (!post) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[101]" onClick={onClose}>
            <div className="bg-white p-4 rounded-lg max-w-5xl w-auto max-h-[95vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                <img src={`${post.imageUrl}&t=${new Date().getTime()}`} alt={post.content} referrerPolicy="no-referrer" className="max-w-full max-h-[90vh] object-contain"/>
                <div className="text-center mt-2 flex-shrink-0">
                    <p className="font-handwriting text-2xl text-gray-700">{post.content}</p>
                    <p className="font-doodle text-sm text-gray-500 mt-1">{post.date}</p>
                </div>
            </div>
        </div>
    );
};

export default PhotoModal;