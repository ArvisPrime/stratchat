
export interface TranscriptEntry {
  id: string;
  timestamp: Date;
  lastUpdated?: Date; // Tracks when the last text chunk was received for latency detection
  speaker: 'user' | 'ai' | 'speaker'; // 'speaker' is the person being recorded, 'ai' is the coach
  text: string;
  isFinal?: boolean; // True if the turn is complete, false if streaming
  isRefined?: boolean; // True if the text has been corrected by the secondary audio pass
}

export interface CoachSuggestion {
  id: string;
  timestamp: Date;
  text: string;
  type: 'auto' | 'manual';
}

export type SentimentType = 'Positive' | 'Neutral' | 'Negative' | 'Tense' | 'Constructive';

export interface AnalysisResult {
  summary: string;
  sentiment: SentimentType;
  emoji: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting', // New status
  ERROR = 'error'
}