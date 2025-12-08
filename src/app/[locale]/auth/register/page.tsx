"use client";

import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useLocale } from 'next-intl';
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/db";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('auth.register');

    useEffect(() => {
        if (user) {
            router.push("/profile");
        }
    }, [user, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        // Validate terms acceptance
        if (!acceptTerms) {
            setError(t('errors.acceptTerms'));
            return;
        }
        
        setIsLoading(true);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(userCredential.user.uid, email, name);
            
            // Subscribe to newsletter if opted in
            if (subscribeNewsletter) {
                fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, locale, source: 'register' })
                }).catch(err => console.error("Newsletter subscribe error:", err));
            }
            
            // Send verification email via Resend API
            try {
                const response = await fetch('/api/auth/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userCredential.user.uid,
                        email: email,
                        name: name,
                        locale: locale
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    await auth.signOut();
                    setEmailSent(true);
                } else {
                    console.error("Error sending verification email:", data.error);
                    await auth.signOut();
                    setEmailSent(true);
                }
            } catch (verifyErr: any) {
                console.error("Error sending verification email:", verifyErr);
                await auth.signOut();
                setEmailSent(true);
            }
        } catch (err: any) {
            // Show user-friendly error messages
            const errorMessage = err.code === 'auth/email-already-in-use'
                ? t('errors.emailInUse')
                : err.code === 'auth/weak-password'
                ? t('errors.weakPassword')
                : err.code === 'auth/invalid-email'
                ? t('errors.invalidEmail')
                : err.message;
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        
        // Validate terms acceptance
        if (!acceptTerms) {
            setError(t('errors.acceptTerms'));
            return;
        }
        
        setIsGoogleLoading(true);
        
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            const result = await signInWithPopup(auth, provider);
            
            // Google users are automatically email verified
            const { profile: userProfile, isNew } = await createUserProfile(
                result.user.uid, 
                result.user.email || "", 
                result.user.displayName || "Anonymous",
                'buyer',
                true // Google users are automatically verified
            );
            
            // Subscribe to newsletter if opted in (always, not just for new users)
            if (subscribeNewsletter && result.user.email) {
                fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: result.user.email, 
                        locale, 
                        source: 'register-google' 
                    })
                }).catch(err => console.error("Newsletter subscribe error:", err));
            }
            
            // Send welcome email to new users only
            if (isNew && result.user.email) {
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
            
            // Redirect to username setup if user doesn't have one
            if (userProfile && !userProfile.username) {
                router.push("/auth/setup-username");
            } else {
                router.push("/profile");
            }
        } catch (err: any) {
            console.error("Google login error:", err);
            const errorMessage = err.code === 'auth/popup-closed-by-user'
                ? t('popupClosed')
                : err.code === 'auth/popup-blocked'
                ? t('popupBlocked')
                : err.message || "Failed to register with Google.";
            setError(errorMessage);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-halftone bg-[length:20px_20px] p-4">
            <div className="card-comic max-w-md w-full space-y-6 bg-white">
                <div className="text-center">
                    <h2 className="text-4xl font-heading">{t('title')}</h2>
                    <p className="font-body text-gray-600">{t('subtitle')}</p>
                </div>

                {emailSent ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 border-2 border-green-400">
                            <p className="font-bold text-green-600 text-lg mb-2">{t('emailVerification.sent')}</p>
                            <p className="text-sm text-green-700">{t('emailVerification.checkEmail')}</p>
                        </div>
                        <Button
                            onClick={() => router.push("/auth/login")}
                            className="w-full"
                            variant="accent"
                        >
                            {t('emailVerification.backToLogin')}
                        </Button>
                    </div>
                ) : (
                <>
                {/* Email Registration Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block font-heading text-lg mb-2">{t('name')}</label>
                        <input
                            type="text"
                            className="input-comic"
                            placeholder={t('namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                    </div>

                    <Button type="submit" className="w-full text-xl py-3" variant="accent" disabled={isLoading || !acceptTerms}>
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></span>
                                {t('createAccount')}...
                            </span>
                        ) : t('createAccount')}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t-2 border-black"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500 font-bold">{t('orContinue')}</span>
                    </div>
                </div>

                {/* Google Button - always clickable but shows error if terms not accepted */}
                <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    className={`w-full text-lg py-3 flex items-center justify-center gap-2 ${!acceptTerms ? 'opacity-60' : ''}`}
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
                    {isGoogleLoading ? t('connecting') : t('googleRegister')}
                </Button>

                {/* Terms & Newsletter Checkboxes */}
                <div className="space-y-3 p-4 bg-gray-50 border-2 border-black">
                    <p className="font-heading text-sm mb-2">{t('terms.heading')}</p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-1 w-5 h-5 border-2 border-black accent-accent cursor-pointer"
                        />
                        <span className="font-body text-sm text-gray-700 group-hover:text-black">
                            {t('terms.accept')}{' '}
                            <Link href="/legal/agb" className="underline decoration-accent decoration-2 font-bold">
                                {t('terms.termsLink')}
                            </Link>
                            {' '}{t('terms.and')}{' '}
                            <Link href="/legal/datenschutz" className="underline decoration-accent decoration-2 font-bold">
                                {t('terms.privacyLink')}
                            </Link>
                            {' '}*
                        </span>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={subscribeNewsletter}
                            onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                            className="mt-1 w-5 h-5 border-2 border-black accent-accent cursor-pointer"
                        />
                        <span className="font-body text-sm text-gray-700 group-hover:text-black">
                            {t('newsletter.subscribe')}
                        </span>
                    </label>
                </div>

                {/* Error Message */}
                {error && <p className="text-red-500 font-bold text-center p-3 bg-red-50 border-2 border-red-300">{error}</p>}
                </>
                )}

                <div className="text-center font-body">
                    {t('hasAccount')}{" "}
                    <Link href="/auth/login" className="font-bold underline decoration-accent decoration-4">
                        {t('loginHere')}
                    </Link>
                </div>
            </div>
        </div>
    );
}



