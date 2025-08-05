import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const Calendar = ({ coupleId, userId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewedDate, setViewedDate] = useState(null);
    const [eventsForViewedDate, setEventsForViewedDate] = useState([]);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventType, setEventType] = useState('anniversary');

    useEffect(() => {
        if (!coupleId) return;
        const eventsCol = db.collection('couples').doc(coupleId).collection('events');
        const unsubscribe = eventsCol.orderBy('createdAt', 'asc').onSnapshot((snapshot) => {
            const newEvents = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!newEvents[data.date]) {
                    newEvents[data.date] = [];
                }
                newEvents[data.date].push({ id: doc.id, ...data });
            });
            setEvents(newEvents);
        });
        return () => unsubscribe();
    }, [coupleId]);
    
    const addEventToTasks = async (event) => {
        if (!coupleId || !event) return;
        
        const taskDocRef = db.collection('couples').doc(coupleId).collection('dailyTasks').doc(event.date);
        const task = { id: Date.now(), text: event.title, done: false };
        
        try {
            await db.runTransaction(async (transaction) => {
                const taskDoc = await transaction.get(taskDocRef);
                if (!taskDoc.exists) {
                    transaction.set(taskDocRef, {
                        date: event.date,
                        sharedTasks: [task],
                        userTasks: { [userId]: [] },
                    });
                } else {
                    transaction.update(taskDocRef, {
                        sharedTasks: firebase.firestore.FieldValue.arrayUnion(task)
                    });
                }
            });
            alert(`"${event.title}" was added to your tasks for that day!`);
        } catch (error) {
            console.error("Error adding event to tasks: ", error);
            alert("Failed to add event to tasks.");
        }
    };
    
    const handleDayClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events[dateStr] || [];
        
        setViewedDate(dateStr);
        setEventsForViewedDate(dayEvents);
        
        if (dayEvents.length === 0) {
            openModalForNewEvent(dateStr);
        }
    };

    const openModalForNewEvent = (date) => {
        setEventToEdit(null);
        setEventTitle('');
        setEventDescription('');
        setEventType('anniversary');
        setViewedDate(date);
        setIsModalOpen(true);
    };

    const openModalToEdit = (event) => {
        setEventToEdit(event);
        setEventTitle(event.title);
        setEventDescription(event.description);
        setEventType(event.type);
        setViewedDate(event.date);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!eventTitle.trim() || !viewedDate) return;
        const eventsCol = db.collection('couples').doc(coupleId).collection('events');
        
        const eventData = { 
            date: viewedDate, 
            title: eventTitle, 
            description: eventDescription, 
            type: eventType,
        };

        if (eventToEdit) {
            await eventsCol.doc(eventToEdit.id).set(eventData, { merge: true });
        } else {
            await eventsCol.add({ ...eventData, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
        
        const updatedEvents = await eventsCol.where('date', '==', viewedDate).get();
        setEventsForViewedDate(updatedEvents.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        setIsModalOpen(false);
        setEventToEdit(null);
    };
    
    const handleDeleteEvent = async (eventId) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            await db.collection('couples').doc(coupleId).collection('events').doc(eventId).delete();
            setEventsForViewedDate(prevEvents => prevEvents.filter(event => event.id !== eventId));
            setIsModalOpen(false);
            setEventToEdit(null);
        }
    };

    const getSeason = (month) => {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    };
    const season = getSeason(currentDate.getMonth());
    const seasonalThemes = {
        spring: { bg: '#9CAF88', text: '#6A7F62', accent: '#F4A599' },
        summer: { bg: '#FAF7F0', text: '#E5874A', accent: '#FFD700' },
        fall: { bg: '#D3B89E', text: '#8B4513', accent: '#F4A599' },
        winter: { bg: '#A8BFCE', text: '#465A65', accent: '#FFFFFF' }
    };
    const theme = seasonalThemes[season];
    const doodleSVG = {
        anniversary: `<svg viewBox="0 0 24 24" class="w-full h-full" style="fill: #F4A599;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`,
        birthday: `<svg viewBox="0 0 24 24" class="w-full h-full" style="fill: #A8BFCE;"><path d="M22 11c0 1.66-1.34 3-3 3h-2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4H3c-1.66 0-3-1.34-3-3V9c0-.95.53-1.79 1.3-2.25L12 2l10.7 4.75c.77.46 1.3 1.3 1.3 2.25v2zM7 11h10v-1l-5-2.22L7 10v1z"></path></svg>`,
        'date-night': `<svg viewBox="0 0 24 24" class="w-full h-full" style="fill: #FFC0CB;"><path d="M12 2l2.35 7.18h7.55l-6.1 4.44 2.35 7.18-6.1-4.44-6.1 4.44 2.35-7.18-6.1-4.44h7.55L12 2z"></path></svg>`,
        home: `<svg viewBox="0 0 24 24" class="w-full h-full" style="fill: #9CAF88;"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"></path></svg>`
    };
    
    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = [];
        for (let i = 0; i < firstDayOfMonth; i++) grid.push(<div key={`empty-${i}`} className="day-cell other-month"></div>);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events[dateStr] || [];
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const borderClass = isToday || dayEvents.length > 0 ? 'border-solid border-gray-500' : 'border-gray-200';
            grid.push(
                <div key={day} onClick={() => handleDayClick(day)} className={`relative aspect-square border-2 border-dashed rounded-full flex items-center justify-center font-comfortaa text-lg cursor-pointer transition-all active:scale-125 text-gray-700 ${borderClass}`}>
                    {day}
                    {dayEvents.length > 0 && <div className="absolute w-3/4 h-3/4 opacity-80" dangerouslySetInnerHTML={{ __html: doodleSVG[dayEvents[0].type] }} />}
                </div>
            );
        }
        return grid;
    };
    
    return (
        <div className="app-screen p-4 flex flex-col" style={{ backgroundColor: theme.bg }}>
            <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg" style={{maskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\"><defs><filter id=\"filter\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.02\" numOctaves=\"5\" seed=\"10\" /><feDisplacementMap in=\"SourceGraphic\" scale=\"15\" /></filter></defs><rect width=\"100%\" height=\"100%\" filter=\"url(%23filter)\" /></svg>')"}}>
                <div className="flex justify-between items-center mb-6 text-gray-800">
                    <span className="text-5xl cursor-pointer" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))}>‹</span>
                    <h1 className="font-header text-6xl">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h1>
                    <span className="text-5xl cursor-pointer" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))}>›</span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center font-doodle text-gray-600">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">{renderCalendarGrid()}</div>
            </div>
            
            {eventsForViewedDate.length > 0 && (
                <div className="w-full max-w-2xl mx-auto mt-4 bg-white/50 p-6 rounded-lg shadow-lg backdrop-blur-sm flex flex-col">
                    <h2 className="font-header text-4xl mb-4 text-gray-800">{new Date(viewedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
                    <div className="flex-grow space-y-4 overflow-y-auto">
                        {eventsForViewedDate.map(event => (
                            <div key={event.id} className="bg-white/50 p-3 rounded-lg">
                                <h3 className="font-doodle text-xl font-bold text-gray-800">{event.title}</h3>
                                <p className="font-doodle text-md mt-1 text-gray-700">{event.description}</p>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => openModalToEdit(event)} className="font-header text-lg bg-white px-3 py-0 rounded-full text-xs text-gray-700">Edit</button>
                                    <button onClick={() => addEventToTasks(event)} className="font-header text-lg bg-white px-3 py-0 rounded-full text-xs text-gray-700">Add to Tasks</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => openModalForNewEvent(viewedDate)} className="font-header text-2xl mt-4 bg-white px-4 py-1 rounded-full w-full text-gray-800">
                        + Add Another Event
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/lined-paper.png')"}}>
                        <h2 className="font-header text-5xl text-center mb-4" style={{color: theme.text}}>
                            {eventToEdit ? 'Edit Memory' : 'Add a Memory'}
                        </h2>
                        <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="What's the occasion?" className="w-full p-3 bg-transparent border-b-2 border-dashed border-gray-400 font-doodle text-2xl focus:outline-none mb-4"/>
                        <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="Add some details..." className="w-full p-3 bg-transparent border-b-2 border-dashed border-gray-400 font-doodle text-xl focus:outline-none mb-6" rows="3"></textarea>
                        <div className="flex justify-around mb-8">
                            {Object.keys(doodleSVG).map(type => (
                                <button key={type} onClick={() => setEventType(type)} className={`w-12 h-12 p-2 rounded-full transition-all ${eventType === type ? 'bg-gray-300 scale-110' : 'bg-gray-100'}`} dangerouslySetInnerHTML={{ __html: doodleSVG[type] }} />
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            {eventToEdit && <button onClick={() => handleDeleteEvent(eventToEdit.id)} className="font-header text-2xl text-red-500">Delete</button>}
                            <div className="ml-auto">
                                <button onClick={() => setIsModalOpen(false)} className="font-header text-3xl px-6 py-1 rounded-full">Cancel</button>
                                <button onClick={handleSaveEvent} className="font-header text-3xl px-6 py-1 rounded-full text-white" style={{backgroundColor: theme.text}}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;