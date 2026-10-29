# Ghost AI — The Autonomous Errand Assistant

## Overview
**Ghost AI** is an autonomous, stateful procurement proxy that processes natural language and voice input to execute scheduling, vendor curation, and payment processing entirely hands-free.

Current conversational interfaces lack the capability to execute multi-step commercial transactions autonomously. Ghost AI bridges this gap by acting as an intermediary between unstructured user requests and strict third-party supplier logistics. Built with a premium, glassmorphic UI and a robust stateful engine, it drastically reduces the cognitive load of daily errands, bookings, and inventory procurement.

## Architecture & Tech Stack
The application utilizes a decoupled architecture, separating a highly polished client interface from a state-aware transaction processing engine.

- **Frontend:** React / Vite (Glassmorphism UI, Ambient Gradients, Web Speech API)
- **Backend:** Python / FastAPI (Stateful scenario engine, Server-Sent Events)
- **Voice Engine:** Native Web Speech API (Client-side transcription)
- **Payment Processing:** PayPal Developer REST API (Live status polling)
- **State Management:** In-memory dictionary mapped to unique session IDs

## Core Capabilities
- **Voice-Native Interface:** Users can dictate complex tasks naturally without typing, visualized with real-time audio reactivity.
- **Stateful Scenario Engine:** Context-aware, multi-turn task handling (e.g., flight bookings, plumbing dispatch, groceries, utility bills).
- **Frictionless Mock Checkout:** Generates secure checkout sessions via the PayPal Developer Sandbox upon user confirmation.
- **Real-Time Polling:** The React frontend polls the FastAPI backend, seamlessly transitioning from checkout to an animated Apple Wallet-style receipt upon payment success.

## Getting Started

### Prerequisites
- Python (3.9 or higher)
- Node.js (v18.0 or higher)
- PayPal Developer Sandbox Account (Client ID and Secret)

### Installation

**1. Clone the repository:**
```bash
git clone [https://github.com/your-username/Ghost-AI.git](https://github.com/your-username/Ghost-AI.git)
cd Ghost-AI
```

**2. Setup the FastAPI Backend:**
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

**3. Configure Environment Variables:**
Create a `.env` file in the `backend` directory and add your PayPal Sandbox keys:
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_API_BASE=[https://api-m.sandbox.paypal.com](https://api-m.sandbox.paypal.com)
```

**4. Start the Backend Server:**
While still in the `backend` directory, run:
```bash
uvicorn main:app --reload --port 8000
```

**5. Setup and Start the React Frontend:**
Open a new terminal window and navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser to interact with Ghost AI.

## Contributors
*Developed for the 2026 PayPal Hackathon*

- **Ziadelmoussa** — Lead Full-Stack Engineer (Architecture, UI/UX Design, Frontend React/Vite, Backend FastAPI Integration)
- **HussainYKB** — Backend Contributor (Payment logic & routing support)