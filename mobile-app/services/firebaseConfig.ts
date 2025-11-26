import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAuqN08fxvXb2ZMSvVhUjaYZutltxaq7y4",
    authDomain: "fitswap---nutriverse.firebaseapp.com",
    databaseURL: "https://fitswap---nutriverse-default-rtdb.firebaseio.com",
    projectId: "fitswap---nutriverse",
    storageBucket: "fitswap---nutriverse.firebasestorage.app",
    messagingSenderId: "939251100449",
    appId: "1:939251100449:web:188e078ffabb3f6c8b2c60",
    measurementId: "G-EQCPJ6CS80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };
