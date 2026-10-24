import React, { useState, useEffect } from 'react';
import './Layout.css';

export default function Layout({ children, onLogout }) {
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('EN');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 1. Added a "messages" array to the sessions to act as our in-memory database!
    const [sessions, setSessions] = useState([
        { 
            id: 1, 
            title: "Booked QuickFix Plumbing", 
            date: "Today", 
            messages: [
                { role: 'ai', content: 'Session active (1). What errand can I handle for you today?', options: null },
                { role: 'user', content: 'Book a plumber for tomorrow morning' },
                { role: 'ai', content: 'I have found 2 options for you.', options: [{id: 1, name: 'QuickFix Plumbing', rate: 45, time: 'Tomorrow 9am'}] }
            ] 
        },
        { 
            id: 2, 
            title: "Ordered Groceries", 
            date: "Yesterday", 
            messages: [
                { role: 'ai', content: 'Session active (2). What errand can I handle for you today?', options: null },
                { role: 'user', content: 'Order my weekly groceries from Almarai' },
                { role: 'ai', content: 'I found your usual list. Processing options...', options: null }
            ] 
        },
    ]);
    const [activeSessionId, setActiveSessionId] = useState(1);
    const [chatKey, setChatKey] = useState(0);

    const textUI = {
        EN: { history: "History", newErrand: "+ New Errand", logout: "Log Out", toggleLang: "🌐 AR" },
        AR: { history: "السجل", newErrand: "مهمة جديدة +", logout: "تسجيل الخروج", toggleLang: "🌐 EN" }
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const toggleLanguage = () => setLanguage(language === 'EN' ? 'AR' : 'EN');

    const handleNewErrand = () => {
        const newId = Date.now();
        // Start new sessions with an empty messages array
        const newSession = { id: newId, title: "New Errand", date: "Just now", messages: [] };
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newId);
        setChatKey(prev => prev + 1);
    };

    const switchChat = (id) => {
        if (activeSessionId !== id) {
            setActiveSessionId(id);
            setChatKey(prev => prev + 1); // This remounts the chat window to load the new messages!
        }
    };

    const handleDelete = (e, idToDelete) => {
        e.stopPropagation(); 
        setSessions(prev => prev.filter(s => s.id !== idToDelete));
        if (activeSessionId === idToDelete) {
            setChatKey(prev => prev + 1);
        }
    };

    const updateChatTitle = (newTitle) => {
        setSessions(prevSessions => 
            prevSessions.map(s => s.id === activeSessionId ? { ...s, title: newTitle } : s)
        );
    };

    // 2. This function listens for new messages from the ChatInterface and saves them
    const saveMessagesToSession = (newMessages) => {
        setSessions(prevSessions => 
            prevSessions.map(s => s.id === activeSessionId ? { ...s, messages: newMessages } : s)
        );
    };

    // 3. Find the currently active session so we can pass its messages down
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    // Inject our new tools into the ChatInterface
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { 
                updateChatTitle,
                initialMessages: activeSession?.messages, // Pass down saved history
                onMessagesChange: saveMessagesToSession  // Pass down the save function
            });
        }
        return child;
    });

    return (
        <div className={`app-layout ${language === 'AR' ? 'rtl-mode' : ''}`}>
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-content">
                    <div className="sidebar-header">
                        <h2>{textUI[language].history}</h2>
                        <button className="icon-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
                    </div>
                    
                    <button className="new-chat-btn" onClick={handleNewErrand}>
                        {textUI[language].newErrand}
                    </button>

                    <div className="history-list">
                        {sessions.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`history-item ${activeSessionId === chat.id ? 'active' : ''}`}
                                onClick={() => switchChat(chat.id)}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="history-title">{chat.title}</div>
                                    <div className="history-date">{chat.date}</div>
                                </div>
                                <button 
                                    className="delete-icon-btn" 
                                    onClick={(e) => handleDelete(e, chat.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        <button className="logout-btn" onClick={onLogout}>
                            {textUI[language].logout}
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    {!isSidebarOpen ? (
                        <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
                    ) : (
                        <div></div>
                    )}
                    <div className="header-actions">
                        <button className="pill-btn" onClick={toggleLanguage}>
                            {textUI[language].toggleLang}
                        </button>
                        <button className="pill-btn" onClick={toggleTheme}>
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>
                </header>

                <div className="content-area" key={chatKey}>
                    {childrenWithProps}
                </div>
            </main>
        </div>
    );
}