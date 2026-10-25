const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
        console.error("Error communicating with backend:", error);
        throw error;
    }
};

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
        console.error("Error creating checkout:", error);
        throw error;
    }
};

export const sendVoiceRequest = async (audioBlob, sessionId) => {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "user_voice.webm");
    formData.append("session_id", sessionId); // Pass session ID with the audio file

    try {
        const response = await fetch(`${API_BASE_URL}/voice-task`, {
            method: 'POST',
            body: formData, 
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error communicating with voice backend:", error);
        throw error;
    }
};

export const checkPaymentStatus = async (orderId) => {
    try {
        // Adjust the URL if your FastAPI runs on a different port
        const response = await fetch(`http://localhost:8000/payment/status/${orderId}`);
        const data = await response.json();
        return data.status; 
    } catch (error) {
        console.error("Error checking status:", error);
        return "pending";
    }
};