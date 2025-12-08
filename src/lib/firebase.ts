import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, getFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBts3VdOg4ktMutTVh5ebugbD0pgf-F4KY",
    authDomain: "varbe-e96d2.firebaseapp.com",
    databaseURL: "https://varbe-e96d2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "varbe-e96d2",
    storageBucket: "varbe-e96d2.firebasestorage.app",
    messagingSenderId: "851653426804",
    appId: "1:851653426804:web:87c6e4e9f3c61cb0d0db21",
    measurementId: "G-LKJ6C1BPTC"
};

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

// Initialize Firebase App - works on both server and client
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Promise<Analytics | null>;

// Initialize Firebase App (works on both server and client)
app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with "varbe" database (works on both server and client)
try {
    db = getFirestore(app, "varbe");
} catch {
    db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        experimentalForceLongPolling: false,
    }, "varbe");
}

// Initialize Auth (works on both server and client)
auth = getAuth(app);

// Initialize Storage (works on both server and client)
storage = getStorage(app);

// Initialize Analytics only in browser
if (isBrowser) {
    console.log("Firebase Config:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
    });
    
    console.log("✅ Firestore initialized with 'varbe' database");
    
    // Initialize Analytics (async, browser only)
    analytics = (async () => {
        const supported = await isSupported();
        if (supported) {
            return getAnalytics(app);
        }
        return null;
    })();
} else {
    // Server-side: Analytics not available
    analytics = Promise.resolve(null);
}

export { app, auth, db, storage, analytics };
