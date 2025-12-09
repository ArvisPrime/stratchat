import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { SessionData } from '../types';

export const saveSession = async (userId: string, session: Omit<SessionData, 'id' | 'userId' | 'startTime'> & { startTime: Date }) => {
    try {
        // Firestore calls fail if any field is undefined. We must sanitize arrays of objects.
        const sanitize = (obj: any): any => {
            if (Array.isArray(obj)) return obj.map(sanitize);
            if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
                const clean: any = {};
                Object.keys(obj).forEach(key => {
                    const val = obj[key];
                    if (val !== undefined) {
                        clean[key] = sanitize(val);
                    }
                });
                return clean;
            }
            return obj;
        };

        const cleanTranscript = sanitize(session.transcript);
        const cleanSuggestions = sanitize(session.suggestions);

        const docRef = await addDoc(collection(db, 'users', userId, 'sessions'), {
            ...session,
            transcript: cleanTranscript,
            suggestions: cleanSuggestions,
            userId,
            timestamp: serverTimestamp(), // For sorting
            startTime: Timestamp.fromDate(session.startTime),
            endTime: session.endTime ? Timestamp.fromDate(session.endTime) : serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error saving session", e);
        throw e;
    }
};

export const getUserSessions = async (userId: string): Promise<SessionData[]> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'sessions'),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId,
                ...data,
                startTime: (data.startTime as Timestamp).toDate(),
                endTime: data.endTime ? (data.endTime as Timestamp).toDate() : undefined,
                // Ensure other date fields in transcript/suggestions are converted if needed,
                // but usually simple storage as map/array works if we don't need to query *by* them.
                // However, Firestore doesn't auto-convert array of objects with timestamps back to Date objects.
                // We might need a transformer here if we strictly rely on Date objects in the UI.
                transcript: data.transcript.map((t: any) => ({
                    ...t,
                    timestamp: (t.timestamp as Timestamp).toDate(),
                    lastUpdated: t.lastUpdated ? (t.lastUpdated as Timestamp).toDate() : undefined
                })),
                suggestions: data.suggestions.map((s: any) => ({
                    ...s,
                    timestamp: (s.timestamp as Timestamp).toDate()
                }))
            } as unknown as SessionData; // Type assertion due to timestamp conversion complexity
        });
    } catch (e) {
        console.error("Error fetching sessions", e);
        return [];
    }
};

export const getSession = async (userId: string, sessionId: string): Promise<SessionData | null> => {
    try {
        const docRef = doc(db, 'users', userId, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                userId,
                ...data,
                startTime: (data.startTime as Timestamp).toDate(),
                endTime: data.endTime ? (data.endTime as Timestamp).toDate() : undefined,
                transcript: data.transcript.map((t: any) => ({
                    ...t,
                    timestamp: (t.timestamp as Timestamp).toDate(),
                    lastUpdated: t.lastUpdated ? (t.lastUpdated as Timestamp).toDate() : undefined
                })),
                suggestions: data.suggestions.map((s: any) => ({
                    ...s,
                    timestamp: (s.timestamp as Timestamp).toDate()
                }))
            } as SessionData;
        }
        return null;
    } catch (e) {
        console.error("Error fetching session", e);
        return null;
    }
};
