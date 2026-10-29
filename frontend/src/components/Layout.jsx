import React, { useState, useEffect } from 'react';
import './Layout.css';

/**
 * Generates a fresh, empty session shell for new errands.
 */
const generateEmptySession = () => ({
    id: Date.now(),
    title: "New Errand",
    date: "Just now",
    messages: []
});

export default function Layout({ children, onLogout }) {
    const [theme, setTheme] = useState('dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Initialize state with pre-populated hackathon demo scenarios
    const [sessions, setSessions] = useState(() => {
        const freshSession = generateEmptySession();
        return [
            freshSession,
            { 
                id: 1, 
                title: "Booked QuickFix Plumbing", 
                date: "Today", 
                messages: [
                    { role: 'ai', content: "Hello Ziad! I'm ready to assist. What errand or task would you like me to handle for you today?", options: null },
                    { role: 'user', content: 'Book a plumber for tomorrow morning' },
                    { role: 'ai', content: 'I contacted licensed plumbers in Dammam for your kitchen sink repair. Here are the confirmed time slots.', options: [
                        { id: 1, name: 'QuickFix Emergency Plumbing', rate: 45.00, time: 'Tomorrow at 10:00 AM' },
                        { id: 2, name: 'Elite Pro Repair Masters', rate: 65.00, time: 'Tomorrow at 02:00 PM' }
                    ]},
                    { role: 'user', content: 'QuickFix Emergency Plumbing' },
                    { 
                        role: 'ai', 
                        content: 'I have prepared your secure invoice for QuickFix Emergency Plumbing.', 
                        paymentDetails: { 
                            item: 'QuickFix Emergency Plumbing', 
                            amount: 45.00, 
                            link: '#', 
                            status: 'paid',
                            orderId: 'MOCK-PLUMBER-123'
                        } 
                    }
                ] 
            },
            { 
                id: 2, 
                title: "Weekly Groceries", 
                date: "Yesterday", 
                messages: [
                    { role: 'ai', content: "Hello Ziad! I'm ready to assist. What errand or task would you like me to handle for you today?", options: null },
                    { role: 'user', content: 'Order my weekly groceries' },
                    { role: 'ai', content: 'I\'ve compiled your weekly grocery basket (Almarai Milk, Eggs, Bread, Arabic Coffee). Here are the delivery options.', options: [
                        { id: 1, name: 'GreenThumb Express Delivery', rate: 28.50, time: 'Delivery in 35 mins' },
                        { id: 2, name: 'Panda Supermarket Direct', rate: 22.00, time: 'Delivery in 60 mins' }
                    ]},
                    { role: 'user', content: 'can i add to the list cheese and chocolate?' },
                    { role: 'ai', content: 'Updated your grocery basket. Added Cheddar Cheese ($3.50), Dark Chocolate ($2.50). Current list: Almarai Milk, Eggs, Bread, Arabic Coffee, Cheddar Cheese, Dark Chocolate.', options: [
                        { id: 1, name: 'GreenThumb Express Basket (6 Items)', rate: 34.50, time: 'Delivery in 30 mins' },
                        { id: 2, name: 'Panda Supermarket Direct (6 Items)', rate: 32.00, time: 'Delivery in 55 mins' }
                    ]}
                ] 
            },
            {
                id: 3,
                title: "NYC Flights",
                date: "Last Week",
                messages: [
                    { role: 'ai', content: "Hello Ziad! I'm ready to assist. What errand or task would you like me to handle for you today?", options: null },
                    { role: 'user', content: 'Find flights to New York for next weekend' },
                    { role: 'ai', content: 'I found available Economy routes for Dammam to New York. Here are the top available bookings.', options: [
                        { id: 1, name: 'Emirates Direct (Dammam to New York)', rate: 1150.00, time: 'Departs Sat at 11:30 AM' },
                        { id: 2, name: 'Saudia Express (Dammam to New York)', rate: 890.00, time: 'Departs Sat at 04:15 PM' }
                    ]},
                    { role: 'user', content: 'is there a business class option?' },
                    { role: 'ai', content: 'I found available Business Class routes for Dammam to New York. Here are the top available bookings.', options: [
                        { id: 1, name: 'Emirates Direct (Dammam to New York)', rate: 3200.00, time: 'Departs Sat at 11:30 AM' },
                        { id: 2, name: 'Saudia Express (Dammam to New York)', rate: 2850.00, time: 'Departs Sat at 04:15 PM' }
                    ]}
                ]
            },
            {
                id: 4,
                title: "Paid Internet Bill",
                date: "Last Month",
                messages: [
                    { role: 'ai', content: "Hello Ziad! I'm ready to assist. What errand or task would you like me to handle for you today?", options: null },
                    { role: 'user', content: 'Pay my upcoming internet bill' },
                    { role: 'ai', content: 'I\'ve fetched your verified account statement for STC Fiber Internet. Here is your total outstanding balance.', options: [
                        { id: 1, name: 'STC Fiber Internet Balance Settlement', rate: 75.00, time: 'Instant Processing' }
                    ]},
                    { role: 'user', content: 'STC Fiber Internet Balance Settlement' },
                    { 
                        role: 'ai', 
                        content: 'I have prepared your secure invoice.', 
                        paymentDetails: { 
                            item: 'STC Fiber Internet Balance Settlement', 
                            amount: 75.00, 
                            link: '#', 
                            status: 'paid',
                            orderId: 'MOCK-STC-789'
                        } 
                    }
                ]
            }
        ];
    });
    
    const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
    const [chatKey, setChatKey] = useState(0);

    // Sync theme toggle with root document element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleNewErrand = () => {
        const newSession = generateEmptySession();
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
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

    // Dynamically inject state management props into the child ChatInterface component
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { 
                updateChatTitle,
                initialMessages: activeSession?.messages, 
                onMessagesChange: saveMessagesToSession
            });
        }
        return child;
    });

    return (
        <div className="app-layout">
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-content">
                    <div className="sidebar-header">
                        <h2>History</h2>
                        <button className="icon-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
                    </div>
                    
                    <button className="new-chat-btn" onClick={handleNewErrand}>
                        + New Errand
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
                                <button className="delete-icon-btn" onClick={(e) => handleDelete(e, chat.id)}>✕</button>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        <button className="logout-btn" onClick={onLogout}>Log Out</button>
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