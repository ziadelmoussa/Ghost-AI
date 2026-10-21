import { useState } from 'react';
import { sendTaskRequest, sendCheckoutRequest } from '../services/api';
import './ChatInterface.css'; // Import the new styles here

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
            
            <button onClick={handleTestPayment} disabled={isLoading} className="btn-paypal">
                Test PayPal Checkout ($50)
            </button>
        </div>
    );
}