// Automatically uses Render in production, and localhost when running locally!
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Extract the root server URL (stripping out '/api' if present) for non-api routes like payment status
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

/**
 * Sends natural language text prompts to the stateful engine.
 */
export const sendTaskRequest = async (prompt, sessionId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/process-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_prompt: prompt, session_id: sessionId }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Ghost AI Text API Error:", error);
        throw error;
    }
};

/**
 * Initiates the PayPal checkout order generation for a selected errand.
 */
export const sendCheckoutRequest = async (amount, itemName, sessionId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_total: amount, item_name: itemName, session_id: sessionId }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Ghost AI Checkout API Error:", error);
        throw error;
    }
};

/**
 * Sends a native Web Speech API audio blob to the backend for mock processing.
 */
export const sendVoiceRequest = async (audioBlob, sessionId) => {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "user_voice.webm");
    formData.append("session_id", sessionId); 

    try {
        const response = await fetch(`${API_BASE_URL}/voice-task`, {
            method: 'POST',
            body: formData, 
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Ghost AI Voice API Error:", error);
        throw error;
    }
};

/**
 * Polls the backend dictionary for real-time payment status updates.
 */
export const checkPaymentStatus = async (orderId) => {
    try {
        const response = await fetch(`${SERVER_BASE_URL}/payment/status/${orderId}`);
        const data = await response.json();
        return data.status; 
    } catch (error) {
        console.error("Ghost AI Polling Error:", error);
        return "pending";
    }
};