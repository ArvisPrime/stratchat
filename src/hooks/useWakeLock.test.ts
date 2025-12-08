import { renderHook, waitFor } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useWakeLock', () => {
    const requestMock = vi.fn();
    const releaseMock = vi.fn();

    beforeEach(() => {
        // Mock navigator.wakeLock
        const mockWakeLock = {
            request: requestMock.mockResolvedValue({
                release: releaseMock,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                type: 'screen',
                released: false,
            }),
        };

        Object.defineProperty(navigator, 'wakeLock', {
            value: mockWakeLock,
            writable: true,
        });

        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            writable: true,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should request wake lock on mount', async () => {
        renderHook(() => useWakeLock());

        // Wait for async request
        await waitFor(() => {
            expect(requestMock).toHaveBeenCalledWith('screen');
        });
    });

    it('should re-request wake lock when visibility changes to visible', async () => {
        renderHook(() => useWakeLock());

        // Initial request
        await waitFor(() => {
            expect(requestMock).toHaveBeenCalledTimes(1);
        });

        // Simulate visibility change
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);

        await waitFor(() => {
            expect(requestMock).toHaveBeenCalledTimes(2);
        });
    });

    it('should NOT re-request wake lock when visibility changes to hidden', async () => {
        renderHook(() => useWakeLock());

        await waitFor(() => {
            expect(requestMock).toHaveBeenCalledTimes(1);
        });

        // Simulate hidden
        Object.defineProperty(document, 'visibilityState', {
            value: 'hidden',
            writable: true,
        });
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);

        expect(requestMock).toHaveBeenCalledTimes(1);
    });

    it('should release wake lock on unmount', async () => {
        const { unmount } = renderHook(() => useWakeLock());

        await waitFor(() => {
            expect(requestMock).toHaveBeenCalled();
        });

        unmount();

        expect(releaseMock).toHaveBeenCalled();
    });

    it('should handle missing wakeLock API gracefully', async () => {
        // Remove wakeLock API
        Object.defineProperty(navigator, 'wakeLock', {
            value: undefined,
            writable: true,
        });

        renderHook(() => useWakeLock());

        // Should not throw and not call request
        expect(requestMock).not.toHaveBeenCalled();
    });
});
