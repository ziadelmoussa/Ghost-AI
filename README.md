# Ghost AI

## Overview
Ghost AI is an autonomous proxy application designed to process natural language and voice input for scheduling, vendor curation, and payment execution. 

Current conversational interfaces lack the capability to execute multi-step commercial transactions autonomously. Ghost AI bridges this gap by acting as an intermediary between unstructured user requests and strict third-party supplier logistics. The application parses complex requests, maintains session context, and executes mock commercial transactions.

## Live Application & Evaluation Guide
You can run the application fully online using the live deployment. Please note that because the backend is hosted on Render's cloud infrastructure, it may take a brief moment to spin up and respond on initial load due to cold-start inactivity.

- **Live Frontend:** https://ghost-ai-vvqd.vercel.app/

**Important Evaluation Note:** The live application runs fully online out-of-the-box. If you prefer a completely local development setup, you can also run the FastAPI backend and React frontend locally by following the instructions below.

## Architecture & Tech Stack
The application utilizes a decoupled architecture, separating the client interface from a stateful transaction processing engine.

- **Frontend:** React / Vite (Web Speech API integration)
- **Backend:** Python / FastAPI (Stateful scenario engine, Server-Sent Events)
- **Payment Processing:** PayPal Developer REST API
- **State Management:** In-memory session tracking

## Core Capabilities
- **Voice Interface:** Processes dictated tasks via native client-side transcription (Web Speech API).
- **Stateful Engine:** Handles context-aware, multi-turn task routing for distinct scenarios (e.g., flight bookings, plumbing dispatch, groceries, utility bills).
- **Payment Integration:** Generates secure checkout sessions via the PayPal Developer Sandbox upon user confirmation.
- **Real-Time Polling:** Asynchronous polling from the React client to the FastAPI backend to verify and update transaction states.

---

## Local Backend Setup (Optional Alternative)

If you prefer running the backend processing engine locally for development or evaluation, please follow these steps.

### Prerequisites
- Python (3.9 or higher)
- Node.js (v18.0 or higher) - *Only required if running the frontend locally*
- PayPal Developer Sandbox Account (Client ID and Secret)

### Installation & Execution

**1. Clone the repository:**
```bash
git clone [https://github.com/ziadelmoussa/Ghost-AI.git](https://github.com/ziadelmoussa/Ghost-AI.git)
cd Ghost-AI
```

**2. Setup the FastAPI Backend:**
Navigate to the `backend` directory and configure the Python environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

**3. Configure Environment Variables:**
Create a `.env` file in the `backend` directory and add your PayPal Sandbox credentials:
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_API_BASE=[https://api-m.sandbox.paypal.com](https://api-m.sandbox.paypal.com)
```

**4. Start the Backend Server:**
Ensure you are in the `backend` directory, then execute:
```bash
uvicorn main:app --reload --port 8000
```

**5. Access the Application (Two Options):**

**Option A (Recommended):** Leave the backend running in your terminal and open the live frontend at `https://ghost-ai-vvqd.vercel.app/`. It will automatically connect to your local backend.

**Option B (Fully Local):** Open a new terminal window, navigate to the `frontend` directory, and start the local development server:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## Contributors
*Developed for the 2026 PayPal Hackathon*

- **Ziadelmoussa** — Lead Full-Stack Engineer (Architecture, UI/UX Design, Frontend React/Vite, Backend FastAPI Integration)
- **HussianYKB** — Backend Contributor (Payment logic & routing support)
- **Yaraabouali** — QA & Mobile Testing (iOS/Safari layout validation, PWA testing)