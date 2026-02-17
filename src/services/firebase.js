// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG KEYS
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCPbHcT5j3lLVMDAmDX5IAHJuk98vpCH_s",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aqua-sense-7d9d4.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aqua-sense-7d9d4",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aqua-sense-7d9d4.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "90435088180",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:90435088180:web:09b269403a57c16dda7f61",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-405T9QWW38",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://aqua-sense-7d9d4-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("🔥 Firebase initialized for project:", firebaseConfig.projectId);

export const auth = getAuth(app);
export const db = getFirestore(app); // For user data/logs
export const rtdb = getDatabase(app); // For real-time sensor data

export default app;
