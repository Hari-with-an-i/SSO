import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import StarryNightBackground from './StarryNightBackground';

const DailyTasks = ({ coupleId, userId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [taskPage, setTaskPage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [completedTasks, setCompletedTasks] = useState([]);

    const getDateString = (date) => date.toISOString().split('T')[0];
    const currentDateString = getDateString(currentDate);

    useEffect(() => {
        if (!coupleId) return;
        setIsLoading(true);

        const taskDocRef = db.collection('couples').doc(coupleId).collection('dailyTasks').doc(currentDateString);
        
        const unsubscribe = taskDocRef.onSnapshot(async (docSnap) => {
            if (docSnap.exists) {
                setTaskPage({ id: docSnap.id, ...docSnap.data() });
            } else {
                const yesterday = new Date(currentDate);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayDateString = getDateString(yesterday);
                
                const yesterdayDoc = await db.collection('couples').doc(coupleId).collection('dailyTasks').doc(yesterdayDateString).get();
                
                let carriedOverShared = [];
                let carriedOverUser = { [userId]: [] };

                if (yesterdayDoc.exists) {
                    const yesterdayData = yesterdayDoc.data();
                    carriedOverShared = yesterdayData.sharedTasks.filter(t => !t.done);
                    Object.keys(yesterdayData.userTasks).forEach(uid => {
                        carriedOverUser[uid] = yesterdayData.userTasks[uid].filter(t => !t.done);
                    });
                }
                
                const newPage = {
                    date: currentDateString,
                    sharedTasks: carriedOverShared,
                    userTasks: carriedOverUser,
                };
                await taskDocRef.set(newPage);
                setTaskPage({ id: currentDateString, ...newPage });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [coupleId, userId, currentDateString]);

    const updateTasksInDb = async (updatedData) => {
        const taskDocRef = db.collection('couples').doc(coupleId).collection('dailyTasks').doc(currentDateString);
        await taskDocRef.update(updatedData);
    };

    const handleAddTask = (listType, text) => {
        if (!taskPage || !text.trim()) return;
        const newTask = { id: Date.now(), text, done: false };
        let updatedData;
        if (listType === 'shared') {
            updatedData = { sharedTasks: [...taskPage.sharedTasks, newTask] };
        } else {
            const myCurrentTasks = taskPage.userTasks[userId] || [];
            updatedData = { userTasks: { ...taskPage.userTasks, [userId]: [...myCurrentTasks, newTask] } };
        }
        updateTasksInDb(updatedData);
    };
    
    const handleToggleTask = (listType, taskId) => {
        if (!taskPage) return;
        let updatedData;
        if (listType === 'shared') {
            updatedData = { sharedTasks: taskPage.sharedTasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) };
        } else {
            const myTasks = (taskPage.userTasks[userId] || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t);
            updatedData = { userTasks: { ...taskPage.userTasks, [userId]: myTasks } };
        }
        updateTasksInDb(updatedData);
    };

    const handleTearOff = async () => {
        if (window.confirm("This will archive the current set of tasks and give you a fresh page for today. Continue?")) {
            const historyCol = db.collection('couples').doc(coupleId).collection('taskHistory');
            
            await historyCol.add({
                date: taskPage.date,
                sharedTasks: taskPage.sharedTasks,
                userTasks: taskPage.userTasks,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const resetUserTasks = {};
            if (taskPage.userTasks) {
                Object.keys(taskPage.userTasks).forEach(uid => {
                    resetUserTasks[uid] = [];
                });
            }
            await updateTasksInDb({
                sharedTasks: [],
                userTasks: resetUserTasks
            });
        }
    };
    
    const showHistory = async () => {
        try {
            const historyQuery = db.collection('couples').doc(coupleId).collection('taskHistory')
                .orderBy('completedAt', 'desc');
            
            const snapshot = await historyQuery.get();
            setCompletedTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsHistoryVisible(true);
        } catch (error) {
            console.error("History query failed:", error);
            alert("Could not load history.");
        }
    };

    const handleRestoreTask = async (task, listType, ownerId) => {
        if (window.confirm(`Restore "${task.text}" to today's tasks?`)) {
            const restoredTask = { id: Date.now(), text: task.text, done: false };
            const todayDocRef = db.collection('couples').doc(coupleId).collection('dailyTasks').doc(currentDateString);

            if (listType === 'shared') {
                await todayDocRef.update({ sharedTasks: firebase.firestore.FieldValue.arrayUnion(restoredTask) });
            } else {
                await todayDocRef.update({ [`userTasks.${ownerId}`]: firebase.firestore.FieldValue.arrayUnion(restoredTask) });
            }
            alert("Task restored!");
        }
    };

    const changeDay = (amount) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + amount);
        setCurrentDate(newDate);
    };

    const TaskList = ({ tasks = [], onToggle, onAdd, listType }) => {
        const [showInput, setShowInput] = useState(false);
        const [inputText, setInputText] = useState('');
        const handleAdd = () => {
            onAdd(listType, inputText);
            setInputText('');
            setShowInput(false);
        };
        return (
            <React.Fragment>
                <ul className="task-list font-handwriting">
                    {tasks.map(task => (
                        <li key={task.id} onClick={() => onToggle(listType, task.id)} className="flex items-center text-2xl text-gray-200 cursor-pointer mb-4">
                            <div className={`w-7 h-7 border-2 border-gray-400 rounded-md mr-4 flex-shrink-0 transition-all duration-300 ${task.done ? 'bg-yellow-400 rotate-[360deg] border-yellow-400' : ''}`}>
                                {task.done && <span className="text-gray-800 text-xl flex items-center justify-center">♥</span>}
                            </div>
                            <span className={task.done ? 'line-through text-gray-500' : 'text-gray-200'}>{task.text}</span>
                        </li>
                    ))}
                </ul>
                {showInput ? (
                    <div className="flex items-center">
                        <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onBlur={handleAdd} onKeyPress={e => e.key === 'Enter' && handleAdd()} className="w-full bg-transparent border-b-2 border-dashed border-yellow-400 text-gray-200 font-handwriting text-2xl focus:outline-none" placeholder="New task..." autoFocus />
                    </div>
                ) : (
                    <button onClick={() => setShowInput(true)} className="font-doodle text-lg text-gray-400 hover:text-yellow-300">✏️ Add task</button>
                )}
            </React.Fragment>
        );
    };
    
    const myTasks = taskPage?.userTasks?.[userId] || [];
    const allTasks = [...(taskPage?.sharedTasks || []), ...myTasks];
    const allTasksCompleted = allTasks.length > 0 && allTasks.every(t => t.done);

    return (
        <div className="app-screen relative bg-[#0a0c27] p-4 flex flex-col justify-center items-center">
            <StarryNightBackground />
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center">
                <div className="flex justify-between items-center w-full max-w-md mb-4">
                    <button onClick={() => changeDay(-1)} className="font-header text-4xl text-white/80 hover:text-white">‹ Prev</button>
                    <button onClick={showHistory} className="font-doodle text-xl bg-white/10 text-white px-4 py-1 rounded-full backdrop-blur-sm border border-white/20">View History</button>
                    <button onClick={() => changeDay(1)} className="font-header text-4xl text-white/80 hover:text-white">Next ›</button>
                </div>

                <div className="relative w-full max-w-md h-[80vh] max-h-[600px]">
                    {isLoading ? (
                        <p className="text-white">Loading...</p>
                    ) : taskPage ? (
                        <div className="w-full h-full bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-lg flex flex-col">
                            <div className="page-header text-center border-b-2 border-dashed border-white/20 pb-2 mb-4">
                                <h1 className="font-header text-5xl text-white">{new Date(taskPage.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-2">
                                <div>
                                    <h2 className="font-doodle text-2xl mb-2 text-yellow-300/80">Shared Stuff:</h2>
                                    <TaskList tasks={taskPage.sharedTasks} onToggle={handleToggleTask} onAdd={handleAddTask} listType="shared" />
                                </div>
                                <div className="mt-4">
                                    <h2 className="font-doodle text-2xl mb-2 text-blue-300/80">My Stuff:</h2>
                                    <TaskList tasks={myTasks} onToggle={handleToggleTask} onAdd={handleAddTask} listType="user" />
                                </div>
                            </div>
                            {allTasksCompleted && (
                                <button onClick={handleTearOff} className="font-header text-2xl bg-yellow-400 text-gray-800 px-6 py-2 rounded-full self-center mt-4">Tear Off Page</button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
                            <p className="font-header text-3xl text-white">Loading page...</p>
                        </div>
                    )}
                </div>
            
                {isHistoryVisible && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsHistoryVisible(false)}>
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-white/20 p-8 rounded-lg w-full max-w-lg h-3/4 flex flex-col text-white" onClick={e => e.stopPropagation()}>
                            <h2 className="font-header text-5xl text-center mb-4">Archived Pages</h2>
                            <div className="overflow-y-auto pr-2">
                                {completedTasks.length > 0 ? completedTasks.map(page => (
                                    <div key={page.id} className="mb-4 p-4 border border-white/20 rounded-lg bg-black/20">
                                        <h3 className="font-doodle text-2xl border-b border-white/20 pb-2 mb-2">{new Date(page.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                                        
                                        {page.sharedTasks.length > 0 && <p className="font-doodle text-lg text-gray-400">Shared:</p>}
                                        <ul className="text-gray-300">
                                            {page.sharedTasks.map(t => (
                                                <li key={t.id} className="flex justify-between items-center group">
                                                    <span className="line-through">{t.text}</span>
                                                    <button onClick={() => handleRestoreTask(t, 'shared', null)} className="text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 px-2 rounded-full">Restore</button>
                                                </li>
                                            ))}
                                        </ul>

                                        {Object.keys(page.userTasks).map(uid => (
                                            <div key={uid} className="mt-2">
                                                <p className="font-doodle text-lg text-gray-400">{uid === userId ? "Your Tasks:" : "Partner's Tasks:"}</p>
                                                <ul className="text-gray-300">
                                                    {page.userTasks[uid].map(t => (
                                                        <li key={t.id} className="flex justify-between items-center group">
                                                            <span className="line-through">{t.text}</span>
                                                            <button onClick={() => handleRestoreTask(t, 'user', uid)} className="text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 px-2 rounded-full">Restore</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )) : <p className="text-center font-doodle">No archived pages yet!</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyTasks;