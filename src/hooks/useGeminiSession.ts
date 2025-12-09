import { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiLiveService } from '../services/geminiLive';
import { refineTranscript } from '../services/geminiStatic';
import { TranscriptEntry, ConnectionStatus, CoachSuggestion } from '../types';

interface UseGeminiSessionProps {
    ttsEnabled: boolean;
    speakText: (text: string) => void;
}

export function useGeminiSession({ ttsEnabled, speakText }: UseGeminiSessionProps) {
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);

    const [useSystemAudio, setUseSystemAudio] = useState(false);
    const liveServiceRef = useRef<GeminiLiveService | null>(null);

    const addSuggestion = useCallback((text: string, type: 'auto' | 'manual') => {
        setSuggestions(prev => [...prev, {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            text,
            type
        }]);

        if (ttsEnabled) {
            speakText(text);
        }
    }, [ttsEnabled, speakText]);

    useEffect(() => {
        liveServiceRef.current = new GeminiLiveService({
            onStatusChange: setStatus,
            onTranscript: (entry) => {
                if (entry.speaker === 'ai') {
                    if (!entry.text) return;
                    addSuggestion(entry.text, 'auto');
                } else {
                    setTranscript(prev => {
                        const index = prev.findIndex(t => t.id === entry.id);
                        if (index !== -1) {
                            const newArr = [...prev];
                            const existing = newArr[index];
                            newArr[index] = { ...entry, isRefined: existing.isRefined };
                            return newArr;
                        } else {
                            return [...prev, entry];
                        }
                    });
                }
            },
            onAudioData: async (id, audioBase64) => {
                try {
                    const refinedText = await refineTranscript(audioBase64);
                    if (refinedText) {
                        setTranscript(prev => {
                            const index = prev.findIndex(t => t.id === id);
                            if (index !== -1) {
                                const newArr = [...prev];
                                newArr[index] = {
                                    ...newArr[index],
                                    text: refinedText,
                                    isRefined: true
                                };
                                return newArr;
                            }
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error("Failed to refine transcript", e);
                }
            },
            onError: (msg) => {
                console.error(msg);
            }
        });

        return () => {
            liveServiceRef.current?.disconnect();
        };
    }, [addSuggestion]);

    const toggleRecording = useCallback(() => {
        if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
            liveServiceRef.current?.connect({ includeSystemAudio: useSystemAudio });
        } else if (status === ConnectionStatus.CONNECTED) {
            liveServiceRef.current?.disconnect();
        }
    }, [status, useSystemAudio]);

    return {
        status,
        transcript,
        suggestions,
        addSuggestion,
        toggleRecording,
        isConnected: status === ConnectionStatus.CONNECTED,
        useSystemAudio,
        setUseSystemAudio
    };
}
