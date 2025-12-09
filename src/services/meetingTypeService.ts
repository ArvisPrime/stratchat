import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface MeetingType {
    id: string;
    name: string;
    description: string;
    systemInstruction: string;
    icon?: string;
    updatedAt?: Date;
    createdAt?: Date;
}

export const DEFAULT_MEETING_TYPE: MeetingType = {
    id: 'general-negotiation',
    name: 'General Negotiation',
    description: 'Standard analysis mode. The AI listens silently and provides strategic insights.',
    systemInstruction: "You are a silent listener. You are listening to a conversation to provide a transcript. DO NOT RESPOND. DO NOT SPEAK. Remain completely silent.",
    icon: 'Brain'
};

export const getMeetingTypes = async (userId: string): Promise<MeetingType[]> => {
    const typesRef = collection(db, 'users', userId, 'meeting_types');
    const snapshot = await getDocs(typesRef);

    if (snapshot.empty) {
        // Seed default if empty
        await createMeetingType(userId, DEFAULT_MEETING_TYPE);
        return [DEFAULT_MEETING_TYPE];
    }

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MeetingType));
};

export const createMeetingType = async (userId: string, data: Partial<MeetingType>) => {
    const id = data.id || crypto.randomUUID();
    const typeRef = doc(db, 'users', userId, 'meeting_types', id);

    const newType: MeetingType = {
        id,
        name: data.name || 'New Meeting Type',
        description: data.description || '',
        systemInstruction: data.systemInstruction || DEFAULT_MEETING_TYPE.systemInstruction,
        icon: data.icon || 'MessageSquare',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await setDoc(typeRef, {
        ...newType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return newType;
};

export const updateMeetingType = async (userId: string, typeId: string, data: Partial<MeetingType>) => {
    const typeRef = doc(db, 'users', userId, 'meeting_types', typeId);
    await updateDoc(typeRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

export const deleteMeetingType = async (userId: string, typeId: string) => {
    if (typeId === DEFAULT_MEETING_TYPE.id) throw new Error("Cannot delete default meeting type");
    const typeRef = doc(db, 'users', userId, 'meeting_types', typeId);
    await deleteDoc(typeRef);
};
