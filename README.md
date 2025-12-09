# StratChat - Real-time Conversation Coach

StratChat is a powerful, real-time conversation coaching application designed to help you navigate discussions, negotiations, and meetings with confidence. By leveraging the advanced capabilities of **Google's Gemini models**, StratChat provides live transcription, strategic suggestions, and deep analysis of your conversations.

Now transformed into a SaaS platform, StratChat offers secure user accounts and session persistence.

## 🚀 Key Features

- **Real-time Transcription**: Accurate, live transcription using Gemini Live.
- **AI Conversation Coach**: Real-time strategic suggestions to deepen engagement or gain leverage.
- **Smart Analysis**:
    - **Quick Summary**: Instant snapshot of the topic and speaker sentiment (Gemini Flash Lite).
    - **Deep Strategy**: Psychological motivation analysis and long-term strategy (Gemini 2.0 Pro).
- **User Accounts**: Secure Google Sign-In via Firebase Authentication.
- **Session History**: Save, browse, and review past coaching sessions and transcripts (Firestore).
- **Architecture**: Secure Backend-for-Frontend (BFF) proxy to protect API keys.
- **Performance**: Virtualized transcript rendering for handling long sessions.
- **Accessibility**: Optimized for screen readers and keyboard navigation.

## 🛠️ Technologies

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket (Native)
- **Cloud & DB**: Firebase (Authentication, Firestore)
- **AI**: Google GenAI SDK (Gemini Live, Flash Lite, Pro)
- **Testing**: Vitest, React Testing Library
- **Deployment**: GitHub Actions (CI/CD)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/))
- A Firebase Project ([Console](https://console.firebase.google.com/))

### 1. Configuration Setup
Create a `.env.local` file in the **root** directory with both Gemini and Firebase credentials:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_key_here

# Firebase Configuration (Get these from Project Settings)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
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
  - `components/`: UI components (`TranscriptView`, `SettingsDialog`, etc.).
  - `contexts/`: React Contexts (`AuthContext` for user state).
  - `lib/`: Configuration and library instances (`firebase.ts`).
  - `services/`: API services (`sessionService`, `userService`).
  - `hooks/`: Custom React hooks (`useGeminiSession`, `useTTS`).
- `.github/workflows/`: CI/CD pipeline configuration.
