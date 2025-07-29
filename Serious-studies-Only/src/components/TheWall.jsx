import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';
import AddPostModal from './AddPostModal';

const TheWall = ({ coupleId, userId, googleDriveManager }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!coupleId) return;
        
        setIsLoading(true);
        const postsCol = db.collection('couples').doc(coupleId).collection('posts');
        const q = postsCol.orderBy('createdAt', 'desc');

        const unsubscribe = q.onSnapshot(snapshot => {
            const fetchedPosts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    imageUrl: googleDriveManager.getPublicViewUrl(data.fileId),
                    date: data.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                };
            });
            setPosts(fetchedPosts);
            setIsLoading(false);
        }, error => {
            console.error("Error fetching posts: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [coupleId, googleDriveManager]);

    const handleLike = async (postId, likedBy) => {
        const postRef = db.collection('couples').doc(coupleId).collection('posts').doc(postId);
        const alreadyLiked = likedBy.includes(userId);

        await postRef.update({
            likedBy: alreadyLiked 
                ? firebase.firestore.FieldValue.arrayRemove(userId) 
                : firebase.firestore.FieldValue.arrayUnion(userId),
            likes: firebase.firestore.FieldValue.increment(alreadyLiked ? -1 : 1)
        });
    };
    
    const handleDelete = async (postId) => {
        if (window.confirm("Are you sure you want to delete this memory?")) {
            await db.collection('couples').doc(coupleId).collection('posts').doc(postId).delete();
        }
    };

    return (
        <div className="app-screen p-4 bg-[#D2B48C]" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cork-wallet.png')"}}>
            <h1 className="font-header text-5xl text-center mb-8 text-white" style={{textShadow: '2px 2px 4px #444444'}}>Our Wall</h1>
            
            {isLoading && <p className="text-center text-white font-doodle">Loading memories...</p>}
            
            {!isLoading && posts.length === 0 && (
                <div className="text-center text-white p-10 bg-black/20 rounded-lg">
                    <p className="font-header text-4xl">Your Wall is Empty</p>
                    <p className="font-doodle mt-2">Click the "+" button to add your first memory!</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map(post => (
                    <div key={post.id} className="relative group">
                        <div className="bg-white p-4 pb-16 shadow-lg transition-transform duration-300 ease-in-out hover:!rotate-0 hover:scale-105 hover:z-10" style={{ transform: `rotate(${Math.random() * 8 - 4}deg)` }}>
                            {post.userId === userId && (
                                <button onClick={() => handleDelete(post.id)} className="absolute top-2 right-2 text-xl text-gray-400 hover:text-red-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    &times;
                                </button>
                            )}
                            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#F4A599] rounded-full border-2 border-[#444] shadow-md"/>
                            <img src={post.imageUrl} alt={post.caption} className="w-full h-auto object-cover aspect-square bg-gray-200" />
                            <div className="absolute bottom-4 left-4 right-4 text-center">
                                <p className="font-handwriting text-2xl text-gray-700">{post.caption}</p>
                                <p className="font-doodle text-sm text-gray-500 mt-1">{post.date}</p>
                            </div>
                            <button onClick={() => handleLike(post.id, post.likedBy)} className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className={`text-xl transition-colors ${post.likedBy.includes(userId) ? 'text-red-500' : 'text-[#F4A599]'}`}>♥</span>
                                <span className="font-doodle text-sm">{post.likes}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-6 bg-[#F4A599] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center font-header text-5xl z-50 transition-transform hover:scale-110">
                +
            </button>
            <AddPostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} coupleId={coupleId} userId={userId} />
        </div>
    );
};

export default TheWall;