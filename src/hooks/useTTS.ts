import { useCallback } from 'react';

export function useTTS() {
    const speakText = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
    }, []);

    return { speakText };
}
