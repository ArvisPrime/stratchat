import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const PORT = 3001;
const MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025'; // Back to Native to avoid Quota issues

console.log('=== STARTING SIMPLE RELAY ===');
console.log(`Model: ${MODEL}`);
console.log(`Port: ${PORT}`);

const wss = new WebSocketServer({ port: PORT, path: '/ws' });
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

wss.on('connection', async (ws) => {
    console.log('Client connected.');

    let session = null;

    try {
        console.log('Connecting to Gemini...');
        session = await genAI.live.connect({
            model: MODEL,
            config: {
                // MATCHING GOLDEN POC CONFIGURATION
                responseModalities: [Modality.AUDIO], // Audio ONLY
                inputAudioTranscription: {},  // Empty object as per POC (enables it)
                systemInstruction: {
                    parts: [{ text: "You are a helpful assistant. Echo back what you hear. Be brief." }]
                }
            },
            callbacks: {
                onopen: () => console.log('✅ Gemini Session OPEN'),
                onclose: (e) => console.log(`❌ Gemini Session CLOSED: ${e.code} ${e.reason}`),
                onmessage: (msg) => {
                    console.log('📩 Received from Gemini:', JSON.stringify(msg).substring(0, 100)); // Log first 100 chars
                    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
                },
                onerror: (e) => console.error('⚠️ Gemini Error:', e)
            }
        });
        console.log('Gemini wrapper created.');

        // NOW safe to inspect session
        console.log('📋 Session Keys:', Object.keys(session));

        // Removed failing Probe to focus on Audio fix
    } catch (e) {
        console.error('Fatal connection error:', e);
        ws.close(1011, 'Init Failed');
        return;
    }

    ws.on('message', async (data) => {
        if (!session) return;
        try {
            const str = data.toString();
            const parsed = JSON.parse(str);

            if (parsed.debug) {
                console.log('🐞 CLIENT DEBUG:', parsed.debug);
                return;
            }

            if (parsed.audio) {
                process.stdout.write('.'); // Visible heartbeat for audio

                // FIXED: Use "media" wrapper to match POC exactly
                await session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: parsed.audio
                    }
                });
            } else if (parsed.text) {
                console.log(`\nSent text: ${parsed.text}`);
                await session.send({ parts: [{ text: parsed.text }] });
            }
        } catch (e) {
            console.error('Send Error:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
        // session.close(); // Not exposed in all SDK versions, usually auto-closes
    });
});
