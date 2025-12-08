import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
const genAIStatic = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';

// --- Static Endpoints ---

app.post('/api/summary', async (req, res) => {
    try {
        const { text } = req.body;
        const model = genAIStatic.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' });
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
        const model = genAIStatic.getGenerativeModel({ model: 'gemini-2.0-pro-exp-02-05' });
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
        const model = genAIStatic.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
        const model = genAIStatic.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
                // VERIFIED CONFIGURATION (From simple-server.js diagnostics)
                responseModalities: [Modality.AUDIO], // Native model supports AUDIO only output for now
                inputAudioTranscription: {}, // Explicitly enable user transcription with empty object
                systemInstruction: {
                    parts: [{ text: "You are a silent listener. You are listening to a conversation to provide a transcript. DO NOT RESPOND. DO NOT SPEAK. Remain completely silent." }]
                },
            },
            callbacks: {
                onopen: () => {
                    console.log('Gemini Live session opened');
                },
                onmessage: (newContent) => {
                    // Forward Gemini events to Client, BUT FILTER OUT AI AUDIO
                    if (ws.readyState === WebSocket.OPEN) {
                        try {
                            // Check if this is an AI Turn (Audio/Text response)
                            if (newContent.serverContent?.modelTurn) {
                                // MUTE THE AI: Do not forward modelTurn to client.
                                // We only want 'inputTranscription' (User's speech text) 
                                // and 'turnComplete' (End of turn signals).
                                // console.log('🤫 Muted AI response');
                                return;
                            }

                            // Forward everything else (like inputTranscription)
                            ws.send(JSON.stringify(newContent));
                        } catch (e) {
                            console.error('Error forwarding message:', e);
                        }
                    }
                },
                onclose: (event) => {
                    console.log('Gemini Live session closed', event);
                    // CRITICAL: Close the client connection so it knows to reconnect
                    ws.close(1011, "Gemini Backend Closed");
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
        console.log(`Received message from client. Type: ${typeof data}, IsBuffer: ${Buffer.isBuffer(data)}, Size: ${data.length}`);
        if (geminiSession) {
            try {
                // Attempt to parse as JSON first (Protocol: { audio: "base64" })
                const strData = data.toString();
                let isJson = false;
                try {
                    const parsed = JSON.parse(strData);
                    if (parsed.audio) {
                        // VERIFIED FIX: Wrap in `media` object
                        await geminiSession.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=16000',
                                data: parsed.audio
                            }
                        });
                        isJson = true;
                        process.stdout.write('.'); // Heartbeat
                        // console.log('Sent audio chunk (JSON) to Gemini');
                    } else if (parsed.text) {
                        await geminiSession.send({
                            parts: [{ text: parsed.text }]
                        });
                        isJson = true;
                        console.log('Sent text message to Gemini:', parsed.text);
                    }
                } catch (e) {
                    // Not valid JSON, proceed to binary handling
                }

                if (!isJson && Buffer.isBuffer(data)) {
                    // Fallback to raw binary (Protocol: Float32/Int16 raw bytes)
                    // Convert Buffer to base64
                    const b64 = data.toString('base64');
                    // VERIFIED FIX: Wrap in `media` object
                    await geminiSession.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: b64
                        }
                    });
                    console.log('Sent audio chunk (Binary) to Gemini');
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
