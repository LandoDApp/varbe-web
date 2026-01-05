"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/db";
import { UserProfile } from "@/types";
import { checkAndAwardBadges } from "@/lib/badges";

// Helper to set/remove admin bypass cookie
const setAdminBypassCookie = (isAdmin: boolean) => {
    if (typeof document === 'undefined') return;
    
    if (isAdmin) {
        // Set cookie that expires in 7 days
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `varbe_admin_bypass=true; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
    } else {
        // Remove cookie
        document.cookie = 'varbe_admin_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
};

interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    needsUsernameSetup: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => {},
    needsUsernameSetup: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const badgeCheckRef = useRef<string | null>(null); // Track last badge check to avoid duplicate calls

    // Function to refresh profile data from Firestore
    const refreshProfile = useCallback(async () => {
        if (!user) return;
        
        try {
            console.log("🔄 Refreshing user profile...");
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
                console.log("✅ Profile refreshed:", userProfile.displayName);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error("❌ Error refreshing profile:", error);
        }
    }, [user]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (error) {
                console.error("Error setting persistence:", error);
            }

            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                console.log("========================================");
                console.log("🔐 AUTH STATE CHANGED");
                console.log("========================================");
                
                if (firebaseUser) {
                    console.log("✅ User Logged In");
                    console.log("📧 Email:", firebaseUser.email);
                    console.log("🆔 UID:", firebaseUser.uid);
                    console.log("👤 Display Name:", firebaseUser.displayName);
                    console.log("📱 Provider:", firebaseUser.providerData[0]?.providerId || "Unknown");
                    
                    // Set user immediately - don't wait for profile
                    setUser(firebaseUser);
                    
                    // Set loading to false immediately so UI can show user status
                    setLoading(false);
                    
                    // Fetch profile in background (non-blocking)
                    try {
                        console.log("💾 Fetching user profile from Firestore (background)...");
                        const userProfile = await getUserProfile(firebaseUser.uid);
                        
                        if (userProfile) {
                            console.log("✅ User Profile Found:", userProfile);
                            
                            // Set admin bypass cookie if user is admin
                            setAdminBypassCookie(userProfile.role === 'admin');
                            
                            // Check and award badges in background (only once per session per user)
                            const sessionKey = `${firebaseUser.uid}_${Date.now().toString().slice(0, -4)}`; // Changes every ~10 seconds
                            if (badgeCheckRef.current !== sessionKey) {
                                badgeCheckRef.current = sessionKey;
                                checkAndAwardBadges(firebaseUser.uid).then(result => {
                                    if (result.newBadges.length > 0) {
                                        console.log(`🏆 New badges awarded: ${result.newBadges.join(', ')}`);
                                        // Refresh profile to get updated badges
                                        getUserProfile(firebaseUser.uid).then(updatedProfile => {
                                            if (updatedProfile) setProfile(updatedProfile);
                                        });
                                    }
                                }).catch(err => {
                                    console.error("❌ Badge check error:", err);
                                });
                            }
                        } else {
                            console.log("⚠️ User Profile Not Found in Firestore (will be created on next action)");
                            // Clear admin cookie if no profile
                            setAdminBypassCookie(false);
                        }
                        
                        setProfile(userProfile);
                    } catch (error) {
                        console.error("❌ Error fetching user profile:", error);
                        // Don't block UI if profile fetch fails - user is still authenticated
                        setProfile(null);
                    }
                } else {
                    console.log("❌ User Logged Out");
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    // Clear admin bypass cookie on logout
                    setAdminBypassCookie(false);
                }
                
                console.log("========================================");
            });
            return unsubscribe;
        };

        const unsubscribePromise = initAuth();
        return () => { unsubscribePromise.then(unsub => unsub && unsub()); };
    }, []);

    // Check if user needs to set up their username
    const needsUsernameSetup = !!(user && profile && !profile.username);

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile, needsUsernameSetup }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
