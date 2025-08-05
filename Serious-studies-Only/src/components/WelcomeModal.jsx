import React from 'react';

const WelcomeModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="relative bg-gray-800/50 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-sm text-white text-center">
                {/* Decorative elements */}
                <span className="absolute top-4 left-4 text-3xl animate-pulse">✨</span>
                <span className="absolute top-8 right-8 text-2xl animate-pulse" style={{animationDelay: '0.2s'}}>🎂</span>
                <span className="absolute bottom-4 right-4 text-3xl animate-pulse" style={{animationDelay: '0.4s'}}>🎉</span>
                <span className="absolute bottom-8 left-8 text-2xl animate-pulse" style={{animationDelay: '0.6s'}}>💖</span>

                <h1 className="font-header text-5xl text-yellow-300" style={{textShadow: '0 0 10px #fef08a'}}>
                    Happy Birthday Gowri!!
                </h1>
                
                <p className="font-doodle text-xl text-gray-300 mt-4 mb-8">
                    A small space for us to call our own and have all the time to ourselves. 
                </p>
                
                <button 
                    onClick={onClose}
                    className="w-full bg-yellow-400 text-gray-800 font-header text-3xl p-3 rounded-lg hover:bg-yellow-300 transition-colors"
                >
                    Let's Get Started
                </button>
            </div>
        </div>
    );
};

export default WelcomeModal;