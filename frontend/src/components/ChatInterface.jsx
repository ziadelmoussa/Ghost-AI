import { useState } from 'react';
import { sendTaskRequest, sendCheckoutRequest } from '../services/api';

export default function ChatInterface() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hello! I'm your Invisible Assistant. What errand can I handle for you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await sendTaskRequest(userMessage.content);
            const aiMessage = { role: 'ai', content: data.ai_response };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I encountered an error connecting to the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestPayment = async () => {
        setIsLoading(true);
        try {
            // Request a $50 checkout link from the Python backend
            const data = await sendCheckoutRequest(50.00);
            const paymentMessage = { 
                role: 'ai', 
                content: `Here is your payment link for $50.00: ${data.payment_link}` 
            };
            setMessages((prev) => [...prev, paymentMessage]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: "Failed to generate PayPal link." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: '10px' }}>
                        <span style={{ 
                            background: msg.role === 'user' ? '#007bff' : '#f1f1f1', 
                            color: msg.role === 'user' ? '#fff' : '#000',
                            padding: '8px 12px', 
                            borderRadius: '16px', 
                            display: 'inline-block',
                            wordBreak: 'break-word'
                        }}>
                            {msg.content.includes('http') ? (
                                <a href={msg.content.split(': ')[1]} target="_blank" rel="noopener noreferrer" style={{color: '#0056b3', textDecoration: 'underline'}}>
                                    Click here to approve payment
                                </a>
                            ) : (
                                msg.content
                            )}
                        </span>
                    </div>
                ))}
                {isLoading && <div style={{ textAlign: 'left', color: '#666' }}>Processing...</div>}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your errand here..." 
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: '#28a745', color: '#fff', cursor: 'pointer' }}>
                    Send
                </button>
            </form>
            
            <button onClick={handleTestPayment} disabled={isLoading} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', background: '#0070ba', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                Test PayPal Checkout ($50)
            </button>
        </div>
    );
}