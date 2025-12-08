import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';

// Load environment variables from the root .env.local
dotenv.config({ path: '../.env.local' });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';

// --- Static Endpoints ---

app.post('/api/summary', async (req, res) => {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' });
        const prompt = `
      Analyze the following transcript of a conversation.
      Provide a "Quick Summary" (2-3 sentences max) capturing the core topic.
      Then, determine the overall "Emotional Mood" of the user/speaker (e.g., Anxious, Confident, Defensive).
      
      Format the output EXACTLY like this JSON:
      {
        "summary": "...",
        "mood": "..."
      }
      
      Transcript:
      ${text}
    `;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        // Clean markdown code blocks if present
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/strategy', async (req, res) => {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-pro-exp-02-05' });
        const prompt = `
      You are a high-level negotiation and communication strategist.
      Analyze the transcript below.
      Identify hidden motivations, psychological leverage points, and suggest a long-term strategy.
      
      Output in Markdown format.
      
      Transcript:
      ${text}
    `;
        const result = await model.generateContent(prompt);
        res.json({ strategy: result.response.text() });
    } catch (error) {
        console.error('Strategy error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/question', async (req, res) => {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
      Based on this recent conversation snippet, generate ONE high-impact strategic question the user can ask to take control or deepen understanding.
      Snippet: ${text}
    `;
        const result = await model.generateContent(prompt);
        res.json({ question: result.response.text() });
    } catch (error) {
        console.error('Question error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/refine', async (req, res) => {
    try {
        const { audio } = req.body; // Expecting base64 WAV
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Convert base64 to parts
        const parts = [{
            inlineData: {
                mimeType: 'audio/wav',
                data: audio
            }
        }, {
            text: `
        Please transcribe the spoken audio exactly. 
        Correct any obvious phonetic misinterpretations.
        Return ONLY the text.
        `
        }];

        const result = await model.generateContent({
            contents: [{ role: 'user', parts }]
        });

        res.json({ text: result.response.text() });
    } catch (error) {
        console.error('Refine error:', error);
        res.status(500).json({ error: error.message });
    }
});


// --- WebSocket Server (Live Relay) ---

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws) => {
    console.log('Client connected to WebSocket');

    let geminiSession = null;

    try {
        geminiSession = await genAI.live.connect({
            model: MODEL_NAME_LIVE,
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: `
          You are a silent strategic conversation partner. 
          You are listening to a conversation through the user's microphone.
          
          Do NOT respond to everything. Do NOT be conversational.
          Wait for significant chunks of information. 
          
          When you detect a pause or a good moment for the user to interject, provide a "Strategic Question" the user can ask to deepen the engagement.
          Keep your responses VERY short. Only the question.
          Example output: "Ask: How did that make you feel regarding the timeline?"
          
          If the conversation is flowing well, remain silent.
        `,
            },
            callbacks: {
                onopen: () => {
                    console.log('Gemini Live session opened');
                },
                onmessage: (newContent) => {
                    // Forward Gemini events to Client
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(newContent));
                    }
                },
                onclose: () => {
                    console.log('Gemini Live session closed');
                },
                onerror: (err) => {
                    console.error('Gemini Live session error:', err);
                }
            }
        });

        console.log('Connected to Gemini Live');
    } catch (error) {
        console.error('Gemini connection error:', error);
        ws.close(1011, 'Failed to connect to AI');
        return;
    }

    ws.on('message', async (data) => {
        // Client sends audio data (Blob/Buffer)
        // We forward detailed media chunks to Gemini
        if (geminiSession) {
            try {
                // Expecting JSON message wrapping the audio or raw bytes?
                // To match the client impl, let's assume client sends JSON with base64 OR raw binary
                // Simplest is client sends the same payload struct `{"realtimeInput": {"media": {"mimeType":..., "data":...}}}`
                // But client currently uses `session.sendRealtimeInput`.
                // We will implement a custom protocol.
                // Protocol:
                // 1. Binary message = Audio PCM data
                // 2. Text message = Control/Config (not used yet)

                // However, `ws` receives Buffer for binary.
                if (Buffer.isBuffer(data)) {
                    // Convert Buffer to base64
                    const b64 = data.toString('base64');
                    await geminiSession.sendRealtimeInput({
                        mimeType: 'audio/pcm;rate=16000',
                        data: b64
                    });
                } else {
                    // Maybe text data?
                    const str = data.toString();
                    const parsed = JSON.parse(str);
                    if (parsed.audio) {
                        await geminiSession.sendRealtimeInput({
                            mimeType: 'audio/pcm;rate=16000',
                            data: parsed.audio
                        });
                    }
                }
            } catch (e) {
                console.error('Error sending to Gemini:', e);
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (geminiSession) {
            // Check if there is a close method or we just let it drift
            // The SDK doesn't expose a clean close on the session object easily in docs, 
            // but looking at source, it handles cleanup.
        }
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
