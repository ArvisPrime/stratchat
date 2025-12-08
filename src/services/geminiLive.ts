
import { createPcmBlob, encodeWAV } from '../utils/audioUtils';
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
  private maxReconnectAttempts = 5;

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError("Failed to reconnect after multiple attempts.");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleOpen() {
    this.callbacks.onStatusChange(ConnectionStatus.CONNECTED);

    if (!this.inputAudioContext || !this.stream) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      // 1. Send to Backend (which proxies to Live API)
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send raw PCM data as binary
        // Create a copy of the buffer because inputBuffer is reused
        const bufferCopy = new Float32Array(inputData);
        this.socket.send(bufferCopy.buffer);
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
    } catch (e) {
      console.error("Error parsing WebSocket message", e);
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
  }
}