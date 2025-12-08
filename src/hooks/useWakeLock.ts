import { useEffect } from 'react';

export function useWakeLock() {
    useEffect(() => {
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            try {
                // @ts-ignore
                if ('wakeLock' in navigator) {
                    // @ts-ignore
                    wakeLock = await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                console.debug('Wake Lock request failed:', err);
            }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) {
                wakeLock.release();
            }
        };
    }, []);
}
