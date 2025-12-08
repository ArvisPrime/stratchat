
import { createPcmBlob, encodeWAV, float32ToB64PCM } from '../utils/audioUtils';
import { ConnectionStatus, TranscriptEntry } from '../types';

interface LiveConnectionCallbacks {
  onStatusChange: (status: ConnectionStatus) => void;
  onTranscript: (entry: TranscriptEntry) => void;
  onAudioData: (id: string, audioBase64: string) => void;
  onError: (error: string) => void;
}

export class GeminiLiveService {
  private socket: WebSocket | null = null;
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

      // Connect to Backend WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`; // Proxy will handle this

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.handleOpen();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.socket.onerror = (e) => {
        console.error('WebSocket Error:', e);
        this.callbacks.onError('Connection error occurred.');
        this.callbacks.onStatusChange(ConnectionStatus.ERROR);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket closed code:', event.code);
        this.callbacks.onStatusChange(ConnectionStatus.DISCONNECTED);
        this.cleanup();

        // 1011 = Server error, 1006 = Abnormal closure
        if (event.code === 1011 || event.code === 1006) {
          this.attemptReconnect();
        } else {
          // Clean close, reset attempts
          this.reconnectAttempts = 0;
        }
      };

    } catch (err: any) {
      this.callbacks.onError(err.message || 'Failed to start session');
      this.callbacks.onStatusChange(ConnectionStatus.ERROR);
    }
  }

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Limit to 3 retries as requested

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError("Connection lost. Failed to reconnect after 3 attempts.");
      this.callbacks.onStatusChange(ConnectionStatus.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.callbacks.onStatusChange(ConnectionStatus.RECONNECTING); // Notify UI

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 5000);

    console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleOpen() {
    this.callbacks.onStatusChange(ConnectionStatus.CONNECTED);

    if (!this.inputAudioContext || !this.stream) return;

    // Send Debug Info to Server
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        debug: {
          sampleRate: this.inputAudioContext.sampleRate,
          userAgent: navigator.userAgent
        }
      }));
    }

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      // 1. Send to Backend (which proxies to Live API)
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Check for sample rate mismatch to prevent "chipmunk" audio
        if (this.inputAudioContext && this.inputAudioContext.sampleRate !== 16000) {
          console.warn('Sample rate mismatch:', this.inputAudioContext.sampleRate);
          // In a perfect world we would resample here. 
          // For now, let's rely on the fact that we asked for 16000.
        }

        // Send as JSON with Base64 to ensure clean transmission through the proxy
        const b64 = float32ToB64PCM(inputData);
        this.socket.send(JSON.stringify({ audio: b64 }));
      }

      // 2. Buffer locally for re-transcription
      const dataCopy = new Float32Array(inputData);
      this.audioChunks.push(dataCopy);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);

      // 1. Handle Input Transcription (User/Speaker)
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

      // 2. Handle Turn Complete
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
          if (this.audioChunks.length > 0) {
            const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const merged = new Float32Array(totalLength);
            let offset = 0;
            for (const chunk of this.audioChunks) {
              merged.set(chunk, offset);
              offset += chunk.length;
            }

            const wavBase64 = encodeWAV(merged);
            this.callbacks.onAudioData(this.currentTranscriptId, wavBase64);
            this.audioChunks = [];
          }

          this.currentTranscriptId = null;
          this.currentText = '';
          this.currentStartTime = null;
        } else {
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

      // 4. Handle Audio Output (Playback)
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
            // Base64 Audio
            const base64 = part.inlineData.data;
            this.playAudioChunk(base64);
          }
        }
      }

    } catch (e) {
      console.error("Error parsing WebSocket message", e);
    }
  }

  private nextPlayTime = 0;

  private async playAudioChunk(base64: string) {
    if (!this.inputAudioContext) return;

    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini returns PCM 24000Hz usually
      // But it comes as raw PCM in a WAV container or raw? 
      // The SDK usually sends "audio/pcm;rate=24000".
      // If it is raw PCM Int16:
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.inputAudioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.inputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.inputAudioContext.destination);

      const now = this.inputAudioContext.currentTime;
      // Schedule playback to be continuous
      const startTime = Math.max(now, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

    } catch (e) {
      console.error("Error playing audio chunk", e);
    }
  }

  disconnect() {
    this.socket?.close();
    this.cleanup();
  }

  private cleanup() {
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());

    // Don't close inputAudioContext if we are sharing it? 
    // Actually we created it, so we should close it, but maybe wait for playback?
    // For now, close it to stop everything.
    this.inputAudioContext?.close();
    this.inputAudioContext = null;

    this.stream = null;
    this.processor = null;
    this.source = null;
    this.socket = null;

    // Reset internal state
    this.currentTranscriptId = null;
    this.currentText = '';
    this.currentStartTime = null;
    this.audioChunks = [];
    this.nextPlayTime = 0;
  }
}