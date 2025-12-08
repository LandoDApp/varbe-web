import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_HOURS = 24;

export async function POST(request: NextRequest) {
    try {
        const { userId, email, name, locale = 'de' } = await request.json();
        
        // Validate required fields
        if (!userId || !email) {
            return NextResponse.json(
                { success: false, error: "Missing userId or email" },
                { status: 400 }
            );
        }
        
        // Generate a secure verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + (TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
        
        // Store token in Firestore
        const tokenRef = doc(db, "email_verification_tokens", token);
        await setDoc(tokenRef, {
            userId,
            email: email.toLowerCase(),
            createdAt: Date.now(),
            expiresAt,
            used: false
        });
        
        // Build verification URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varbe.org';
        const verificationUrl = `${baseUrl}/${locale}/auth/verify-email?token=${token}`;
        
        // Email content based on locale
        const isGerman = locale === 'de';
        
        const subject = isGerman 
            ? 'Bestätige deine E-Mail-Adresse bei Varbe'
            : 'Confirm your email address at Varbe';
            
        const greeting = isGerman
            ? `Hallo ${name || 'Künstler'}!`
            : `Hello ${name || 'Artist'}!`;
            
        const welcomeText = isGerman
            ? 'Willkommen bei Varbe! Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.'
            : 'Welcome to Varbe! Please confirm your email address to activate your account.';
            
        const buttonText = isGerman
            ? 'E-Mail bestätigen'
            : 'Confirm Email';
            
        const expirationText = isGerman
            ? `Dieser Link ist ${TOKEN_EXPIRATION_HOURS} Stunden gültig.`
            : `This link is valid for ${TOKEN_EXPIRATION_HOURS} hours.`;
            
        const ignoreText = isGerman
            ? 'Falls du dich nicht bei Varbe registriert hast, kannst du diese E-Mail ignorieren.'
            : 'If you did not register at Varbe, you can ignore this email.';

        // Plain text version (important for spam filters!)
        const plainText = `${greeting}

${welcomeText}

${buttonText}: ${verificationUrl}

${expirationText}

---
${ignoreText}

© ${new Date().getFullYear()} Varbe`;

        // Use varbe.org domain
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Varbe <noreply@varbe.org>';
        
        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: subject,
            text: plainText,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="font-size: 48px; font-weight: 900; margin: 0; color: #000; letter-spacing: -2px;">
                                VARBE
                            </h1>
                            <p style="font-size: 14px; color: #666; margin-top: 4px;">
                                ${isGerman ? 'Marktplatz für echte Kunst' : 'Marketplace for real art'}
                            </p>
                        </div>
                        
                        <!-- Main Card -->
                        <div style="background: #fff; border: 4px solid #000; box-shadow: 8px 8px 0 #000; padding: 32px;">
                            <h2 style="font-size: 28px; font-weight: 900; margin: 0 0 16px 0; color: #000;">
                                ${greeting}
                            </h2>
                            
                            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 24px 0;">
                                ${welcomeText}
                            </p>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${verificationUrl}" 
                                   style="display: inline-block; background: #CCFF00; color: #000; text-decoration: none; font-size: 18px; font-weight: 900; padding: 16px 40px; border: 4px solid #000; box-shadow: 4px 4px 0 #000; transition: all 0.1s;">
                                    ${buttonText} →
                                </a>
                            </div>
                            
                            <p style="font-size: 14px; color: #666; margin: 24px 0 0 0; text-align: center;">
                                ${expirationText}
                            </p>
                            
                            <!-- Alternative Link -->
                            <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; word-break: break-all;">
                                <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">
                                    ${isGerman ? 'Falls der Button nicht funktioniert, kopiere diesen Link:' : 'If the button doesn\'t work, copy this link:'}
                                </p>
                                <a href="${verificationUrl}" style="font-size: 12px; color: #000;">
                                    ${verificationUrl}
                                </a>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 32px;">
                            <p style="font-size: 12px; color: #999; margin: 0;">
                                ${ignoreText}
                            </p>
                            <p style="font-size: 12px; color: #999; margin: 16px 0 0 0;">
                                © ${new Date().getFullYear()} Varbe. ${isGerman ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        
        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to send verification email" },
                { status: 500 }
            );
        }
        
        console.log("Verification email sent successfully:", data?.id);
        
        return NextResponse.json(
            { success: true, message: "Verification email sent" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Send verification error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send verification email" },
            { status: 500 }
        );
    }
}

