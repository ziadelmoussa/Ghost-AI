import { useState } from 'react';
import { sendTaskRequest, sendCheckoutRequest } from '../services/api';
import './ChatInterface.css'; 

export default function ChatInterface() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hello! I'm your Invisible Assistant. What errand can I handle for you today?", options: null }
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
            const aiMessage = { 
                role: 'ai', 
                content: data.ai_response,
                options: data.options // Capturing the mock suppliers
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I encountered an error connecting to the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckout = async (option) => {
        setIsLoading(true);
        // Add a message showing the user's selection
        setMessages((prev) => [...prev, { role: 'user', content: `I choose ${option.name}` }]);
        
        try {
            const data = await sendCheckoutRequest(option.rate, option.name);
            const paymentMessage = { 
                role: 'ai', 
                content: `Great choice! Here is your payment link for ${data.item} ($${data.received_amount}): ${data.payment_link}` 
            };
            setMessages((prev) => [...prev, paymentMessage]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: "Failed to generate PayPal link." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                        <div className={`message-bubble ${msg.role}`}>
                            {msg.content.includes('http') ? (
                                <a href={msg.content.split(': ')[1]} target="_blank" rel="noopener noreferrer" className="payment-link">
                                    Click here to approve payment
                                </a>
                            ) : (
                                msg.content
                            )}
                            
                            {/* Render Dynamic Options if they exist */}
                            {msg.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    {msg.options.map((opt) => (
                                        <button 
                                            key={opt.id} 
                                            onClick={() => handleCheckout(opt)}
                                            style={{ padding: '10px', background: '#2d2d30', color: '#fff', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', transition: '0.2s' }}
                                            onMouseOver={(e) => e.target.style.borderColor = '#007bff'}
                                            onMouseOut={(e) => e.target.style.borderColor = '#444'}
                                        >
                                            <strong>{opt.name}</strong> - ${opt.rate} <br/>
                                            <small style={{ color: '#aaa' }}>{opt.time}</small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="loading-text">Assistant is working...</div>}
            </div>

            <form onSubmit={handleSend} className="input-form">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your errand here..." 
                    className="chat-input"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="btn-send">
                    Send
                </button>
            </form>
        </div>
    );
}