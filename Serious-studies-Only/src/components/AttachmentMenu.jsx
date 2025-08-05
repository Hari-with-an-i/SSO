import React from 'react';

const AttachmentMenu = ({ onGalleryClick, onCameraImageClick, onCameraVideoClick }) => {
    return (
        <div className="absolute bottom-20 left-4 z-10 bg-white rounded-2xl shadow-lg p-2 flex flex-col gap-2 w-56 font-doodle text-lg">
            <button onClick={onCameraImageClick} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
                <span className="text-2xl">📸</span>
                <span>Take Photo</span>
            </button>
            <button onClick={onCameraVideoClick} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
                <span className="text-2xl">📹</span>
                <span>Record Video</span>
            </button>
            <button onClick={onGalleryClick} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
                <span className="text-2xl">🖼️</span>
                <span>Photo & Video Library</span>
            </button>
        </div>
    );
};

export default AttachmentMenu;