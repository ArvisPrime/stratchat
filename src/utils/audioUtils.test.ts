import { describe, it, expect } from 'vitest';
import { createPcmBlob, decodeAudio, encodeWAV } from './audioUtils';

describe('audioUtils', () => {
  describe('createPcmBlob', () => {
    it('should create a valid PCM blob from Float32Array', () => {
      const input = new Float32Array([0.5, -0.5, 0]);
      const result = createPcmBlob(input);

      expect(result.mimeType).toBe('audio/pcm;rate=16000');
      expect(typeof result.data).toBe('string');

      // Verify base64 encoding
      // 0.5 -> 0x3FFF (16383)
      // -0.5 -> -0x4000 (-16384)
      // 0 -> 0
      const decoded = atob(result.data);
      expect(decoded.length).toBe(6); // 3 samples * 2 bytes per sample
    });

    it('should clamp values outside [-1, 1]', () => {
      const input = new Float32Array([1.5, -1.5]);
      const result = createPcmBlob(input);

      const decoded = atob(result.data);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);

      expect(int16[0]).toBe(32767); // 0x7FFF (max positive)
      expect(int16[1]).toBe(-32768); // -0x8000 (min negative)
    });
  });

  describe('decodeAudio', () => {
    it('should correctly decode base64 string to Uint8Array', () => {
      const text = 'Hello';
      const base64 = btoa(text);
      const result = decodeAudio(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(text.length);

      const decodedText = Array.from(result)
        .map(code => String.fromCharCode(code))
        .join('');
      expect(decodedText).toBe(text);
    });
  });

  describe('encodeWAV', () => {
    it('should create a valid WAV file structure', () => {
      const sampleRate = 16000;
      const samples = new Float32Array(sampleRate); // 1 second of silence
      const result = encodeWAV(samples, sampleRate);

      const decoded = atob(result);
      const buffer = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        buffer[i] = decoded.charCodeAt(i);
      }
      const view = new DataView(buffer.buffer);

      // Check WAV header
      expect(String.fromCharCode(...buffer.slice(0, 4))).toBe('RIFF');
      expect(String.fromCharCode(...buffer.slice(8, 12))).toBe('WAVE');
      expect(String.fromCharCode(...buffer.slice(12, 16))).toBe('fmt ');
      expect(view.getUint32(24, true)).toBe(sampleRate); // Sample rate
      expect(view.getUint16(22, true)).toBe(1); // Channels (mono)
      expect(view.getUint16(34, true)).toBe(16); // Bits per sample
      expect(String.fromCharCode(...buffer.slice(36, 40))).toBe('data');
    });
  });
});
