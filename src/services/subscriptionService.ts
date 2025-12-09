import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection } from 'firebase/firestore';
import { UserProfile } from '../types';
import { updateUserProfile } from './userService';

export const PRO_PRICE_ID = 'price_mock_pro_999'; // Mock Stripe Price ID

// Limits (Daily)
const LIMITS = {
    free: {
        deep_strategy: 3,
        history_access: 3 // Last 3 sessions
    },
    pro: {
        deep_strategy: Infinity,
        history_access: Infinity
    },
    enterprise: {
        deep_strategy: Infinity,
        history_access: Infinity
    }
};

export const checkUsageLimit = async (userId: string, profile: UserProfile, feature: 'deep_strategy'): Promise<boolean> => {
    // 1. Check Tier
    const tier = profile.subscriptionTier || 'free';
    const limit = LIMITS[tier][feature];

    if (limit === Infinity) return true;

    // 2. Check Usage for Time Period (Daily)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = doc(db, 'users', userId, 'usage_stats', today);
    const usageSnap = await getDoc(usageRef);

    if (!usageSnap.exists()) return true; // 0 usage

    const currentUsage = usageSnap.data()[feature] || 0;
    return currentUsage < limit;
};

export const incrementUsage = async (userId: string, feature: 'deep_strategy') => {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'users', userId, 'usage_stats', today);

    // Set with merge: true ensures the doc is created if it doesn't exist
    await setDoc(usageRef, {
        [feature]: increment(1)
    }, { merge: true });
};

export const mockUpgradeToPro = async (userId: string): Promise<void> => {
    // Simulates a successful Stripe checkout session
    await updateUserProfile(userId, {
        subscriptionStatus: 'active',
        subscriptionTier: 'pro'
    });
};
