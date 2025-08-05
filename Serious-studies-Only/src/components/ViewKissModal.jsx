import React from 'react';

const kissTypes = {
    "Good Morning": "☀️",
    "Good Night": "🌙",
    "Miss You": "🥰",
    "Thank You": "🙏",
    "I'm Sorry": "😔",
    "Just Because": "✨"
};

const ViewKissModal = ({ kiss, onClose }) => {
    if (!kiss) return null;

    const time = kiss.createdAt?.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) || '...';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[101]" onClick={onClose}>
            <div className="bg-gray-800/50 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl w-full max-w-xs text-center text-white transform transition-all">
                
                <span className="text-6xl" style={{filter: 'drop-shadow(0 0 10px #fef08a)'}}>
                    {kissTypes[kiss.type] || '✨'}
                </span>
                
                <h3 className="font-doodle text-2xl font-bold mt-2 text-gray-100">{kiss.type}</h3>
                
                {kiss.note && (
                    <p className="font-handwriting text-3xl my-4 text-gray-200 p-2 border-t border-b border-dashed border-white/20">
                        "{kiss.note}"
                    </p>
                )}

                <p className="font-doodle text-sm text-gray-400 mt-4">
                    Sent at {time}
                </p>
            </div>
        </div>
    );
};

export default ViewKissModal;