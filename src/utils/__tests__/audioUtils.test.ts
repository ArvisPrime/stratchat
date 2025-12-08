import { createPcmBlob, decodeAudio } from '../audioUtils';
import { describe, it, expect } from 'vitest';

describe('audioUtils', () => {
    describe('createPcmBlob', () => {
        it('converts Float32Array to base64 blob structure', () => {
            const floatData = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0]);
            const blob = createPcmBlob(floatData);

            expect(blob.mimeType).toBe('audio/pcm;rate=16000');
            expect(typeof blob.data).toBe('string');
            // Should be base64
            expect(blob.data).toMatch(/^[A-Za-z0-9+/=]+$/);
        });
    });

    describe('decodeAudio', () => {
        it('decodes base64 string to Uint8Array', () => {
            const originalText = "Hello World";
            const base64 = btoa(originalText);
            const decoded = decodeAudio(base64);

            const decoder = new TextDecoder();
            const result = decoder.decode(decoded);

            expect(result).toBe(originalText);
        });
    });
});
