# StratChat - Real-time Conversation Coach

StratChat is a powerful, real-time conversation coaching application designed to help you navigate discussions, negotiations, and meetings with confidence. By leveraging the advanced capabilities of Google's Gemini models, StratChat provides live transcription, strategic suggestions, and deep analysis of your conversations.

## Features

- **Real-time Transcription**: Accurate, live transcription of your conversation using the Gemini Live service.
- **AI Conversation Coach**: Receive real-time, strategic suggestions and questions to ask during the conversation to deepen engagement or gain leverage.
- **Transcript Analysis**:
    - **Quick Summary**: Get a snapshot of the conversation and the speaker's emotional sentiment using Gemini Flash Lite.
    - **Deep Strategy**: Utilize Gemini 3 Pro to analyze underlying psychological motivations and suggest long-term strategies.
- **Transcript Refinement**: Automatically re-processes audio chunks to correct and refine the transcript for higher accuracy.
- **Text-to-Speech**: Listen to the AI's suggestions.
- **Export**: Download the full transcript of your session.
- **Dark/Light Mode**: Toggle between themes for comfortable viewing.
- **Responsive Design**: Optimized for both desktop and mobile use.

## Technologies Used

- **Frontend**: React, Vite, TypeScript
- **AI**: Google GenAI SDK (Gemini 2.5 Flash, Gemini Flash Lite, Gemini 3 Pro)
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React

## Prerequisites

- Node.js installed on your machine.
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd stratchat
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up your environment variables:
    - Create a `.env.local` file in the root directory.
    - Add your Gemini API Key:
      ```env
      GEMINI_API_KEY=your_api_key_here
      ```
    *(Note: The `vite.config.ts` is configured to expose `GEMINI_API_KEY` as `process.env.API_KEY` to the client).*

## Usage

1.  Start the development server:
    ```bash
    npm run dev
    ```

2.  Open your browser and navigate to the URL provided (usually `http://localhost:3000`).

3.  **Connect**: Click the microphone button to start the session.
4.  **Speak**: Start your conversation. The app will transcribe it in real-time.
5.  **Receive Coaching**: Watch the "Strategy" tab for live suggestions.
6.  **Analyze**:
    - Use "Quick Summary" for an immediate overview.
    - Use "Deep Strategy" for a more in-depth analysis.
7.  **Export**: Click "Export Session" to download the transcript.

## Project Structure

- `src/App.tsx`: Main application component.
- `src/components/`: UI components (TranscriptView, CoachView, AnalysisPanel, etc.).
- `src/services/`: AI integration services (`geminiLive.ts`, `geminiStatic.ts`).
- `src/utils/`: Utility functions.
