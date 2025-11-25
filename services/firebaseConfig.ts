/**
 * Firebase Configuration (Paused for offline development)
 * 
 * NOTE: The initialization code is currently commented out to allow the app
 * to run in "Mock Mode" without database errors. Uncomment when ready to connect.
 */

// import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// import { getAnalytics, Analytics } from 'firebase/analytics';
// import { getDatabase, Database } from 'firebase/database';
// import { initializeAuth, getAuth, Auth, browserLocalPersistence } from 'firebase/auth';
// import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// KEEPING THIS SAFE FOR LATER
export const firebaseConfig = {
  apiKey: 'AIzaSyAuqN08fxvXb2ZMSvVhUjaYZutltxaq7y4',
  authDomain: 'fitswap---nutriverse.firebaseapp.com',
  databaseURL: 'https://fitswap---nutriverse-default-rtdb.firebaseio.com',
  projectId: 'fitswap---nutriverse',
  storageBucket: 'fitswap---nutriverse.firebasestorage.app',
  messagingSenderId: '939251100449',
  appId: '1:939251100449:web:188e078ffabb3f6c8b2c60',
  measurementId: 'G-EQCPJ6CS80',
};

/*
// Singleton App Instance
let app: FirebaseApp;
// ... (Previous initialization logic)
*/

// Mock exports to satisfy any lingering imports if necessary, though we remove them from App.tsx
export const app = null;
export const analytics = null;
export const database = null;
export const auth = null;
export const storage = null;

export default app;
