import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure the mock is created before the module is imported
const mocks = vi.hoisted(() => {
    return {
        generateContent: vi.fn(),
    };
});

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            models: any;
            constructor() {
                this.models = {
                    generateContent: mocks.generateContent,
                };
            }
        },
        Type: {
            OBJECT: 'OBJECT',
            STRING: 'STRING',
        },
    };
});

// Import after mock
import * as geminiStatic from './geminiStatic';

describe('geminiStatic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getQuickSummary', () => {
        it('should return parsed summary when API call succeeds', async () => {
            const mockResponse = {
                text: JSON.stringify({
                    summary: 'A short summary.',
                    sentiment: 'Positive',
                    emoji: '😊',
                }),
            };
            mocks.generateContent.mockResolvedValue(mockResponse);

            const result = await geminiStatic.getQuickSummary('transcript text');

            expect(result).toEqual({
                summary: 'A short summary.',
                sentiment: 'Positive',
                emoji: '😊',
            });
            expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-flash-lite-latest',
            }));
        });

        it('should return fallback on parsing error', async () => {
            const mockResponse = {
                text: 'Invalid JSON',
            };
            mocks.generateContent.mockResolvedValue(mockResponse);

            const result = await geminiStatic.getQuickSummary('transcript text');

            expect(result).toEqual({
                summary: 'Could not generate summary.',
                sentiment: 'Neutral',
                emoji: '😐',
            });
        });

        it('should return fallback on API error', async () => {
            mocks.generateContent.mockRejectedValue(new Error('API Error'));

            const result = await geminiStatic.getQuickSummary('transcript text');

            expect(result).toEqual({
                summary: 'Could not generate summary.',
                sentiment: 'Neutral',
                emoji: '😐',
            });
        });
    });

    describe('generateStrategicQuestion', () => {
        it('should return generated question', async () => {
            const mockResponse = {
                text: 'What is your goal?',
            };
            mocks.generateContent.mockResolvedValue(mockResponse);

            const result = await geminiStatic.generateStrategicQuestion('transcript text');

            expect(result).toBe('What is your goal?');
            expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-flash-lite-latest',
            }));
        });

        it('should return fallback on API error', async () => {
            mocks.generateContent.mockRejectedValue(new Error('API Error'));

            const result = await geminiStatic.generateStrategicQuestion('transcript text');

            expect(result).toBe('Could not generate question.');
        });
    });

    describe('getDeepAnalysis', () => {
        it('should return deep analysis', async () => {
            const mockResponse = {
                text: 'Deep analysis content.',
            };
            mocks.generateContent.mockResolvedValue(mockResponse);

            const result = await geminiStatic.getDeepAnalysis('transcript text');

            expect(result).toBe('Deep analysis content.');
            expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-3-pro-preview',
            }));
        });

        it('should throw error on API failure', async () => {
            mocks.generateContent.mockRejectedValue(new Error('API Error'));

            await expect(geminiStatic.getDeepAnalysis('transcript text')).rejects.toThrow('API Error');
        });
    });

    describe('refineTranscript', () => {
        it('should return refined transcript', async () => {
            const mockResponse = {
                text: 'Refined transcript.',
            };
            mocks.generateContent.mockResolvedValue(mockResponse);

            const result = await geminiStatic.refineTranscript('base64audio');

            expect(result).toBe('Refined transcript.');
            expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.5-flash',
            }));
        });

        it('should return null on API error', async () => {
            mocks.generateContent.mockRejectedValue(new Error('API Error'));

            const result = await geminiStatic.refineTranscript('base64audio');

            expect(result).toBeNull();
        });
    });
});
