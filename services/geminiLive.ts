import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, encodeWAV } from '../utils/audioUtils';
import { ConnectionStatus, TranscriptEntry } from '../types';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

interface LiveConnectionCallbacks {
  onStatusChange: (status: ConnectionStatus) => void;
  onTranscript: (entry: TranscriptEntry) => void;
  onAudioData: (id: string, audioBase64: string) => void; // New callback for completed audio turns
  onError: (error: string) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private callbacks: LiveConnectionCallbacks;

  // Track partial transcripts state
  private currentTranscriptId: string | null = null;
  private currentText: string = '';
  private currentStartTime: Date | null = null;
  
  // Buffer for raw audio to support re-transcription
  private audioChunks: Float32Array[] = [];

  constructor(callbacks: LiveConnectionCallbacks) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.callbacks = callbacks;
  }

  async connect() {
    try {
      this.callbacks.onStatusChange(ConnectionStatus.CONNECTING);

      // Initialize Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000, // Required for Live API input
      });

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = this.ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onerror: (e) => {
            console.error('Live API Error:', e);
            this.callbacks.onError('Connection error occurred.');
            this.callbacks.onStatusChange(ConnectionStatus.ERROR);
          },
          onclose: () => {
            this.callbacks.onStatusChange(ConnectionStatus.DISCONNECTED);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO], 
          inputAudioTranscription: {}, // Enable user transcription
          outputAudioTranscription: {}, // Enable model transcription
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
      });
    } catch (err: any) {
      this.callbacks.onError(err.message || 'Failed to start session');
      this.callbacks.onStatusChange(ConnectionStatus.ERROR);
    }
  }

  private handleOpen() {
    this.callbacks.onStatusChange(ConnectionStatus.CONNECTED);
    
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // 1. Send to Live API
      const pcmBlob = createPcmBlob(inputData);
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });

      // 2. Buffer locally for re-transcription
      // We must copy the data because inputBuffer is reused
      const dataCopy = new Float32Array(inputData);
      this.audioChunks.push(dataCopy);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private handleMessage(message: LiveServerMessage) {
    // 1. Handle Input Transcription (User/Speaker) - STREAMING
    if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        if (text) {
             if (!this.currentTranscriptId) {
                 this.currentTranscriptId = crypto.randomUUID();
                 this.currentStartTime = new Date();
                 this.currentText = '';
             }
             
             this.currentText += text;
             
             // Emit immediate update
             this.callbacks.onTranscript({
                 id: this.currentTranscriptId,
                 timestamp: this.currentStartTime!,
                 lastUpdated: new Date(),
                 speaker: 'speaker',
                 text: this.currentText,
                 isFinal: false
             });
        }
    }

    // 2. Handle Turn Complete (Commit the transcript & Trigger Refinement)
    if (message.serverContent?.turnComplete) {
        if (this.currentTranscriptId && this.currentText) {
            // Emit final update for the UI
            this.callbacks.onTranscript({
                id: this.currentTranscriptId,
                timestamp: this.currentStartTime || new Date(),
                lastUpdated: new Date(),
                speaker: 'speaker',
                text: this.currentText,
                isFinal: true,
                isRefined: false
            });
            
            // 3. Process Audio Buffer for Refinement
            // Compile accumulated audio chunks into a WAV file
            if (this.audioChunks.length > 0) {
                const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                const merged = new Float32Array(totalLength);
                let offset = 0;
                for (const chunk of this.audioChunks) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }
                
                // Encode to WAV base64
                const wavBase64 = encodeWAV(merged);
                
                // Emit audio data for parallel processing
                this.callbacks.onAudioData(this.currentTranscriptId, wavBase64);
                
                // Reset audio buffer
                this.audioChunks = [];
            }
            
            // Reset state for next turn
            this.currentTranscriptId = null;
            this.currentText = '';
            this.currentStartTime = null;
        } else {
            // If turn completes but no text was captured (or very short), we still might want to clear buffer to prevent leakage
            this.audioChunks = [];
        }
    }

    // 3. Handle Output Transcription (The AI Coach)
    if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        if (text) {
            this.callbacks.onTranscript({
                id: crypto.randomUUID(), 
                timestamp: new Date(),
                lastUpdated: new Date(),
                speaker: 'ai',
                text: text.trim(),
                isFinal: true
            });
        }
    }
  }

  disconnect() {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close());
    }
    
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();

    this.sessionPromise = null;
    this.inputAudioContext = null;
    this.stream = null;
    this.processor = null;
    this.source = null;
    this.callbacks.onStatusChange(ConnectionStatus.DISCONNECTED);
    
    // Reset internal state
    this.currentTranscriptId = null;
    this.currentText = '';
    this.currentStartTime = null;
    this.audioChunks = [];
  }
}