import { useState, useRef, useEffect } from 'react';
import { sendTaskRequest, sendCheckoutRequest, sendVoiceRequest } from '../services/api';
import './ChatInterface.css'; 

const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
);

const LockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

// High-end Apple-style Vector Icons for Cards
const WrenchIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);

const CartIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);

const PlaneIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.9c-.2.5 0 1.1.4 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.8 5.2c.3.4.9.6 1.3.4l.9-.3c.4-.2.6-.6.5-1.1z"/></svg>
);

const CreditCardIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
);

// Glowing Central Ghost Logo for the Welcome Screen
const GhostLogo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #007aff, #5856d6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 122, 255, 0.3)',
            marginBottom: '12px'
        }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Ghost AI</h2>
    </div>
);

export default function ChatInterface({ sessionId, updateChatTitle, initialMessages, onMessagesChange, language = 'EN' }) {
    
    const textUI = {
        EN: {
            greeting: `Hello, I'm Ghost. What can I do for you today?`,
            placeholder: "Type an errand or hold to talk...",
            loading: "Ghost is working...",
            listening: "Listening...",
            holdToTalk: "Hold to Talk",
            releaseToSend: "Release to Send",
            send: "Send",
            error: "Sorry, I encountered an error connecting to the server.",
            checkoutMsg: "I have prepared your secure invoice.",
            secureCheckout: "Secure Checkout",
            payWithPayPal: "Pay with PayPal",
            availableOption: "Available Option",
            selectOption: "Select Option"
        },
        AR: {
            greeting: `أهلاً، أنا جوست (Ghost). ماذا يمكنني أن أفعل لك اليوم؟`,
            placeholder: "اكتب مهمتك أو اضغط للتحدث...",
            loading: "جوست يعمل...",
            listening: "يستمع...",
            holdToTalk: "اضغط للتحدث",
            releaseToSend: "افلت للإرسال",
            send: "إرسال",
            error: "عذراً، حدث خطأ في الاتصال بالخادم.",
            checkoutMsg: "لقد قمت بتجهيز فاتورتك بشكل آمن.",
            secureCheckout: "دفع آمن",
            payWithPayPal: "ادفع عبر PayPal",
            availableOption: "خيار متاح",
            selectOption: "اختيار هذا العرض"
        }
    };

    const suggestionsUI = {
        EN: [
            { id: 1, icon: <WrenchIcon />, text: 'Book a plumber for tomorrow morning' },
            { id: 2, icon: <CartIcon />, text: 'Order my weekly groceries' },
            { id: 3, icon: <PlaneIcon />, text: 'Find flights to New York for next weekend' },
            { id: 4, icon: <CreditCardIcon />, text: 'Pay my upcoming internet bill' }
        ],
        AR: [
            { id: 1, icon: <WrenchIcon />, text: 'احجز سباكاً لصباح الغد' },
            { id: 2, icon: <CartIcon />, text: 'اطلب بقالة الأسبوع' },
            { id: 3, icon: <PlaneIcon />, text: 'ابحث عن رحلات إلى نيويورك' },
            { id: 4, icon: <CreditCardIcon />, text: 'ادفع فاتورة الإنترنت القادمة' }
        ]
    };

    const [messages, setMessages] = useState(
        initialMessages && initialMessages.length > 0 
            ? initialMessages 
            : [{ role: 'ai', content: textUI[language].greeting, options: null }]
    );
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

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
            setMessages((prev) => [...prev, { role: 'ai', content: textUI[language].error }]);
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
                
                setMessages((prev) => [...prev, { role: 'user', content: "..." }]);

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
                            { role: 'user', content: data.transcription },
                            { role: 'ai', content: data.ai_response, options: data.options }
                        ];
                    });
                } catch (error) {
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages.pop();
                        return [...newMessages, { role: 'ai', content: textUI[language].error }];
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
        setMessages((prev) => [...prev, { role: 'user', content: option.name }]);
        
        try {
            const data = await sendCheckoutRequest(option.rate, option.name, sessionId);
            
            const paymentMessage = { 
                role: 'ai', 
                content: textUI[language].checkoutMsg,
                paymentDetails: {
                    item: data.item,
                    amount: data.received_amount,
                    link: data.payment_link
                }
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
                {/* Show Ghost Logo and Welcome when chat is fresh */}
                {messages.length === 1 && <GhostLogo />}

                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                        <div className={`message-bubble ${msg.role}`}>
                            
                            {msg.content}
                            
                            {msg.paymentDetails && (
                                <div className="payment-card">
                                    <div className="payment-card-header">
                                        <LockIcon />
                                        <span>{textUI[language].secureCheckout}</span>
                                    </div>
                                    <div className="payment-card-body">
                                        <div className="payment-item-name">{msg.paymentDetails.item}</div>
                                        <div className="payment-item-price">${msg.paymentDetails.amount}</div>
                                    </div>
                                    <a href={msg.paymentDetails.link} target="_blank" rel="noopener noreferrer" className="btn-pay-now">
                                        {textUI[language].payWithPayPal}
                                    </a>
                                </div>
                            )}

                            {msg.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                                    {msg.options.map((opt) => (
                                        <div key={opt.id} className="payment-card">
                                            <div className="payment-card-header" style={{ background: 'rgba(134, 134, 139, 0.1)', color: 'var(--text-secondary)' }}>
                                                <span>{textUI[language].availableOption}</span>
                                            </div>
                                            <div className="payment-card-body">
                                                <div className="payment-item-name">{opt.name}</div>
                                                <div className="payment-item-price">${opt.rate}</div>
                                                <small style={{ color: '#86868b', marginTop: '4px', display: 'block' }}>{opt.time}</small>
                                            </div>
                                            <button 
                                                onClick={() => handleCheckout(opt)} 
                                                className="btn-pay-now"
                                                style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: 'calc(100% - 28px)' }}
                                            >
                                                {textUI[language].selectOption}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {messages.length === 1 && (
                    <div className="suggestions-grid">
                        {suggestionsUI[language].map((sugg) => (
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

                {isLoading && <div className="loading-text">{textUI[language].loading}</div>}
            </div>

            <form onSubmit={handleSend} className="input-form">
                {!isRecording ? (
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder={textUI[language].placeholder} 
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
                        <span style={{ marginLeft: '12px', fontSize: '14px', color: 'var(--accent-color)', fontWeight: 500 }}>
                            {textUI[language].listening}
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
                        backgroundColor: isRecording ? '#ff3b30' : 'var(--surface-hover)', 
                        color: isRecording ? '#fff' : 'var(--text-primary)',
                        width: '160px',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <MicIcon />
                    {isRecording ? textUI[language].releaseToSend : textUI[language].holdToTalk}
                </button>

                <button 
                    type="submit" 
                    disabled={isLoading || isRecording || !input.trim()} 
                    className="btn-send"
                >
                    {textUI[language].send}
                </button>
            </form>
        </div>
    );
}