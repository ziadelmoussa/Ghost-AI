# The Invisible Assistant

## Overview
An autonomous procurement agent that processes natural language input to execute scheduling, vendor negotiation, and payment processing. 

Current conversational interfaces lack the capability to execute multi-step commercial transactions autonomously. The Invisible Assistant bridges this gap by acting as an intermediary between unstructured user requests and strict third-party supplier logistics, reducing the cognitive load and time expenditure of daily errands and B2B inventory procurement.

## Architecture
The application utilizes a decoupled architecture to separate the user interface from the transaction processing logic.

- **Frontend:** React / Next.js
- **Backend:** Node.js (Express) / Python (FastAPI)
- **Natural Language Processing:** OpenAI / Anthropic (via strict function calling)
- **Transaction Processing:** PayPal Developer REST API
- **Data Persistence:** Local JSON / SQLite 

## Core Capabilities
- **Autonomous Logic:** Parses natural language to generate functional cart payloads and independently navigates time-slot conflicts with mock supplier data.
- **Secure Payment Integration:** Generates secure checkout sessions via the PayPal Developer Sandbox upon user confirmation. 
- **Contextual Camouflage:** Generates context-appropriate, human-like communications for interactions with third-party vendors.

## Getting Started

### Prerequisites
- Node.js (v18.0 or higher) or Python (3.10 or higher)
- PayPal Developer Sandbox Account 
- OpenAI / Anthropic API Key

### Installation

**1. Clone the repository:**
`git clone https://github.com/your-username/The-Invisible-Assistant.git`

**2. Navigate to the backend directory and install dependencies:**
`cd backend && npm install`

**3. Set up your environment variables:**
Create a `.env` file in the `backend` directory and add the following keys:
`PAYPAL_CLIENT_ID=your_client_id`
`PAYPAL_CLIENT_SECRET=your_client_secret`
`OPENAI_API_KEY=your_api_key`

**4. Start the development server:**
`npm run dev`

## Contributors
- Ziadelmoussa - Backend Architecture & Payment Integration
- [Friend 1 GitHub Username] - Frontend Development
- [Friend 2 GitHub Username] - AI/Data Engineering
   
