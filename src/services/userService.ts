import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

export const createUserProfile = async (user: User) => {
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
            subscriptionTier: 'free'
        };

        // Convert Date to Firestore Timestamp if needed, but SDK handles Dates usually or we use serverTimestamp()
        // For type safety with standard Date in interface vs Timestamp in DB, we might need a converter.
        // For now, simple object write.
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
        // Convert Firestore Timestamp to Date if necessary
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
