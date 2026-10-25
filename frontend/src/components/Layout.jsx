import React, { useState, useEffect } from 'react';
import './Layout.css';

export default function Layout({ children, onLogout }) {
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('EN');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // --- EXPANDED MOCK SESSIONS ---
    const [sessions, setSessions] = useState([
        { 
            id: 1, 
            title: "Booked QuickFix Plumbing", 
            date: "Today", 
            messages: [
                { role: 'ai', content: "Hello, I'm Ghost. What can I do for you today?", options: null },
                { role: 'user', content: 'Book a plumber for tomorrow morning' },
                { role: 'ai', content: 'I have found 2 options for you.', options: [
                    { id: 1, name: 'QuickFix Plumbing', rate: 45, time: 'Tomorrow 9:00 AM' },
                    { id: 2, name: 'Elite Pipe Masters', rate: 60, time: 'Tomorrow 10:30 AM' }
                ]}
            ] 
        },
        { 
            id: 2, 
            title: "Ordered Groceries", 
            date: "Yesterday", 
            messages: [
                { role: 'ai', content: "Hello, I'm Ghost. What can I do for you today?", options: null },
                { role: 'user', content: 'Order my weekly groceries' },
                { role: 'ai', content: 'I found your usual list from Almarai. Processing your order now...', options: null },
                { role: 'ai', content: 'Your groceries have been ordered and will be delivered by 5:00 PM today.', options: null }
            ] 
        },
        {
            id: 3,
            title: "NYC Flights",
            date: "Last Week",
            messages: [
                { role: 'ai', content: "Hello, I'm Ghost. What can I do for you today?", options: null },
                { role: 'user', content: 'Find flights to New York for next weekend' },
                { role: 'ai', content: 'I found 2 direct flights to JFK leaving this Friday. Which one works best?', options: [
                    { id: 3, name: 'Delta Airlines', rate: 350, time: 'Friday 6:00 PM (Direct)' },
                    { id: 4, name: 'JetBlue Airways', rate: 290, time: 'Friday 8:30 PM (Direct)' }
                ]}
            ]
        },
        {
            id: 4,
            title: "Paid Internet Bill",
            date: "Last Month",
            messages: [
                { role: 'ai', content: "Hello, I'm Ghost. What can I do for you today?", options: null },
                { role: 'user', content: 'Pay my upcoming internet bill' },
                { 
                    role: 'ai', 
                    content: 'I have prepared your secure invoice.', 
                    paymentDetails: { 
                        item: 'Monthly Internet Bill', 
                        amount: 85.00, 
                        link: '#', 
                        status: 'paid' 
                    } 
                }
            ]
        }
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
        const newSession = { id: newId, title: "New Errand", date: "Just now", messages: [] };
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newId);
        setChatKey(prev => prev + 1);
    };

    const switchChat = (id) => {
        if (activeSessionId !== id) {
            setActiveSessionId(id);
            setChatKey(prev => prev + 1); 
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

    const saveMessagesToSession = (newMessages) => {
        setSessions(prevSessions => 
            prevSessions.map(s => s.id === activeSessionId ? { ...s, messages: newMessages } : s)
        );
    };

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { 
                updateChatTitle,
                initialMessages: activeSession?.messages, 
                onMessagesChange: saveMessagesToSession,  
                language: language 
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