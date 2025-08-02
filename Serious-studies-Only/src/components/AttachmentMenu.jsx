import React from 'react';

const AttachmentMenu = ({ onGalleryClick, onCameraClick }) => {
    return (
        <div className="absolute bottom-20 left-4 z-10 bg-white rounded-2xl shadow-lg p-2 flex flex-col gap-2 w-48 font-doodle">
            <button onClick={onCameraClick} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
                <span className="text-2xl">📸</span>
                <span>Camera</span>
            </button>
            <button onClick={onGalleryClick} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
                <span className="text-2xl">🖼️</span>
                <span>Gallery</span>
            </button>
        </div>
    );
};

export default AttachmentMenu;