import { useState, useEffect } from 'react';
import './Layout.css';

export default function Layout({ children, onLogout }) {
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('EN');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const toggleLanguage = () => setLanguage(language === 'EN' ? 'ES' : 'EN');

    const chatHistory = [
        { id: 1, title: "Booked QuickFix Plumbing", date: "Today" },
        { id: 2, title: "Ordered Groceries", date: "Yesterday" },
        { id: 3, title: "Flight to New York", date: "Oct 18" },
    ];

    return (
        <div className="app-layout">
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-content">
                    <div className="sidebar-header">
                        <h2>History</h2>
                        <button className="icon-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
                    </div>
                    
                    <button className="new-chat-btn">+ New Errand</button>

                    <div className="history-list">
                        {chatHistory.map(chat => (
                            <div key={chat.id} className="history-item">
                                <span className="history-title">{chat.title}</span>
                                <span className="history-date">{chat.date}</span>
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
                        <div></div> /* Spacer when sidebar is open */
                    )}
                    <div className="header-actions">
                        <button className="pill-btn" onClick={toggleLanguage}>
                            🌐 {language}
                        </button>
                        <button className="pill-btn" onClick={toggleTheme}>
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>
                </header>

                <div className="content-area">
                    {children}
                </div>
            </main>
        </div>
    );
}