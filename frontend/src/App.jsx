import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [sessionId, setSessionId] = useState(null);

  const handleDemoLogin = () => {
    const mockSession = "demo_judge_" + Math.random().toString(36).substring(2, 9);
    setSessionId(mockSession);
  };

  const handleLogout = () => {
    setSessionId(null);
  };

  return (
    <>
      {!sessionId ? (
        <Onboarding onLogin={handleDemoLogin} />
      ) : (
        <Layout onLogout={handleLogout}>
          <ChatInterface sessionId={sessionId} />
        </Layout>
      )}
    </>
  );
}

export default App;