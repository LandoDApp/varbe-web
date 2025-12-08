"use client";

import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const t = useTranslations('auth.verifyEmail');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorType, setErrorType] = useState<string | null>(null);
    
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const token = searchParams.get('token');
        
        if (success === 'true') {
            setStatus('success');
            return;
        }
        
        if (error) {
            setStatus('error');
            setErrorType(error);
            return;
        }
        
        // If we have a token, verify it via API
        if (token) {
            verifyToken(token);
        } else {
            setStatus('error');
            setErrorType('missing_token');
        }
    }, [searchParams]);
    
    const verifyToken = async (token: string) => {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorType(data.error || 'verification_failed');
            }
        } catch (err) {
            setStatus('error');
            setErrorType('verification_failed');
        }
    };
    
    const getErrorMessage = (errorType: string | null) => {
        switch (errorType) {
            case 'missing_token':
                return t('errors.missingToken');
            case 'invalid_token':
                return t('errors.invalidToken');
            case 'token_expired':
                return t('errors.tokenExpired');
            case 'token_already_used':
                return t('errors.tokenUsed');
            case 'user_not_found':
                return t('errors.userNotFound');
            default:
                return t('errors.verificationFailed');
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-halftone bg-[length:20px_20px] p-4">
            <div className="card-comic max-w-md w-full space-y-8 bg-white text-center">
                {status === 'loading' && (
                    <>
                        <div className="flex justify-center">
                            <span className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></span>
                        </div>
                        <h2 className="text-2xl font-heading">{t('loading')}</h2>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="text-6xl">✅</div>
                        <h2 className="text-3xl font-heading">{t('success.title')}</h2>
                        <p className="font-body text-gray-600">{t('success.message')}</p>
                        <Link href="/auth/login">
                            <Button variant="accent" className="w-full text-xl py-3">
                                {t('success.loginButton')}
                            </Button>
                        </Link>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="text-6xl">❌</div>
                        <h2 className="text-3xl font-heading">{t('error.title')}</h2>
                        <p className="font-body text-gray-600">{getErrorMessage(errorType)}</p>
                        
                        {errorType === 'token_expired' && (
                            <p className="font-body text-sm text-gray-500">
                                {t('error.expiredHint')}
                            </p>
                        )}
                        
                        <div className="space-y-3">
                            <Link href="/auth/login">
                                <Button variant="secondary" className="w-full">
                                    {t('error.loginButton')}
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button variant="accent" className="w-full">
                                    {t('error.registerButton')}
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}



