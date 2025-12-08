# StratChat - Real-time Conversation Coach

StratChat is a powerful, real-time conversation coaching application designed to help you navigate discussions, negotiations, and meetings with confidence. By leveraging the advanced capabilities of **Google's Gemini models**, StratChat provides live transcription, strategic suggestions, and deep analysis of your conversations.

## 🚀 Key Features

- **Real-time Transcription**: Accurate, live transcription using Gemini Live.
- **AI Conversation Coach**: Real-time strategic suggestions to deepen engagement or gain leverage.
- **Transcript Analysis**:
    - **Quick Summary**: Instant snapshot of the topic and speaker sentiment (Gemini Flash Lite).
    - **Deep Strategy**: Psychological motivation analysis and long-term strategy (Gemini 2.0 Pro).
- **Architecture**: Secure Backend-for-Frontend (BFF) proxy to protect API keys.
- **Performance**: Virtualized transcript rendering for handling long sessions.
- **Accessibility**: optimized for screen readers and keyboard navigation.

## 🛠️ Technologies

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket (Native)
- **AI**: Google GenAI SDK
- **Testing**: Vitest, React Testing Library
- **Deployment**: GitHub Actions (CI/CD)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/))

### 1. Security Setup
Create a `.env.local` file in the **root** directory (NOT inside `/server`):
```env
# Root directory .env.local
GEMINI_API_KEY=your_key_here
```

### 2. Install Dependencies
You need to install dependencies for both the frontend and the backend server.

```bash
# Install frontend deps
npm install

# Install backend deps
cd server && npm install
cd ..
```

### 3. Running the App
For the app to work, **both** the backend server and the frontend client must be running.

**Step 1: Start the Backend Server**
```bash
# In a new terminal
cd server
npm start
# Server listens on port 3001
```

**Step 2: Start the Frontend Client**
```bash
# In the root terminal
npm run dev
# Vite runs on http://localhost:3000
```
Open [http://localhost:3000](http://localhost:3000) to use the app.

## ✅ Testing & Quality

We prioritize stability and code quality.

### Unit Tests
Run the test suite using Vitest:
```bash
npm test
```

### Type Checking
Verify TypeScript types:
```bash
npm run typecheck
```
## 🏗️ Project Structure

- `server/`: Node.js Express server to handle API requests and WebSocket proxy.
- `src/`: React Frontend source code.
  - `components/`: UI components (`TranscriptView` with virtualization, `ErrorBoundary`, etc.).
  - `services/`: API integration services (refactored to call local backend).
  - `hooks/`: Custom React hooks (`useGeminiSession`, `useTTS`).
- `.github/workflows/`: CI/CD pipeline configuration.
