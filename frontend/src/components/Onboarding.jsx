import { useState } from 'react';
import AuthModal from './AuthModal';
import './Onboarding.css';

const MicIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
);

const LayersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 12 12 17 22 12"></polyline>
        <polyline points="2 17 12 22 22 17"></polyline>
    </svg>
);

const ShieldPayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);

export default function Onboarding({ onLogin }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="onboarding-wrapper">
                <div className="ambient-glow"></div>
                <div className="onboarding-card">
                    
                    <div className="onboarding-badge">PayPal Hackathon 2026</div>
                    
                    <h1 className="onboarding-title">
                        The <span className="title-highlight">Invisible</span> Assistant.
                    </h1>
                    
                    <p className="onboarding-subtitle">
                        Meet <strong>Ghost AI</strong>. A profoundly capable, stateful errand assistant. Just use your voice.
                    </p>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-well"><MicIcon /></div>
                            <h3 className="feature-title">Voice Native.</h3>
                            <p className="feature-desc">Hands-free dictation with real-time audio visualizers, powered natively by the Web Speech API.</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon-well"><LayersIcon /></div>
                            <h3 className="feature-title">Stateful Engine.</h3>
                            <p className="feature-desc">Context-aware, multi-turn task handling and smart option curation backed by a robust FastAPI backend.</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon-well"><ShieldPayIcon /></div>
                            <h3 className="feature-title">Frictionless Pay.</h3>
                            <p className="feature-desc">Autonomous invoicing, live status polling, and seamless mock checkout driven by PayPal integration.</p>
                        </div>
                    </div>

                    <button onClick={() => setShowModal(true)} className="btn-demo-login">
                        Get Started
                    </button>
                    
                </div>
            </div>

            {showModal && (
                <AuthModal 
                    onClose={() => setShowModal(false)} 
                    onLogin={onLogin} 
                />
            )}
        </>
    );
}