import React from 'react';

const kissTypes = {
    "Good Morning": "☀️",
    "Good Night": "🌙",
    "Miss You": "🥰",
    "Thank You": "🙏",
    "I'm Sorry": "😔",
    "Just Because": "❤️"
};

const ViewKissModal = ({ kiss, onClose }) => {
    if (!kiss) return null;

    const time = kiss.createdAt?.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) || '...';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[101]" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs text-center transform transition-all"
                 style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/light-paper-fibers.png')"}}>
                
                <span className="text-6xl">{kissTypes[kiss.type] || '❤️'}</span>
                
                <h3 className="font-doodle text-2xl font-bold mt-2 text-gray-800">{kiss.type}</h3>
                
                {kiss.note && (
                    <p className="font-handwriting text-3xl my-4 text-gray-700 p-2 border-t border-b border-dashed border-gray-300">
                        "{kiss.note}"
                    </p>
                )}

                <p className="font-doodle text-sm text-gray-500 mt-4">
                    Sent at {time}
                </p>
            </div>
        </div>
    );
};

export default ViewKissModal;