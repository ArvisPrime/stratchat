import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

export const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
            subscriptionStatus: 'free',
            subscriptionTier: 'free',
            ...additionalData
        };

        await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp()
        });
        return newProfile;
    }

    return userSnap.data() as UserProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const data = userSnap.data();
        return {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        } as UserProfile;
    }
    return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

export const deleteUserProfile = async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
};
