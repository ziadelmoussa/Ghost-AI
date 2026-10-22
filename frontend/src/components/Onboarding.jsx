import { useState } from 'react';
import AuthModal from './AuthModal';
import './Onboarding.css';

export default function Onboarding({ onLogin }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="onboarding-wrapper">
                <div className="onboarding-card">
                    
                    <div className="onboarding-badge">PayPal Hackathon 2026</div>
                    
                    <h1 className="onboarding-title">
                        The <span className="title-highlight">Invisible</span> Assistant.
                    </h1>
                    
                    <p className="onboarding-subtitle">
                        Profoundly capable. Entirely autonomous. Just use your voice.
                    </p>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <span className="feature-icon">🎙️</span>
                            <h3 className="feature-title">Voice Native.</h3>
                            <p className="feature-desc">Dictate complex tasks naturally. No typing required.</p>
                        </div>
                        
                        <div className="feature-card">
                            <span className="feature-icon">🧠</span>
                            <h3 className="feature-title">Smart Parsing.</h3>
                            <p className="feature-desc">Instantaneous search and curation of the best options.</p>
                        </div>
                        
                        <div className="feature-card">
                            <span className="feature-icon">💳</span>
                            <h3 className="feature-title">Frictionless Pay.</h3>
                            <p className="feature-desc">Secure, autonomous checkout powered by PayPal.</p>
                        </div>
                    </div>

                    {/* This now opens the Auth Modal instead of directly logging in */}
                    <button onClick={() => setShowModal(true)} className="btn-demo-login">
                        Get Started
                    </button>
                    
                </div>
            </div>

            {/* Render the modal on top of the screen if state is true */}
            {showModal && (
                <AuthModal 
                    onClose={() => setShowModal(false)} 
                    onLogin={onLogin} 
                />
            )}
        </>
    );
}