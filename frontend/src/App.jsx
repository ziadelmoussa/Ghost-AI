import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import './App.css';

// --- PRE-SAVED DEMO CHATS ---
const PRE_SAVED_DEMO_CHATS = [
  {
    id: 'demo-plumber',
    title: 'Book a Plumber',
    messages: [
      { role: 'user', content: 'Book a plumber for tomorrow morning' },
      { 
        role: 'ai', 
        content: 'I contacted licensed plumbers in Dammam for your kitchen sink repair. Here are the confirmed time slots.',
        options: [
          { id: 1, name: 'QuickFix Emergency Plumbing', rate: 45.00, time: 'Tomorrow at 10:00 AM' },
          { id: 2, name: 'Elite Pro Repair Masters', rate: 65.00, time: 'Tomorrow at 02:00 PM' }
        ]
      }
    ]
  },
  {
    id: 'demo-groceries',
    title: 'Weekly Groceries',
    messages: [
      { role: 'user', content: 'Order my weekly groceries' },
      {
        role: 'ai',
        content: 'I\'ve compiled your weekly grocery basket (Almarai Milk, Eggs, Bread, Arabic Coffee). Here are the delivery options.',
        options: [
          { id: 1, name: 'GreenThumb Express Delivery', rate: 28.50, time: 'Delivery in 35 mins' },
          { id: 2, name: 'Panda Supermarket Direct', rate: 22.00, time: 'Delivery in 60 mins' }
        ]
      }
    ]
  },
  {
    id: 'demo-flights',
    title: 'Flights to New York',
    messages: [
      { role: 'user', content: 'Find flights to New York for next weekend' },
      {
        role: 'ai',
        content: 'I found available Economy routes for Dammam to New York. Here are the top available bookings.',
        options: [
          { id: 1, name: 'Emirates Direct (Dammam to New York)', rate: 1150.00, time: 'Departs Sat at 11:30 AM' },
          { id: 2, name: 'Saudia Express (Dammam to New York)', rate: 890.00, time: 'Departs Sat at 04:15 PM' }
        ]
      }
    ]
  },
  {
    id: 'demo-bill',
    title: 'STC Internet Bill',
    messages: [
      { role: 'user', content: 'Pay my upcoming internet bill' },
      {
        role: 'ai',
        content: 'I\'ve fetched your verified account statement for STC Fiber Internet. Here is your total outstanding balance.',
        options: [
          { id: 1, name: 'STC Fiber Internet Balance Settlement', rate: 75.00, time: 'Instant Processing' }
        ]
      }
    ]
  }
];

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [activeDemoMessages, setActiveDemoMessages] = useState([]);

  const handleDemoLogin = () => {
    // Generates a fresh, empty session every time you log in
    const mockSession = "demo_judge_" + Math.random().toString(36).substring(2, 9);
    setSessionId(mockSession);
    setActiveDemoMessages([]); 
  };

  const handleLogout = () => {
    setSessionId(null);
    setActiveDemoMessages([]);
  };

  // Function to let the sidebar change the active chat
  const handleSelectChat = (chatId, messages) => {
    setSessionId(chatId);
    setActiveDemoMessages(messages);
  };

  return (
    <>
      {!sessionId ? (
        <Onboarding onLogin={handleDemoLogin} />
      ) : (
        <Layout 
          onLogout={handleLogout}
          demoChats={PRE_SAVED_DEMO_CHATS}
          onSelectChat={handleSelectChat}
          currentSessionId={sessionId}
          onNewChat={handleDemoLogin}
        >
          <ChatInterface 
            key={sessionId} // Forces ChatInterface to wipe clean when switching chats
            sessionId={sessionId} 
            initialMessages={activeDemoMessages}
          />
        </Layout>
      )}
    </>
  );
}

export default App;