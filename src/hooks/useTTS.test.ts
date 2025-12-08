import { renderHook } from '@testing-library/react';
import { useTTS } from './useTTS';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTTS', () => {
    const speakMock = vi.fn();
    const cancelMock = vi.fn();
    const getVoicesMock = vi.fn();

    beforeEach(() => {
        // Mock window.speechSynthesis
        const mockSpeechSynthesis = {
            speak: speakMock,
            cancel: cancelMock,
            getVoices: getVoicesMock,
            onvoiceschanged: null,
            paused: false,
            pending: false,
            speaking: false,
            pause: vi.fn(),
            resume: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        };

        // Assign mock to window
        Object.defineProperty(window, 'speechSynthesis', {
            value: mockSpeechSynthesis,
            writable: true,
        });

        // Mock SpeechSynthesisUtterance as a class
        global.SpeechSynthesisUtterance = class {
            text: string;
            voice: any;
            rate: number;
            volume: number;
            constructor(text: string) {
                this.text = text;
                this.voice = null;
                this.rate = 1;
                this.volume = 1;
            }
        } as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should speak text using the preferred voice if available', () => {
        const mockVoices = [
            { name: 'Google US English', lang: 'en-US', default: true },
            { name: 'Other Voice', lang: 'en-GB', default: false },
        ];
        getVoicesMock.mockReturnValue(mockVoices);

        const { result } = renderHook(() => useTTS());
        result.current.speakText('Hello world');

        expect(cancelMock).toHaveBeenCalled();

        // Verify that speak was called with an utterance containing the correct voice
        const speakArg = speakMock.mock.calls[0][0];
        expect(speakArg).toBeInstanceOf(global.SpeechSynthesisUtterance);
        expect(speakArg.text).toBe('Hello world');
        expect(speakArg.voice).toEqual(mockVoices[0]);
        expect(speakArg.rate).toBe(1.1);
        expect(speakArg.volume).toBe(0.8);
    });

    it('should fallback to first voice if preferred voice is not found', () => {
        const mockVoices = [
            { name: 'Other Voice', lang: 'en-GB', default: false },
        ];
        getVoicesMock.mockReturnValue(mockVoices);

        const { result } = renderHook(() => useTTS());
        result.current.speakText('Hello world');

        const speakArg = speakMock.mock.calls[0][0];
        expect(speakArg.voice).toEqual(mockVoices[0]);
    });

    it('should handle missing speechSynthesis gracefully', () => {
        // Remove speechSynthesis mock
        Object.defineProperty(window, 'speechSynthesis', {
            value: undefined,
            writable: true,
        });

        const { result } = renderHook(() => useTTS());
        result.current.speakText('Hello world');

        expect(speakMock).not.toHaveBeenCalled();
    });
});
