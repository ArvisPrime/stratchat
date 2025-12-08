import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as geminiStatic from './geminiStatic';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('geminiStatic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockReset();
    });

    describe('getQuickSummary', () => {
        it('should return parsed summary when API call succeeds', async () => {
            const mockResponse = {
                summary: 'A short summary.',
                mood: 'Positive'
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await geminiStatic.getQuickSummary('transcript text');

            expect(result).toEqual({
                summary: 'A short summary.',
                sentiment: 'Positive',
                emoji: '😐', // Default
            });
            expect(mockFetch).toHaveBeenCalledWith('/api/summary', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ text: 'transcript text' })
            }));
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(geminiStatic.getQuickSummary('transcript text')).rejects.toThrow('Failed to fetch summary');
        });
    });

    describe('generateStrategicQuestion', () => {
        it('should return generated question', async () => {
            const mockResponse = { question: 'What is your goal?' };
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await geminiStatic.generateStrategicQuestion('transcript text');

            expect(result).toBe('What is your goal?');
            expect(mockFetch).toHaveBeenCalledWith('/api/question', expect.any(Object));
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(geminiStatic.generateStrategicQuestion('transcript text')).rejects.toThrow('Failed to generate question');
        });
    });

    describe('getDeepAnalysis', () => {
        it('should return deep analysis', async () => {
            const mockResponse = { strategy: 'Deep analysis content.' };
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await geminiStatic.getDeepAnalysis('transcript text');

            expect(result).toBe('Deep analysis content.');
            expect(mockFetch).toHaveBeenCalledWith('/api/strategy', expect.any(Object));
        });
    });

    describe('refineTranscript', () => {
        it('should return refined transcript', async () => {
            const mockResponse = { text: 'Refined transcript.' };
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await geminiStatic.refineTranscript('base64audio');

            expect(result).toBe('Refined transcript.');
            expect(mockFetch).toHaveBeenCalledWith('/api/refine', expect.any(Object));
        });
    });
});
