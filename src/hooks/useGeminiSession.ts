import { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiLiveService } from '../services/geminiLive';
import { refineTranscript } from '../services/geminiStatic';
import { TranscriptEntry, ConnectionStatus, CoachSuggestion } from '../types';
import { saveSession } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface UseGeminiSessionProps {
    ttsEnabled: boolean;
    speakText: (text: string) => void;
    meetingTypeInstruction?: string;
}

export function useGeminiSession({ ttsEnabled, speakText, meetingTypeInstruction }: UseGeminiSessionProps) {
    const { user } = useAuth();
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
    const [startTime, setStartTime] = useState<Date | null>(null);

    const [useSystemAudio, setUseSystemAudio] = useState(false);
    const liveServiceRef = useRef<GeminiLiveService | null>(null);

    // Save session when stopping
    const handleSaveSession = useCallback(async () => {
        if (!user || transcript.length === 0 || !startTime) return;

        try {
            await saveSession(user.uid, {
                startTime,
                endTime: new Date(),
                transcript,
                suggestions,
                summary: 'Session summary pending...', // This could be updated later
                mood: 'Neutral' // Placeholder
            });
            toast.success('Session saved to history');
        } catch (e) {
            console.error('Failed to save session', e);
            toast.error('Failed to save session history');
        }
    }, [user, transcript, suggestions, startTime]);

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

    const connect = useCallback(async () => {
        try {
            setStatus(ConnectionStatus.CONNECTING);
            // Use passed instruction or default
            const defaultInstruction = "You are a silent listener. You are listening to a conversation to provide a transcript. DO NOT RESPOND. DO NOT SPEAK. Remain completely silent.";
            const finalInstruction = meetingTypeInstruction || defaultInstruction;

            await liveServiceRef.current?.connect({ instruction: finalInstruction, includeSystemAudio: useSystemAudio });

            setStatus(ConnectionStatus.CONNECTED);
            setStartTime(new Date());
            setTranscript([]);
            setSuggestions([]);

        } catch (e) {
            console.error(e);
            setStatus(ConnectionStatus.DISCONNECTED);
            toast.error("Failed to connect to AI Coach");
        }
    }, [useSystemAudio, meetingTypeInstruction]); // Added useSystemAudio to dependencies

    const toggleRecording = useCallback(async () => {
        if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
            // Start
            await connect(); // Call the new connect function
        } else if (status === ConnectionStatus.CONNECTED) {
            // Stop
            liveServiceRef.current?.disconnect();
            await handleSaveSession();
        }
    }, [status, connect, handleSaveSession]);

    const loadSession = useCallback((session: any) => { // Using any tmp to avoid Import cycle, but ideally SessionData
        if (status === ConnectionStatus.CONNECTED) {
            liveServiceRef.current?.disconnect();
        }
        setTranscript(session.transcript);
        setSuggestions(session.suggestions);
        setStartTime(session.startTime);
        setStatus(ConnectionStatus.DISCONNECTED); // Or a specific 'VIEWING' status if we want to differentiate
    }, [status]);

    return {
        status,
        transcript,
        suggestions,
        addSuggestion,
        toggleRecording,
        loadSession,
        isConnected: status === ConnectionStatus.CONNECTED,
        useSystemAudio,
        setUseSystemAudio
    };
}
