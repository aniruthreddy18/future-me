# FutureMe — Meet the version of you who already made it.

FutureMe is a premium, AI-powered personal reflection web application. Users enter details about their current goals, struggles, and ambitions, and the system uses the Gemini API to construct an emotional, intelligent, and highly actionable message from their future self. 

Built in **Aniruth's Founder Labs** with an Apple-style glassmorphism interface, this product also integrates a live interactive chat environment where users can converse directly with their newly established future identity, maintaining context and adapting advice to the chosen character tone.

---

## Features

1. **AI Reflection Engine**: Generates a future identity, next 3 tactical moves, one daily habit to start today, a future self warning, and a daily mantra.
2. **Four Distinct Tones**:
   - **Motivational**: Warm, inspiring, high energy, and deeply supportive.
   - **Brutally Honest**: Direct, sharp, zero-excuses, and grounded in absolute reality.
   - **Calm Mentor**: Peaceful, wise, patient, grounded, and encouraging.
   - **CEO Mode**: Strategic, metrics-oriented, macro architect, and optimized for speed.
3. **Live Interactive Dialogue**: Reveal an active communication portal where you chat directly with your future identity. Previous conversation history is automatically maintained in the context of subsequent responses.
4. **Instant Clipboard Sharing**: Click to aggregate your complete reflection report and copy it as a structured card (complete with micro toast feedback).
5. **Secure Backend proxy**: Keeps your Gemini API key hidden behind a Node.js reverse-proxy.

---

## Project Structure

```
futureme/
  frontend/
    index.html     # Premium structure and forms
    style.css      # Custom animations, glassmorphism cards, & scrollbar styling
    script.js      # Dynamic fetch API integration, clipboard management, & chat states
  backend/
    server.js      # Express API proxy integrating Google Generative AI SDK
    package.json   # Node module configurations and dependency script keys
    .env           # Secured environment variables (ignored in version control)
    .env.example   # Configuration template for deployments
  README.md        # Technical execution instructions
```

---

## Installation & Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
- Node.js (version 18 or above recommended)
- A modern web browser

---

### Step 1: Install Backend Dependencies

Navigate to the `backend` directory and install the necessary npm modules:

```bash
cd backend
npm install
```

This installs `express` (routing), `cors` (enabling requests from local static files), `dotenv` (managing environmental keys), and `@google/generative-ai` (Gemini API SDK).

---

### Step 2: Configure Environment Variables

The backend relies on a `.env` file to fetch the API key safely. A pre-configured key is provided:

Create a `.env` file under the `backend` directory if not present:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5001
```

*Note: For security reasons, the `.env` file should never be committed to repository codebases.*

---

### Step 3: Run the Backend Server

To start the server, execute:

```bash
npm run dev
```

The Express server will start up and listen on port `5001`:
`FutureMe backend listening at http://localhost:5001`

---

### Step 4: Launch the Frontend

Open `/futureme/frontend/index.html` directly in your web browser. You can:
1. Double-click `index.html` from your file explorer.
2. Serve it using a simple local static server (e.g., Live Server in VS Code, or python server: `python -m http.server 8000` from the `frontend` folder).

---

## API Documentation

### 1. POST `/api/generate-futureme`

Generates the core reflection profile card.

- **Request Body**:
```json
{
  "name": "Nitish",
  "age": 23,
  "goal": "Build a successful AI startup",
  "struggle": "Lack of consistency",
  "oneYearVision": "Running a profitable AI company",
  "tone": "Brutally Honest"
}
```

- **Response Body**:
```json
{
  "success": true,
  "data": {
    "message": "A powerful 120-180 word message from the future self...",
    "futureIdentity": "A concise description of who the user is becoming...",
    "nextMoves": [
      "Action 1",
      "Action 2",
      "Action 3"
    ],
    "habit": "One small daily habit to start today...",
    "warning": "One mistake the future self warns about...",
    "mantra": "A short memorable line to repeat daily..."
  }
}
```

---

### 2. POST `/api/chat-futureme`

Handles live multi-turn follow-up conversations with the future self.

- **Request Body**:
```json
{
  "userProfile": {
    "name": "Nitish",
    "age": 23,
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  },
  "chatHistory": [
    {
      "role": "futureme",
      "message": "Hello, Nitish. I am the version of you who successfully..."
    },
    {
      "role": "user",
      "message": "Will I actually make it?"
    }
  ],
  "question": "What should I focus on this week?"
}
```

- **Response Body**:
```json
{
  "success": true,
  "reply": "Only if your daily actions stop negotiating with your dreams. Remove distractions..."
}
```
