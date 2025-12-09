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
const port = process.env.PORT || 3001;

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
        const model = genAIStatic.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

    ws.on('message', async (data) => {
        // console.log(`Received message from client. Type: ${typeof data}, Size: ${data.length}`);

        // --- 1. Handshake / Configuration Phase ---
        if (!geminiSession) {
            try {
                const strData = data.toString();
                const parsed = JSON.parse(strData);

                if (parsed.type === 'config' && parsed.systemInstruction) {
                    console.log('Received config. Connecting to Gemini with custom instructions...');
                    try {
                        geminiSession = await genAI.live.connect({
                            model: MODEL_NAME_LIVE,
                            config: {
                                responseModalities: [Modality.AUDIO],
                                inputAudioTranscription: {},
                                systemInstruction: {
                                    parts: [{ text: parsed.systemInstruction }]
                                },
                            },
                            callbacks: {
                                onopen: () => {
                                    console.log('Gemini Live session opened');
                                    ws.send(JSON.stringify({ type: 'server_ready' }));
                                },
                                onmessage: (newContent) => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        if (newContent.serverContent?.modelTurn) {
                                            return; // Mute AI audio for now (Analyst Mode)
                                        }
                                        ws.send(JSON.stringify(newContent));
                                    }
                                },
                                onclose: (event) => {
                                    console.log(`Gemini Live session closed: ${event.code} - ${event.reason}`);
                                    ws.close(1011, "Gemini Backend Closed");
                                },
                                onerror: (err) => {
                                    console.error('Gemini Live session error:', err.message || err);
                                }
                            }
                        });
                        console.log('Connected to Gemini Live');
                    } catch (error) {
                        console.error('Gemini connection error:', error);
                        ws.close(1011, 'Failed to connect to AI');
                    }
                } else {
                    console.log('Ignored message before config:', strData.substring(0, 50));
                }
            } catch (e) {
                // Ignore binary or malformed JSON during handshake
            }
            return;
        }

        // --- 2. Active Session Phase ---
        // Forward audio/text to Gemini
        try {
            // Attempt to parse as JSON first (Protocol: { audio: "base64" })
            const strData = data.toString();
            let isJson = false;
            try {
                const parsed = JSON.parse(strData); // Re-parsing is fine
                if (parsed.audio) {
                    await geminiSession.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: parsed.audio
                        }
                    });
                    isJson = true;
                    process.stdout.write('.');
                } else if (parsed.text) {
                    await geminiSession.send({
                        parts: [{ text: parsed.text }]
                    });
                    isJson = true;
                }
            } catch (e) {
                // Not JSON
            }

            if (!isJson && Buffer.isBuffer(data)) {
                const b64 = data.toString('base64');
                await geminiSession.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: b64
                    }
                });
            }
        } catch (e) {
            console.error('Error sending to Gemini:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // No explicit cleanup needed for geminiSession variable, GC handles it.
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
