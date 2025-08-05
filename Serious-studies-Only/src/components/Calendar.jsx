import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import StarryNightBackground from './StarryNightBackground'; // Import the background

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
        
        // Optimistically update the local state to provide immediate feedback
        const dayEvents = events[viewedDate] || [];
        const newEventsList = eventToEdit 
            ? dayEvents.map(e => e.id === eventToEdit.id ? { id: eventToEdit.id, ...eventData } : e)
            : [...dayEvents, { id: `temp-${Date.now()}`, ...eventData }];
        setEventsForViewedDate(newEventsList);

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

    const doodleSVG = {
        anniversary: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="#fef08a"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`,
        birthday: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="#fca5a5"><path d="M22 11c0 1.66-1.34 3-3 3h-2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4H3c-1.66 0-3-1.34-3-3V9c0-.95.53-1.79 1.3-2.25L12 2l10.7 4.75c.77.46 1.3 1.3 1.3 2.25v2zM7 11h10v-1l-5-2.22L7 10v1z"></path></svg>`,
        'date-night': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="#a5b4fc"><path d="M12 2l2.35 7.18h7.55l-6.1 4.44 2.35 7.18-6.1-4.44-6.1 4.44 2.35-7.18-6.1-4.44h7.55L12 2z"></path></svg>`,
        home: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="#86efac"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"></path></svg>`
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
            const borderClass = isToday ? 'border-yellow-400' : 'border-white/10';
            const eventIcon = dayEvents.length > 0 && dayEvents[0].type && doodleSVG[dayEvents[0].type] 
                ? <div className="absolute w-3/4 h-3/4 opacity-80" dangerouslySetInnerHTML={{ __html: doodleSVG[dayEvents[0].type] }} />
                : null;

            grid.push(
                <div key={day} onClick={() => handleDayClick(day)} className={`relative aspect-square border-2 border-dashed rounded-full flex items-center justify-center font-comfortaa text-lg cursor-pointer transition-all hover:bg-white/10 active:scale-125 text-gray-200 ${borderClass}`}>
                    {day}
                    {eventIcon}
                </div>
            );
        }
        return grid;
    };
    
    return (
        <div className="app-screen bg-[#0a0c27] p-4 flex flex-col items-center overflow-y-auto">
            <StarryNightBackground />
            <div className="relative z-10 w-full max-w-2xl">
                <div className="bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6 text-white">
                        <button className="text-5xl" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))}>‹</button>
                        <h1 className="font-header text-5xl md:text-6xl text-center">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h1>
                        <button className="text-5xl" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))}>›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center font-doodle text-gray-400">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2 mt-2">{renderCalendarGrid()}</div>
                </div>
                
                {eventsForViewedDate.length > 0 && (
                    <div className="w-full mt-4 bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-lg flex flex-col">
                        <h2 className="font-header text-4xl mb-4 text-white">{new Date(viewedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
                        <div className="flex-grow space-y-4 overflow-y-auto">
                            {eventsForViewedDate.map(event => (
                                <div key={event.id} className="bg-black/20 p-3 rounded-lg">
                                    <h3 className="font-doodle text-xl font-bold text-gray-200">{event.title}</h3>
                                    <p className="font-doodle text-md mt-1 text-gray-300">{event.description}</p>
                                    <div className="mt-2 flex gap-2">
                                        <button onClick={() => openModalToEdit(event)} className="font-header text-lg bg-white/10 px-3 py-0 rounded-full text-xs text-gray-300 hover:bg-white/20">Edit</button>
                                        <button onClick={() => addEventToTasks(event)} className="font-header text-lg bg-white/10 px-3 py-0 rounded-full text-xs text-gray-300 hover:bg-white/20">Add to Tasks</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => openModalForNewEvent(viewedDate)} className="font-header text-2xl mt-4 bg-white/10 px-4 py-1 rounded-full w-full text-white hover:bg-white/20">
                            + Add Another Event
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-sm text-white">
                        <h2 className="font-header text-5xl text-center mb-6 text-white">
                            {eventToEdit ? 'Edit Memory' : 'Add a Memory'}
                        </h2>
                        <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="What's the occasion?" className="w-full p-3 bg-transparent border-b-2 border-dashed border-white/30 font-doodle text-2xl focus:outline-none focus:border-yellow-400 mb-4"/>
                        <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="Add some details..." className="w-full p-3 bg-transparent border-b-2 border-dashed border-white/30 font-doodle text-xl focus:outline-none focus:border-yellow-400 mb-6" rows="3"></textarea>
                        <div className="flex justify-around mb-8">
                            {Object.keys(doodleSVG).map(type => (
                                <button key={type} onClick={() => setEventType(type)} className={`w-12 h-12 p-2 rounded-full transition-all ${eventType === type ? 'bg-white/20 scale-110' : 'bg-white/10'}`} dangerouslySetInnerHTML={{ __html: doodleSVG[type] }} />
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            {eventToEdit && <button onClick={() => handleDeleteEvent(eventToEdit.id)} className="font-header text-2xl text-red-400 hover:text-red-300">Delete</button>}
                            <div className="ml-auto">
                                <button onClick={() => setIsModalOpen(false)} className="font-header text-3xl px-6 py-1 rounded-full text-gray-300 hover:text-white">Cancel</button>
                                <button onClick={handleSaveEvent} className="font-header text-3xl px-6 py-1 rounded-full text-gray-800 bg-yellow-400 hover:bg-yellow-300">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;