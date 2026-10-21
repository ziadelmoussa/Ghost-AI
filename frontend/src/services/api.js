const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const sendTaskRequest = async (prompt) => {
    try {
        const response = await fetch(`${API_BASE_URL}/process-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error communicating with backend:", error);
        throw error;
    }
};

export const sendCheckoutRequest = async (amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cart_total: amount }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating checkout:", error);
        throw error;
    }
};