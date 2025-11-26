import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserProfile } from '../types';

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
            return docSnap.data() as UserProfile;
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
