import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Onboarding from './components/Onboarding';
import './App.css'; // Ensure global resets are here if you have them

function App() {
  const [sessionId, setSessionId] = useState(null);

  const handleDemoLogin = () => {
    const mockSession = "demo_judge_" + Math.random().toString(36).substring(2, 9);
    setSessionId(mockSession);
  };

  return (
    <>
      {!sessionId ? (
        <Onboarding onLogin={handleDemoLogin} />
      ) : (
        <ChatInterface sessionId={sessionId} />
      )}
    </>
  );
}

export default App;