import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';

const AddPostModal = ({ isOpen, onClose, coupleId, userId }) => {
    const [caption, setCaption] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };
    
    const handleSubmit = async () => {
        if (!imageFile || !caption.trim()) {
            alert("Please select a photo and write a caption.");
            return;
        }
        if (!googleDriveManager.accessToken) {
            alert("Please connect to Google Drive in the Settings tab first!");
            return;
        }

        setIsUploading(true);
        try {
            const fileId = await googleDriveManager.uploadFile(imageFile, 'photos');
            
            if (fileId) {
                const postsCol = db.collection('couples').doc(coupleId).collection('posts');
                await postsCol.add({
                    userId,
                    fileId,
                    caption,
                    likes: 0,
                    likedBy: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                handleClose();
            } else {
                throw new Error("File upload to Google Drive failed or did not return a fileId.");
            }
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post. Check the console for details.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setCaption('');
        setImageFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/lined-paper.png')"}}>
                <h2 className="font-header text-5xl text-center mb-4 text-gray-700">Add a Memory</h2>
                
                <button onClick={() => fileInputRef.current.click()} className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-500 font-doodle text-xl mb-4">
                    {imageFile ? imageFile.name : "Click to select a photo"}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    className="w-full p-3 bg-transparent border-b-2 border-dashed border-gray-400 font-doodle text-2xl focus:outline-none mb-6"
                    rows="2"
                />
                
                <div className="flex justify-between">
                    <button onClick={handleClose} disabled={isUploading} className="font-header text-3xl px-6 py-1 rounded-full">Cancel</button>
                    <button onClick={handleSubmit} disabled={isUploading} className="font-header text-3xl px-8 py-2 rounded-full text-white bg-[#9CAF88]">
                        {isUploading ? "Uploading..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPostModal;