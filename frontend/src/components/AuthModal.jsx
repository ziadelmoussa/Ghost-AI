import { useState } from 'react';
import './AuthModal.css';

export default function AuthModal({ onClose, onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock authentication success
        onLogin();
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>✕</button>
                
                <h2 className="auth-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="auth-subtitle">
                    {isSignUp ? 'Join The Invisible Assistant.' : 'Sign in to manage your errands.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        {isSignUp && (
                            <input type="text" placeholder="Full Name" className="auth-input" />
                        )}
                        <input type="email" placeholder="Email Address" className="auth-input" />
                        <input type="password" placeholder="Password" className="auth-input" />
                    </div>

                    <button type="submit" className="auth-btn-primary">
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                </form>

                <div className="auth-divider">or</div>

                <button type="button" className="auth-btn-social" onClick={onLogin}>
                    Continue with PayPal
                </button>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#86868b' }}>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <span 
                        style={{ color: '#2997ff', cursor: 'pointer' }}
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? 'Log In' : 'Sign Up'}
                    </span>
                </p>
            </div>
        </div>
    );
}