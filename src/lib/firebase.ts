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

// Only initialize Firebase in browser
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Promise<Analytics | null>;

if (isBrowser) {
    // Initialize Firebase App
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    console.log("Firebase Config:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
    });
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore with "varbe" database
    try {
        db = getFirestore(app, "varbe");
    } catch {
        db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
            experimentalForceLongPolling: false,
        }, "varbe");
    }
    
    console.log("✅ Firestore initialized with 'varbe' database");
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Analytics (async)
    analytics = (async () => {
        const supported = await isSupported();
        if (supported) {
            return getAnalytics(app);
        }
        return null;
    })();
} else {
    // SSR: Create placeholder objects that will throw helpful errors if accessed
    // These should never be accessed during SSR because all Firebase code should be in useEffect or event handlers
    const ssrError = (name: string) => {
        throw new Error(
            `Firebase ${name} is not available during server-side rendering. ` +
            `Ensure this code only runs in the browser using useEffect or event handlers.`
        );
    };
    
    app = new Proxy({} as FirebaseApp, { get: () => ssrError('App') });
    auth = new Proxy({} as Auth, { get: () => ssrError('Auth') });
    db = new Proxy({} as Firestore, { get: () => ssrError('Firestore') });
    storage = new Proxy({} as FirebaseStorage, { get: () => ssrError('Storage') });
    analytics = Promise.resolve(null);
}

export { app, auth, db, storage, analytics };
