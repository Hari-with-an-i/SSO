import React, { useState } from 'react';
import { auth } from '../firebase';
import StarryNightBackground from './StarryNightBackground';
import WelcomeModal from './WelcomeModal'; // Import the new modal

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                // This is the sign-up logic
                await auth.createUserWithEmailAndPassword(email, password);
                // If sign-up is successful, trigger the welcome modal
                setShowWelcomeModal(true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="app-screen relative bg-[#0a0c27] flex justify-center items-center p-4">
            <StarryNightBackground />
            <div className="relative z-10 w-full max-w-sm bg-black/20 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-xl text-center text-white">
                <h1 className="font-header text-6xl mb-2">Serious Studies Only</h1>
                <p className="font-doodle mb-6 text-gray-300">Your private scrapbook</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full p-3 rounded-lg border-2 border-white/20 bg-black/20 focus:border-yellow-400 focus:ring-0 font-doodle text-lg placeholder:text-gray-400" 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full p-3 rounded-lg border-2 border-white/20 bg-black/20 focus:border-yellow-400 focus:ring-0 font-doodle text-lg placeholder:text-gray-400" 
                    />
                    <button type="submit" className="w-full bg-yellow-400 text-gray-800 font-header text-3xl p-2 rounded-lg hover:bg-yellow-300 transition-colors">
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>
                {error && <p className="text-red-400 mt-4 text-sm font-doodle">{error}</p>}
                <button onClick={() => setIsLogin(!isLogin)} className="mt-6 font-doodle text-gray-300 hover:text-white hover:underline">
                    {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
                </button>
            </div>

            <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />
        </div>
    );
};

export default AuthScreen;