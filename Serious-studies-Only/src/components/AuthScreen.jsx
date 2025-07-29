import React, { useState } from 'react';
import { auth } from '../firebase';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                await auth.createUserWithEmailAndPassword(email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="app-screen bg-[#9CAF88] flex justify-center items-center p-4">
            <div className="w-full max-w-sm bg-[#FAF7F0] p-8 rounded-2xl shadow-2xl text-center">
                <h1 className="font-header text-6xl mb-2">Serious Studies</h1>
                <p className="font-doodle mb-6">Your private scrapbook</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-[#F4A599] focus:ring-0 font-doodle" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-[#F4A599] focus:ring-0 font-doodle" />
                    <button type="submit" className="w-full bg-[#F4A599] text-white font-header text-3xl p-2 rounded-lg hover:bg-opacity-90 transition-colors">
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>
                {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
                <button onClick={() => setIsLogin(!isLogin)} className="mt-6 font-doodle text-gray-600 hover:underline">
                    {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
                </button>
            </div>
        </div>
    );
};

export default AuthScreen;