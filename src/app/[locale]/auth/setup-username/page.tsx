"use client";

import { Button } from "@/components/ui/Button";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from 'next-intl';
import { checkUsernameAvailability, setUsername, validateUsername } from "@/lib/db";

export default function SetupUsernamePage() {
    const { user, profile, loading: authLoading, refreshProfile } = useAuth();
    const [username, setUsernameValue] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const t = useTranslations('auth.setupUsername');

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, authLoading, router]);

    // Redirect if user already has a username
    useEffect(() => {
        if (!authLoading && profile?.username) {
            router.push("/profile");
        }
    }, [profile, authLoading, router]);

    // Debounced username availability check
    const checkAvailability = useCallback(async (value: string) => {
        if (!value || value.length < 3) {
            setIsAvailable(null);
            return;
        }

        setIsChecking(true);
        const available = await checkUsernameAvailability(value);
        setIsAvailable(available);
        setIsChecking(false);
    }, []);

    // Handle username input change
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsernameValue(value);
        setSubmitError(null);
        
        // Validate
        const validation = validateUsername(value);
        if (!validation.isValid && value.length > 0) {
            setValidationError(validation.error || null);
            setIsAvailable(null);
        } else {
            setValidationError(null);
            // Debounce the availability check
            const timeoutId = setTimeout(() => {
                if (value.length >= 3) {
                    checkAvailability(value);
                } else {
                    setIsAvailable(null);
                }
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user || !username || validationError || !isAvailable) return;
        
        setIsSubmitting(true);
        setSubmitError(null);
        
        const result = await setUsername(user.uid, username);
        
        if (result.success) {
            setSuccess(true);
            // Refresh the profile to get the new username
            await refreshProfile();
            // Redirect to profile after a short delay
            setTimeout(() => {
                router.push("/profile");
            }, 1500);
        } else {
            setSubmitError(result.error || 'unknown_error');
        }
        
        setIsSubmitting(false);
    };

    // Show loading state while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-halftone bg-[length:20px_20px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div>
            </div>
        );
    }

    // Don't render if not logged in
    if (!user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-halftone bg-[length:20px_20px] p-4">
            <div className="card-comic max-w-md w-full space-y-6 bg-white">
                {/* Header */}
                <div className="text-center">
                    <div className="text-6xl mb-4">@</div>
                    <h1 className="text-3xl font-heading">{t('title')}</h1>
                    <p className="font-body text-gray-600 mt-2">{t('subtitle')}</p>
                </div>

                {/* Description */}
                <p className="text-center text-gray-600 font-body">
                    {t('description')}
                </p>

                {/* Success Message */}
                {success ? (
                    <div className="text-center space-y-4">
                        <div className="text-5xl">🎉</div>
                        <p className="text-xl font-bold text-green-600">{t('success')}</p>
                        <p className="text-gray-600">@{username}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Input */}
                        <div>
                            <label className="block font-heading text-lg mb-2">
                                {t('inputLabel')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                                    {t('inputPrefix')}
                                </span>
                                <input
                                    type="text"
                                    className={`input-comic pl-10 ${
                                        validationError 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : isAvailable === true 
                                                ? 'border-green-500 focus:border-green-500'
                                                : isAvailable === false
                                                    ? 'border-red-500 focus:border-red-500'
                                                    : ''
                                    }`}
                                    placeholder={t('inputPlaceholder')}
                                    value={username}
                                    onChange={handleUsernameChange}
                                    maxLength={20}
                                    autoComplete="off"
                                    autoFocus
                                />
                            </div>

                            {/* Status Messages */}
                            <div className="mt-2 min-h-[24px]">
                                {isChecking && (
                                    <p className="text-gray-500 text-sm flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></span>
                                        {t('checking')}
                                    </p>
                                )}
                                {!isChecking && validationError && (
                                    <p className="text-red-500 text-sm">
                                        {t(`errors.${validationError}`)}
                                    </p>
                                )}
                                {!isChecking && !validationError && isAvailable === true && (
                                    <p className="text-green-600 text-sm font-bold">
                                        {t('available')}
                                    </p>
                                )}
                                {!isChecking && !validationError && isAvailable === false && (
                                    <p className="text-red-500 text-sm">
                                        {t('taken')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
                            <p className="font-bold text-sm mb-2">{t('rules.title')}</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• {t('rules.length')}</li>
                                <li>• {t('rules.characters')}</li>
                                <li>• {t('rules.start')}</li>
                                <li>• {t('rules.end')}</li>
                            </ul>
                        </div>

                        {/* Submit Error */}
                        {submitError && (
                            <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                                <p className="text-red-600 font-bold">
                                    {t(`errors.${submitError}`)}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full text-xl py-3"
                            variant="accent"
                            disabled={
                                isSubmitting || 
                                isChecking || 
                                !isAvailable || 
                                !!validationError || 
                                !username
                            }
                        >
                            {isSubmitting ? t('submitting') : t('submit')}
                        </Button>

                        {/* Skip Info */}
                        <p className="text-center text-sm text-gray-500">
                            {t('skipInfo')}
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}


