import { useState, useRef, useEffect } from 'react';
import { sendTaskRequest, sendCheckoutRequest, checkPaymentStatus } from '../services/api';
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

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const WrenchIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const CartIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const PlaneIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.9c-.2.5 0 1.1.4 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.8 5.2c.3.4.9.6 1.3.4l.9-.3c.4-.2.6-.6.5-1.1z"/></svg>;
const CreditCardIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;

const GhostLogo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <svg width="64" height="64" viewBox="0 0 512 512" fill="none" style={{ filter: 'drop-shadow(0 0 16px rgba(128, 128, 128, 0.15))', marginBottom: '12px', color: 'var(--text-primary)' }}>
            <path d="M256 32C150 32 64 118 64 224V416C64 432.657 77.3431 446 94 446C102.214 446 109.954 442.743 115.542 436.958L156.49 394.996C166.273 384.975 181.727 384.975 191.51 394.996L230.98 435.539C241.365 446.223 258.635 446.223 269.02 435.539L308.49 394.996C318.273 384.975 333.727 384.975 343.51 394.996L384.458 436.958C390.046 442.743 397.786 446 406 446C422.657 446 436 432.657 436 416V224C436 118 350 32 256 32Z" fill="none" stroke="currentColor" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round"/>
            <ellipse cx="192" cy="208" rx="28" ry="36" fill="currentColor" />
            <ellipse cx="320" cy="208" rx="28" ry="36" fill="currentColor" />
        </svg>
        <h2 style={{ fontSize: '22px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Ghost AI</h2>
    </div>
);

export default function ChatInterface({ sessionId, updateChatTitle, initialMessages, onMessagesChange }) {
    
    const textUI = {
        greeting: `Hello Ziad! I'm ready to assist. What errand or task would you like me to handle for you today?`,
        placeholder: "Type an errand or tap mic to talk...",
        listening: "Listening...",
        tapToTalk: "Tap to Talk",
        tapToStop: "Stop & Send",
        send: "Send",
        error: "Sorry, I encountered an error connecting to the server.",
        checkoutMsg: "I have prepared your secure invoice.",
        secureCheckout: "Secure Checkout",
        payWithPayPal: "Pay with PayPal",
        verifyingPayment: "Verifying Payment...",
        availableOption: "Available Option",
        selectOption: "Select Option",
        paymentSuccess: "Payment Successful",
        receiptFor: "Receipt for"
    };

    const suggestionsUI = [
        { id: 1, icon: <WrenchIcon />, text: 'Book a plumber for tomorrow morning' },
        { id: 2, icon: <CartIcon />, text: 'Order my weekly groceries' },
        { id: 3, icon: <PlaneIcon />, text: 'Find flights to New York for next weekend' },
        { id: 4, icon: <CreditCardIcon />, text: 'Pay my upcoming internet bill' }
    ];

    const [messages, setMessages] = useState(
        initialMessages && initialMessages.length > 0 
            ? initialMessages 
            : [{ role: 'ai', content: textUI.greeting, options: null }]
    );
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null); 
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const isStoppingRef = useRef(false); // Prevents trailing speech events from resetting the input

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    useEffect(() => {
        if (onMessagesChange) onMessagesChange(messages);
    }, [messages, onMessagesChange]);

    // Initialize Web Speech API on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onresult = (event) => {
                if (isStoppingRef.current) return; // Ignore late results after stop
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                transcriptRef.current = currentTranscript;
                setInput(currentTranscript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const formatTitle = (text) => text.length > 22 ? text.substring(0, 22) + '...' : text;

    const submitText = async (textToSubmit) => {
        if (!textToSubmit.trim()) return;

        const userMessage = { role: 'user', content: textToSubmit };
        setMessages((prev) => [...prev, userMessage]);
        if (updateChatTitle) updateChatTitle(formatTitle(textToSubmit));

        setInput('');
        transcriptRef.current = '';
        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5s thinking delay
            const data = await sendTaskRequest(textToSubmit, sessionId);
            setMessages((prev) => [...prev, { role: 'ai', content: data.ai_response, options: data.options }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: textUI.error }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = (e) => {
        if (e) e.preventDefault();
        submitText(input);
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isRecording) {
            isStoppingRef.current = true; // Flag that we are stopping
            recognitionRef.current.stop();
            setIsRecording(false);
            
            const textToSend = transcriptRef.current;
            transcriptRef.current = '';
            setInput(''); // Clear input immediately

            if (textToSend.trim()) {
                submitText(textToSend);
            }
        } else {
            isStoppingRef.current = false;
            transcriptRef.current = '';
            setInput('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const handleCheckout = async (option) => {
        setIsLoading(true);
        setMessages((prev) => [...prev, { role: 'user', content: option.name }]);
        
        try {
            const data = await sendCheckoutRequest(option.rate, option.name, sessionId);
            const paymentMessage = { 
                role: 'ai', 
                content: textUI.checkoutMsg,
                paymentDetails: { 
                    item: data.item, 
                    amount: data.received_amount, 
                    link: data.payment_link, 
                    status: 'pending',
                    orderId: data.order_id 
                }
            };
            setMessages((prev) => [...prev, paymentMessage]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'ai', content: textUI.error }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentClick = (msgIndex, link, orderId) => {
        window.open(link, '_blank');
        
        setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[msgIndex].paymentDetails.status = 'verifying';
            return newMessages;
        });

        const checkInterval = setInterval(async () => {
            const tokenMatch = link.match(/token=([^&]+)/);
            const token = orderId || (tokenMatch ? tokenMatch[1] : null);

            if (!token) {
                clearInterval(checkInterval);
                return;
            }

            try {
                const status = await checkPaymentStatus(token);
                
                if (status === 'paid') {
                    clearInterval(checkInterval);
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        if (newMessages[msgIndex]) {
                            newMessages[msgIndex].paymentDetails.status = 'paid';
                        }
                        return newMessages;
                    });
                }
            } catch (error) {
                console.error("Error polling payment status:", error);
            }
        }, 2500);
    };

    return (
        <div className="chat-container">
            <div className="chat-window">
                {messages.length === 1 && <GhostLogo />}

                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                        <div className={`message-bubble ${msg.role}`}>
                            
                            {msg.content}
                            
                            {msg.paymentDetails && (msg.paymentDetails.status === 'pending' || msg.paymentDetails.status === 'verifying') && (
                                <div className="payment-card">
                                    <div className="payment-card-header"><LockIcon /><span>{textUI.secureCheckout}</span></div>
                                    <div className="payment-card-body">
                                        <div className="payment-item-name">{msg.paymentDetails.item}</div>
                                        <div className="payment-item-price">${msg.paymentDetails.amount}</div>
                                    </div>
                                    <button 
                                        onClick={() => handlePaymentClick(index, msg.paymentDetails.link, msg.paymentDetails.orderId)} 
                                        className="btn-pay-now" 
                                        disabled={msg.paymentDetails.status === 'verifying'}
                                        style={{ 
                                            border: 'none', 
                                            cursor: msg.paymentDetails.status === 'verifying' ? 'wait' : 'pointer', 
                                            fontFamily: 'inherit', 
                                            width: 'calc(100% - 28px)',
                                            opacity: msg.paymentDetails.status === 'verifying' ? 0.7 : 1
                                        }}
                                    >
                                        {msg.paymentDetails.status === 'verifying' ? textUI.verifyingPayment : textUI.payWithPayPal}
                                    </button>
                                </div>
                            )}

                            {msg.paymentDetails && msg.paymentDetails.status === 'paid' && (
                                <div className="receipt-card">
                                    <div className="receipt-header"><CheckIcon /><span>{textUI.paymentSuccess}</span></div>
                                    <div className="receipt-body">
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{textUI.receiptFor} {msg.paymentDetails.item}</div>
                                        <div className="receipt-amount">${msg.paymentDetails.amount}</div>
                                    </div>
                                </div>
                            )}

                            {msg.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                                    {msg.options.map((opt) => (
                                        <div key={opt.id} className="payment-card">
                                            <div className="payment-card-header" style={{ background: 'rgba(134, 134, 139, 0.1)', color: 'var(--text-secondary)' }}>
                                                <span>{textUI.availableOption}</span>
                                            </div>
                                            <div className="payment-card-body">
                                                <div className="payment-item-name">{opt.name}</div>
                                                <div className="payment-item-price">${opt.rate}</div>
                                                <small style={{ color: '#86868b', marginTop: '4px', display: 'block' }}>{opt.time}</small>
                                            </div>
                                            <button onClick={() => handleCheckout(opt)} className="btn-pay-now" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: 'calc(100% - 28px)' }}>
                                                {textUI.selectOption}
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
                        {suggestionsUI.map((sugg) => (
                            <button key={sugg.id} className="suggestion-card" onClick={() => setInput(sugg.text)}>
                                <span className="suggestion-icon">{sugg.icon}</span>
                                <span className="suggestion-text">{sugg.text}</span>
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="message-wrapper ai">
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="input-form">
                {!isRecording ? (
                    <input 
                        ref={inputRef} 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder={textUI.placeholder} 
                        className="chat-input" 
                        disabled={isLoading} 
                    />
                ) : (
                    <div className="visualizer-container" style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
                        <div className="visualizer-bar"></div><div className="visualizer-bar"></div><div className="visualizer-bar"></div><div className="visualizer-bar"></div><div className="visualizer-bar"></div>
                        <span style={{ marginLeft: '12px', fontSize: '14px', color: 'var(--accent-color)', fontWeight: 500 }}>{textUI.listening} <br/> <small style={{color: '#86868b'}}>{input}</small></span>
                    </div>
                )}
                
                <button 
                    type="button" 
                    onClick={toggleRecording} 
                    className="btn-send" 
                    style={{ backgroundColor: isRecording ? '#ff3b30' : 'var(--surface-hover)', color: isRecording ? '#fff' : 'var(--text-primary)', width: '160px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >
                    <MicIcon />
                    {isRecording ? textUI.tapToStop : textUI.tapToTalk}
                </button>

                <button type="submit" disabled={isLoading || isRecording || !input.trim()} className="btn-send">
                    {textUI.send}
                </button>
            </form>
        </div>
    );
}