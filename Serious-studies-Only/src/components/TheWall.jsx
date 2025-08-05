import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import googleDriveManager from '../googleDriveManager';
import AddPostModal from './AddPostModal';
import PhotoModal from './PhotoModal';
import VideoModal from './VideoModal';
import StarryNightBackground from './StarryNightBackground';

// This sub-component handles its own loading state and interactions.
const PostCard = ({ post, userId, onPostClick, onDelete, onLike }) => {
    const [isReady, setIsReady] = useState(post.type === 'note');
    const isOwner = post.userId === userId;

    const LikeButton = () => (
        <button onClick={(e) => { e.stopPropagation(); onLike(post.id, post.likedBy); }} className="flex items-center space-x-1 text-gray-400 hover:text-yellow-300">
            <span className={`text-xl transition-colors ${post.likedBy.includes(userId) ? 'text-yellow-400' : 'text-gray-500'}`}>♥</span>
            <span className="font-doodle text-sm">{post.likes}</span>
        </button>
    );

    const commonWrapperStyle = { transform: `rotate(${Math.random() * 6 - 3}deg)` };

    // Common style for all cards
    const cardBaseStyle = "aspect-square flex flex-col shadow-lg relative group bg-white/5 backdrop-blur-md border border-white/20 rounded-lg p-3";

    if (post.type === 'note') {
        const getNoteFontSizeClass = (textLength) => {
            if (textLength < 25) return 'text-4xl';
            if (textLength < 75) return 'text-3xl';
            if (textLength < 150) return 'text-2xl';
            return 'text-xl';
        };
        const fontSizeClass = getNoteFontSizeClass(post.content.length);

        return (
            <div style={commonWrapperStyle}>
                <div className={cardBaseStyle}>
                    {isOwner && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="absolute top-2 right-2 text-xl text-gray-400 hover:text-red-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    )}
                    <div className="flex-grow flex justify-center items-center overflow-hidden">
                        <p className={`font-handwriting text-gray-200 break-words text-center ${fontSizeClass}`}>{post.content}</p>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <p className="font-doodle text-sm text-gray-400">{post.date}</p>
                        <LikeButton />
                    </div>
                </div>
            </div>
        );
    }
    
    // Media Post (Photo or Video)
    return (
        <div style={commonWrapperStyle} onClick={isReady ? () => onPostClick(post) : undefined} className={isReady ? "cursor-pointer" : "cursor-wait"}>
            <div className={cardBaseStyle}>
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-5 h-5 bg-yellow-400 rounded-full shadow-md z-10"/>
                {isOwner && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="absolute top-2 right-2 text-xl text-gray-400 hover:text-red-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                )}
                <div className="relative flex-grow w-full bg-black/20 rounded-sm">
                    <img 
                        src={post.imageUrl} 
                        alt={post.content} 
                        referrerPolicy="no-referrer" 
                        className={`w-full h-full object-cover transition-opacity duration-300 rounded-sm ${isReady ? 'opacity-100' : 'opacity-0'}`} 
                        onLoad={() => setIsReady(true)}
                    />
                    {!isReady && (
                        <div className="absolute inset-0 flex justify-center items-center">
                           <p className="font-doodle text-sm text-gray-400">Processing...</p>
                        </div>
                    )}
                    {isReady && post.type === 'video' && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center pointer-events-none">
                            <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 0111 8v4a1 1 0 01-1.445.894l-3-2a1 1 0 010-1.788l3-2z"></path></svg>
                        </div>
                    )}
                </div>
                <div className="pt-2 flex flex-col justify-between flex-shrink-0">
                    <p className="font-handwriting text-2xl text-gray-200 break-words truncate">{post.content}</p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="font-doodle text-sm text-gray-400">{post.date}</p>
                        <LikeButton />
                    </div>
                </div>
            </div>
        </div>
    );
};


const TheWall = ({ coupleId, userId, googleDriveManager }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

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
                    imageUrl: data.fileId ? googleDriveManager.getPublicViewUrl(data.fileId) : null,
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
        <div className="app-screen relative bg-[#0a0c27]">
            <StarryNightBackground />
            <div className="relative z-10 p-4 h-full overflow-y-auto">
                <h1 className="font-header text-6xl text-center mb-8 text-white" style={{textShadow: '0 0 10px rgba(255,250,205,0.5)'}}>Our Wall</h1>
                
                {isLoading && <p className="text-center text-white font-doodle">Loading memories...</p>}
                
                {!isLoading && posts.length === 0 && (
                    <div className="text-center text-white p-10 bg-white/5 rounded-lg backdrop-blur-sm">
                        <p className="font-header text-4xl">Your Wall is Empty</p>
                        <p className="font-doodle mt-2">Click the "+" button to add your first memory!</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                    {posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post}
                            userId={userId}
                            onPostClick={setSelectedPost}
                            onDelete={handleDelete}
                            onLike={handleLike}
                        />
                    ))}
                </div>

                <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-6 right-6 bg-yellow-400 text-gray-800 w-16 h-16 rounded-full shadow-lg flex items-center justify-center font-header text-5xl z-50 transition-transform hover:scale-110">
                    +
                </button>
                <AddPostModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} coupleId={coupleId} userId={userId} />
                
                {selectedPost && selectedPost.type === 'photo' && (
                    <PhotoModal post={selectedPost} onClose={() => setSelectedPost(null)} />
                )}
                {selectedPost && selectedPost.type === 'video' && (
                    <VideoModal 
                        post={selectedPost} 
                        onClose={() => setSelectedPost(null)}
                        googleDriveManager={googleDriveManager} 
                    />
                )}
            </div>
        </div>
    );
};

export default TheWall;