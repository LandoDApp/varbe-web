"use client";

import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "@/i18n/routing";
import { createUserProfile, getUserProfile } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLocale } from 'next-intl';

export default function LoginPage() {
    const { user } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('auth.login');

    // Redirect to profile if user is already logged in
    useEffect(() => {
        if (user) {
            console.log("User logged in, redirecting to profile...");
            router.push("/profile");
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Check if user's email is verified (using our own verification system)
            const userProfile = await getUserProfile(userCredential.user.uid);
            
            if (!userProfile?.emailVerified) {
                await auth.signOut();
                setError(t('emailVerification.notVerified'));
                return;
            }
            
            // Check if user needs to set up username
            if (userProfile && !userProfile.username) {
                router.push("/auth/setup-username");
            } else {
                router.push("/profile");
            }
        } catch (err: any) {
            setError(t('invalidCredentials'));
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsGoogleLoading(true);
        
        console.log("========================================");
        console.log("🚀 INITIATING GOOGLE LOGIN (POPUP)");
        console.log("========================================");
        
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            console.log("📱 Provider configured, calling signInWithPopup...");
            
            const result = await signInWithPopup(auth, provider);
            
            console.log("✅ POPUP LOGIN SUCCESS!");
            console.log("📧 User Email:", result.user.email);
            console.log("🆔 User UID:", result.user.uid);
            
            console.log("💾 Creating user profile...");
            // Google users are automatically email verified
            const { profile: userProfile, isNew } = await createUserProfile(
                result.user.uid, 
                result.user.email || "", 
                result.user.displayName || "Anonymous",
                'buyer',
                true // Google users are automatically verified
            );
            
            // Send welcome email to new users
            if (isNew && result.user.email) {
                console.log("📧 Sending welcome email to new user...");
                fetch('/api/auth/send-welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: result.user.email,
                        name: result.user.displayName || "Anonymous",
                        locale: locale
                    })
                }).catch(err => console.error("Error sending welcome email:", err));
            }
            
            // Check if user needs to set up username
            if (userProfile && !userProfile.username) {
                console.log("✅ Profile created, user needs to set up username");
                router.push("/auth/setup-username");
            } else {
                console.log("✅ Profile created, redirecting to /profile");
                router.push("/profile");
            }
        } catch (err: any) {
            console.error("========================================");
            console.error("❌ GOOGLE POPUP LOGIN ERROR");
            console.error("========================================");
            console.error("Error Code:", err.code);
            console.error("Error Message:", err.message);
            console.error("Full Error:", err);
            console.error("========================================");
            
            const errorMessage = err.code === 'auth/popup-closed-by-user'
                ? t('popupClosed')
                : err.code === 'auth/popup-blocked'
                ? t('popupBlocked')
                : err.code === 'auth/unauthorized-domain'
                ? t('domainNotAuthorized')
                : err.code === 'auth/operation-not-allowed'
                ? t('googleNotEnabled')
                : `${err.message || "Failed to login with Google."} (Code: ${err.code})`;
            setError(errorMessage);
            setIsGoogleLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!resetEmail) {
            setError(t('forgotPassword.emailRequired'));
            return;
        }
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetEmailSent(true);
        } catch (err: any) {
            setError(err.code === 'auth/user-not-found' 
                ? t('forgotPassword.userNotFound')
                : err.message || t('forgotPassword.error'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-halftone bg-[length:20px_20px] p-4">
            <div className="card-comic max-w-md w-full space-y-8 bg-white">
                <div className="text-center">
                    <h2 className="text-4xl font-heading">{t('title')}</h2>
                    <p className="font-body text-gray-600">{t('subtitle')}</p>
                </div>

                <div className="space-y-4">
                    <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full text-lg py-3 flex items-center justify-center gap-2"
                        variant="secondary"
                        disabled={isGoogleLoading}
                    >
                        {isGoogleLoading ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></span>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        {isGoogleLoading ? t('connecting') : t('googleLogin')}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-black"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500 font-bold">{t('orContinue')}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && <p className="text-red-500 font-bold">{error}</p>}
                    <div>
                        <label className="block font-heading text-lg mb-2">{t('email')}</label>
                        <input
                            type="email"
                            className="input-comic"
                            placeholder={t('emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-heading text-lg mb-2">{t('password')}</label>
                        <input
                            type="password"
                            className="input-comic"
                            placeholder={t('passwordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-gray-600 hover:text-black underline mt-2"
                        >
                            {t('forgotPassword.link')}
                        </button>
                    </div>

                    {!showForgotPassword ? (
                        <Button type="submit" className="w-full text-xl py-3" variant="accent">
                            {t('loginButton')}
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            {resetEmailSent ? (
                                <div className="p-4 bg-green-50 border-2 border-green-400">
                                    <p className="font-bold text-green-600">{t('forgotPassword.success')}</p>
                                    <p className="text-sm text-green-700 mt-2">{t('forgotPassword.checkEmail')}</p>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setResetEmailSent(false);
                                            setResetEmail("");
                                        }}
                                        className="w-full mt-4"
                                        variant="secondary"
                                    >
                                        {t('forgotPassword.backToLogin')}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <p className="font-body text-gray-700">{t('forgotPassword.instructions')}</p>
                                        <input
                                            type="email"
                                            className="input-comic"
                                            placeholder={t('emailPlaceholder')}
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <Button type="submit" className="flex-1" variant="accent">
                                                {t('forgotPassword.sendResetLink')}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(false);
                                                    setResetEmail("");
                                                    setError("");
                                                }}
                                                className="flex-1"
                                                variant="secondary"
                                            >
                                                {t('forgotPassword.cancel')}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </form>

                <div className="text-center font-body">
                    {t('noAccount')}{" "}
                    <Link href="/auth/register" className="font-bold underline decoration-accent decoration-4">
                        {t('joinClub')}
                    </Link>
                </div>

                {/* Debug Info */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-400 text-xs font-mono text-left">
                        <p className="font-bold text-red-600 mb-1">⚠️ {t('error')}:</p>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}



