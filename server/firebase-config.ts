import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase/app';

// Initialize Firebase Admin SDK (for server-side operations)
try {
  // Check if any Firebase apps have been initialized
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase admin initialization error', error);
}

// Firebase client configuration for browser
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase client app (for client-side operations)
const app = initializeApp(firebaseConfig);

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export default admin;