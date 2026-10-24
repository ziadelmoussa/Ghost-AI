import { useState, useRef, useEffect } from 'react';
import { sendTaskRequest, sendCheckoutRequest, sendVoiceRequest } from '../services/api';
import './ChatInterface.css'; 

const SUGGESTIONS = [
    { id: 1, icon: '🔧', text: 'Book a plumber for tomorrow morning' },
    { id: 2, icon: '🛒', text: 'Order my weekly groceries' },
    { id: 3, icon: '✈️', text: 'Find flights to New York for next weekend' },
    { id: 4, icon: '💳', text: 'Pay my upcoming internet bill' }
];

// Added initialMessages and onMessagesChange to props
export default function ChatInterface({ sessionId, updateChatTitle, initialMessages, onMessagesChange }) {
    
    // 1. If Layout hands us saved messages, use them! Otherwise, show the default greeting.
    const [messages, setMessages] = useState(
        initialMessages && initialMessages.length > 0 
            ? initialMessages 
            : [{ role: 'ai', content: `Session active (${sessionId}). What errand can I handle for you today?`, options: null }]
    );
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    // 2. MAGIC TRICK: Every time the 'messages' change on screen, silently send them to Layout.jsx to save!
    useEffect(() => {
        if (onMessagesChange) {
            onMessagesChange(messages);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    const formatTitle = (text) => {
        return text.length > 22 ? text.substring(0, 22) + '...' : text;
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        
        if (updateChatTitle) {
            updateChatTitle(formatTitle(input));
        }

        setInput('');
        setIsLoading(true);

        try {
            const data = await sendTaskRequest(userMessage.content, sessionId);
            const aiMessage = { role: 'ai', content: data.ai_response, options: data.options };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I encountered an error connecting to the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                setIsLoading(true);
                
                setMessages((prev) => [...prev, { role: 'user', content: "🎤 Transcribing audio..." }]);

                try {
                    const data = await sendVoiceRequest(audioBlob, sessionId);
                    
                    if (updateChatTitle && data.transcription) {
                        updateChatTitle(formatTitle(data.transcription));
                    }
                    
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages.pop(); 
                        return [
                            ...newMessages,
                            { role: 'user', content: `🎤 ${data.transcription}` },
                            { role: 'ai', content: data.ai_response, options: data.options }
                        ];
                    });
                } catch (error) {
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages.pop();
                        return [...newMessages, { role: 'ai', content: "Failed to process audio." }];
                    });
                } finally {
                    setIsLoading(false);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Please allow microphone access to use voice chat.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleCheckout = async (option) => {
        setIsLoading(true);
        setMessages((prev) => [...prev, { role: 'user', content: `I choose ${option.name}` }]);
        
        try {
            const data = await sendCheckoutRequest(option.rate, option.name, sessionId);
            const paymentMessage = { 
                role: 'ai', 
                content: `Here is your secure checkout link for ${data.item} ($${data.received_amount}): ${data.payment_link}` 
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
                            
                            {msg.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                                    {msg.options.map((opt) => (
                                        <button 
                                            key={opt.id} 
                                            onClick={() => handleCheckout(opt)}
                                            className="option-card-btn"
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <strong>{opt.name}</strong>
                                                <span style={{ color: '#2997ff', fontWeight: 600 }}>${opt.rate}</span>
                                            </div>
                                            <small style={{ color: '#86868b' }}>{opt.time}</small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {messages.length === 1 && (
                    <div className="suggestions-grid">
                        {SUGGESTIONS.map((sugg) => (
                            <button 
                                key={sugg.id} 
                                className="suggestion-card"
                                onClick={() => setInput(sugg.text)}
                            >
                                <span className="suggestion-icon">{sugg.icon}</span>
                                <span className="suggestion-text">{sugg.text}</span>
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && <div className="loading-text">Assistant is working...</div>}
            </div>

            <form onSubmit={handleSend} className="input-form">
                {!isRecording ? (
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Type an errand or hold to talk..." 
                        className="chat-input"
                        disabled={isLoading}
                    />
                ) : (
                    <div className="visualizer-container" style={{ flex: 1 }}>
                        <div className="visualizer-bar"></div>
                        <div className="visualizer-bar"></div>
                        <div className="visualizer-bar"></div>
                        <div className="visualizer-bar"></div>
                        <div className="visualizer-bar"></div>
                        <span style={{ marginLeft: '12px', fontSize: '14px', color: '#0071e3', fontWeight: 500 }}>
                            Listening...
                        </span>
                    </div>
                )}
                
                <button 
                    type="button" 
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className="btn-send"
                    style={{ 
                        backgroundColor: isRecording ? '#ff453a' : '#2c2c2e', 
                        color: isRecording ? '#fff' : '#f5f5f7',
                        width: '140px'
                    }}
                >
                    {isRecording ? 'Release to Send' : '🎤 Hold to Talk'}
                </button>

                <button 
                    type="submit" 
                    disabled={isLoading || isRecording || !input.trim()} 
                    className="btn-send"
                >
                    Send
                </button>
            </form>
        </div>
    );
}