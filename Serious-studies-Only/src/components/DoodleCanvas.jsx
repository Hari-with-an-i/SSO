import React, { useState, useEffect, useRef, useCallback } from 'react';

const DoodleCanvas = ({ isActive, onClose }) => {
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#444444');
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
        }
        return [e.clientX - rect.left, e.clientY - rect.top];
    }

    const startDrawing = useCallback((e) => {
        e.preventDefault();
        isDrawing.current = true;
        const [x, y] = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastPos.current = { x, y };
    }, []);

    const draw = useCallback((e) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const [x, y] = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPos.current = { x, y };
    }, []);

    const stopDrawing = useCallback(() => { isDrawing.current = false; }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isActive) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = color;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDrawing);
        };
    }, [isActive, color, startDrawing, draw, stopDrawing]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (!isActive) return null;

    return (
        <React.Fragment>
            <canvas ref={canvasRef} className="fixed top-0 left-0 w-screen h-screen z-[100] cursor-crosshair" />
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-full p-2 flex gap-2 items-center shadow-lg z-[101] border-2 border-gray-700">
                {['#444444', '#F4A599', '#A8BFCE', '#9CAF88'].map(c => (
                    <div key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
                <button onClick={clearCanvas} className="font-doodle text-2xl">🗑️</button>
                <button onClick={onClose} className="font-doodle text-2xl">✅</button>
            </div>
        </React.Fragment>
    );
};

export default DoodleCanvas;