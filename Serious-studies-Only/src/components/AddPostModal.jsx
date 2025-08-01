import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';

const AddPostModal = ({ isOpen, onClose, coupleId, userId }) => {
    const [postType, setPostType] = useState('photo'); // 'photo', 'video', 'note'
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setMediaFile(file);
        }
    };
    
    const handleSubmit = async () => {
        if (postType === 'note' && !content.trim()) {
            alert("Please write something for your note.");
            return;
        }
        if ((postType === 'photo' || postType === 'video') && (!mediaFile || !content.trim())) {
            alert(`Please select a ${postType} and write a caption.`);
            return;
        }
        if ((postType === 'photo' || postType === 'video') && !googleDriveManager.accessToken) {
            alert("Please connect to Google Drive in the Settings tab first!");
            return;
        }

        setIsUploading(true);
        try {
            let fileId = null;
            if (mediaFile && (postType === 'photo' || postType === 'video')) {
                fileId = await googleDriveManager.uploadFile(mediaFile, 'photos'); 
            }
            
            if (fileId || postType === 'note') {
                const postsCol = db.collection('couples').doc(coupleId).collection('posts');
                await postsCol.add({
                    userId,
                    type: postType,
                    fileId: fileId,
                    content,
                    likes: 0,
                    likedBy: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                handleClose();
            } else {
                throw new Error("File upload failed or did not return a fileId.");
            }
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post. Check the console for details.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setContent('');
        setMediaFile(null);
        setPostType('photo');
        if(fileInputRef.current) fileInputRef.current.value = "";
        onClose();
    };

    if (!isOpen) return null;

    const typeButtonClass = (type) => 
        `font-header text-3xl px-6 py-1 rounded-full transition-colors ${postType === type ? 'bg-[#9CAF88] text-white' : 'bg-gray-200'}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/lined-paper.png')"}}>
                <h2 className="font-header text-5xl text-center mb-4 text-gray-700">Add a Memory</h2>

                <div className="flex justify-center gap-2 mb-4">
                    <button onClick={() => setPostType('photo')} className={typeButtonClass('photo')}>Photo</button>
                    <button onClick={() => setPostType('video')} className={typeButtonClass('video')}>Video</button>
                    <button onClick={() => setPostType('note')} className={typeButtonClass('note')}>Note</button>
                </div>
                
                {(postType === 'photo' || postType === 'video') && (
                    <button onClick={() => fileInputRef.current.click()} className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-500 font-doodle text-xl mb-4">
                        {mediaFile ? mediaFile.name : `Click to select a ${postType}`}
                    </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={postType === 'photo' ? "image/*" : "video/*"} className="hidden" />

                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={postType === 'note' ? "Write your note..." : "Write a caption..."}
                    className="w-full p-3 bg-transparent border-b-2 border-dashed border-gray-400 font-doodle text-2xl focus:outline-none mb-6"
                    rows={postType === 'note' ? 5 : 2}
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