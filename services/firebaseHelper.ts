
/**
 * Firebase Service - Helper functions for Firebase operations
 */

import { database, auth, storage } from './firebaseConfig';
import { ref, get, set, push, update, remove, onValue, off, DataSnapshot } from 'firebase/database';
import { 
  signInAnonymously, 
  signOut, 
  User, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';

// Database operations
export const firebaseService = {
  // Read data
  async getData(path: string): Promise<any> {
    try {
      const dataRef = ref(database, path);
      const snapshot = await get(dataRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error reading data:', error);
      throw error;
    }
  },

  // Write data
  async setData(path: string, data: any): Promise<void> {
    try {
      const dataRef = ref(database, path);
      await set(dataRef, data);
    } catch (error) {
      console.error('Error writing data:', error);
      throw error;
    }
  },

  // Push data (creates new entry with auto-generated key)
  async pushData(path: string, data: any): Promise<string> {
    try {
      const dataRef = ref(database, path);
      const newRef = push(dataRef);
      await set(newRef, data);
      return newRef.key || '';
    } catch (error) {
      console.error('Error pushing data:', error);
      throw error;
    }
  },

  // Update data
  async updateData(path: string, data: any): Promise<void> {
    try {
      const dataRef = ref(database, path);
      await update(dataRef, data);
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  },

  // Delete data
  async deleteData(path: string): Promise<void> {
    try {
      const dataRef = ref(database, path);
      await remove(dataRef);
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  },

  // Listen to real-time changes
  subscribeToData(
    path: string,
    callback: (data: any) => void
  ): () => void {
    const dataRef = ref(database, path);
    
    const unsubscribe = onValue(dataRef, (snapshot: DataSnapshot) => {
      const data = snapshot.exists() ? snapshot.val() : null;
      callback(data);
    });

    // Return unsubscribe function
    return () => {
      off(dataRef);
    };
  },
};

// Auth operations
export const firebaseAuth = {
  // Sign in anonymously
  async signInAnonymously(): Promise<User> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      // Using static import instead of dynamic for stability
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  },

  // Create user with email and password
  async createUserWithEmailAndPassword(email: string, password: string): Promise<User> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      // Using static import instead of dynamic for stability
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth?.currentUser || null;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },
};

// Storage operations
export const firebaseStorage = {
  // Upload file
  async uploadFile(
    path: string,
    file: Blob | Uint8Array | ArrayBuffer,
    metadata?: any
  ): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }
      const fileRef = storageRef(storage, path);
      const uploadResult: UploadResult = await uploadBytes(fileRef, file, metadata);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get download URL
  async getDownloadURL(path: string): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }
      const fileRef = storageRef(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  },
};

export default firebaseService;
