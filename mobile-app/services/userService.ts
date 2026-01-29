import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserProfile, SubscriptionPlan } from '../types';

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
    try {
        await setDoc(doc(db, 'users', uid), profile);
    } catch (error) {
        console.error("Error saving user profile:", error);
        throw error;
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;

            // Admin Bypass for Test User
            if (profile.email === '123indiozinhos@gmail.com') {
                console.log('👑 Admin user logged in: Granting UNLIMITED POWER');
                return {
                    ...profile,
                    isPro: true,
                    plan: SubscriptionPlan.YEARLY,
                    // Ensure usage stats don't block (optional, but good for safety)
                    usageStats: {
                        ...profile.usageStats,
                        // Could reset stats here if needed, but isPro check in services usually bypasses anyway
                    }
                };
            }

            return profile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export const deleteUserData = async (uid: string) => {
    try {
        await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
        console.error("Error deleting user data:", error);
        throw error;
    }
};
