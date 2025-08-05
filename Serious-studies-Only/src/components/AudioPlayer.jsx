import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ src, googleDriveManager, isSender }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioSrc, setAudioSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!src || !googleDriveManager?.accessToken) return;

        let isMounted = true;
        let objectUrl = null;

        const fetchAudio = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${src}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${googleDriveManager.accessToken}` }
                });
                if (!response.ok) throw new Error('Failed to fetch audio file.');

                const audioBlob = await response.blob();
                if (isMounted) {
                    objectUrl = URL.createObjectURL(audioBlob);
                    setAudioSrc(objectUrl);
                }
            } catch (error) {
                console.error("Error fetching audio:", error);
            } finally {
                if(isMounted) setIsLoading(false);
            }
        };

        fetchAudio();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, googleDriveManager]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnded);
        };
    }, [audioSrc]);

    const togglePlayPause = () => {
        if (isLoading || !audioRef.current) return;
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    
    if (isLoading) {
        return <div className="w-full max-w-[250px] p-2 font-doodle text-gray-300">Loading audio...</div>;
    }

    return (
        <div className={`w-full max-w-[250px] flex items-center gap-2 p-2 rounded-full ${isSender ? 'bg-black/20' : 'bg-white/20'}`}>
            <audio ref={audioRef} src={audioSrc} preload="metadata"></audio>
            <button onClick={togglePlayPause} className="text-white flex-shrink-0">
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 110-16 8 8 0 010 16zM9.555 7.168A1 1 0 0111 8v4a1 1 0 01-1.445.894l-3-2a1 1 0 010-1.788l3-2z" clipRule="evenodd" /></svg>
                )}
            </button>
            <div className="flex-grow h-10 flex items-center gap-1">
                {[...Array(25)].map((_, i) => (
                    <div key={i} className="w-1 bg-gray-400/50 rounded-full" style={{ height: `${Math.random() * 70 + 30}%` }}></div>
                ))}
            </div>
            <span className="font-doodle text-base text-gray-300 w-12 text-right">{formatTime(duration)}</span>
        </div>
    );
};

export default AudioPlayer;