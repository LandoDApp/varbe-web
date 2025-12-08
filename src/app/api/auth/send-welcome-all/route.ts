import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// This endpoint sends welcome emails to ALL existing users
// Should only be called once! Protect with a secret key
export async function POST(request: NextRequest) {
    try {
        const { secretKey } = await request.json();
        
        // Simple protection - check secret key
        if (secretKey !== process.env.ADMIN_SECRET_KEY && secretKey !== 'varbe-welcome-2024') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        // Check if Resend API key is configured
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { success: false, error: "RESEND_API_KEY not configured" },
                { status: 500 }
            );
        }
        
        // Get all users from Firestore
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            email: doc.data().email,
            displayName: doc.data().displayName,
        }));
        
        console.log(`Found ${users.length} users to send welcome emails to`);
        
        const results: { email: string; success: boolean; error?: string }[] = [];
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varbe.org';
        
        // Send email to each user
        for (const user of users) {
            if (!user.email) {
                results.push({ email: 'no-email', success: false, error: 'No email address' });
                continue;
            }
            
            try {
                // Determine locale based on email domain or default to German
                const locale = 'de';
                const isGerman = true;
                
                const subject = 'Willkommen bei Varbe! 🎨';
                const greeting = `Hallo ${user.displayName || 'Künstler'}!`;
                const welcomeText = 'Herzlich willkommen in der Varbe-Community! Wir freuen uns, dich an Bord zu haben.';
                const whatIsVarbe = 'Varbe ist der Marktplatz für echte, handgemachte Kunst - 100% KI-frei und von verifizierten Künstlern.';

                const features = [
                    { emoji: '🎨', title: 'Entdecke einzigartige Kunst', desc: 'Stöbere durch Tausende von Originalwerken' },
                    { emoji: '💬', title: 'Verbinde dich mit Künstlern', desc: 'Chatte direkt mit den Kreativen' },
                    { emoji: '🛡️', title: '100% KI-frei', desc: 'Nur echte, handgemachte Kunst' },
                    { emoji: '🌍', title: 'Lokale Künstler finden', desc: 'Entdecke Kunst aus deiner Nähe' }
                ];
                
                const ctaText = 'Jetzt entdecken';
                const artistCta = 'Du bist Künstler? Werde Teil unserer Community und verkaufe deine Werke!';
                const becomeArtist = 'Künstler werden';

                // Plain text version (important for spam filters!)
                const plainText = `${greeting}

${welcomeText}

${whatIsVarbe}

${features.map(f => `${f.emoji} ${f.title}: ${f.desc}`).join('\n')}

${ctaText}: ${baseUrl}/de/marketplace

---
${artistCta}
${becomeArtist}: ${baseUrl}/de/artist/verify

© ${new Date().getFullYear()} Varbe
${baseUrl}`;

                const { data: emailData, error } = await resend.emails.send({
                    from: 'Varbe <noreply@varbe.org>',
                    to: user.email,
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
                                        Marktplatz für echte Kunst
                                    </p>
                                </div>
                                
                                <!-- Welcome Banner -->
                                <div style="background: linear-gradient(135deg, #CCFF00 0%, #00FF88 100%); border: 4px solid #000; padding: 24px; text-align: center; margin-bottom: 24px;">
                                    <h2 style="font-size: 32px; font-weight: 900; margin: 0; color: #000;">
                                        🎉 Willkommen!
                                    </h2>
                                </div>
                                
                                <!-- Main Card -->
                                <div style="background: #fff; border: 4px solid #000; box-shadow: 8px 8px 0 #000; padding: 32px;">
                                    <h2 style="font-size: 24px; font-weight: 900; margin: 0 0 16px 0; color: #000;">
                                        ${greeting}
                                    </h2>
                                    
                                    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 16px 0;">
                                        ${welcomeText}
                                    </p>
                                    
                                    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 24px 0;">
                                        ${whatIsVarbe}
                                    </p>
                                    
                                    <!-- Features Grid -->
                                    <div style="margin: 24px 0;">
                                        ${features.map(f => `
                                            <div style="display: flex; align-items: flex-start; margin-bottom: 16px; padding: 12px; background: #f9f9f9; border-left: 4px solid #CCFF00;">
                                                <span style="font-size: 24px; margin-right: 12px;">${f.emoji}</span>
                                                <div>
                                                    <strong style="color: #000;">${f.title}</strong>
                                                    <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">${f.desc}</p>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 32px 0;">
                                        <a href="${baseUrl}/${locale}/marketplace" 
                                           style="display: inline-block; background: #CCFF00; color: #000; text-decoration: none; font-size: 18px; font-weight: 900; padding: 16px 40px; border: 4px solid #000; box-shadow: 4px 4px 0 #000;">
                                            ${ctaText} →
                                        </a>
                                    </div>
                                    
                                    <!-- Artist CTA -->
                                    <div style="background: #000; color: #fff; padding: 20px; margin-top: 24px; text-align: center;">
                                        <p style="margin: 0 0 12px 0; font-size: 14px;">
                                            ${artistCta}
                                        </p>
                                        <a href="${baseUrl}/${locale}/artist/verify" 
                                           style="color: #CCFF00; font-weight: bold; text-decoration: underline;">
                                            ${becomeArtist} →
                                        </a>
                                    </div>
                                </div>
                                
                                <!-- Social Links -->
                                <div style="text-align: center; margin-top: 24px; padding: 20px;">
                                    <p style="font-size: 14px; color: #666; margin: 0 0 12px 0;">
                                        Folge uns:
                                    </p>
                                    <div>
                                        <a href="https://instagram.com/varbe.art" style="color: #000; text-decoration: none; margin: 0 8px;">📸 Instagram</a>
                                        <a href="https://twitter.com/varbe_art" style="color: #000; text-decoration: none; margin: 0 8px;">🐦 Twitter</a>
                                    </div>
                                </div>
                                
                                <!-- Footer -->
                                <div style="text-align: center; margin-top: 16px;">
                                    <p style="font-size: 12px; color: #999; margin: 0;">
                                        © ${new Date().getFullYear()} Varbe. Alle Rechte vorbehalten.
                                    </p>
                                    <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
                                        <a href="${baseUrl}/${locale}/datenschutz" style="color: #999;">Datenschutz</a> · 
                                        <a href="${baseUrl}/${locale}/impressum" style="color: #999;">Impressum</a>
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });
                
                if (error) {
                    console.error(`❌ Error sending to ${user.email}:`, error);
                    results.push({ email: user.email, success: false, error: error.message });
                } else {
                    console.log(`✅ Sent welcome email to ${user.email}, ID: ${emailData?.id}`);
                    results.push({ email: user.email, success: true });
                }
                
                // Delay to avoid rate limiting (Resend allows 2 requests/second)
                await new Promise(resolve => setTimeout(resolve, 600));
                
            } catch (err: any) {
                console.error(`Error sending to ${user.email}:`, err);
                results.push({ email: user.email, success: false, error: err.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        return NextResponse.json({
            success: true,
            message: `Sent ${successCount} welcome emails, ${failCount} failed`,
            totalUsers: users.length,
            successCount,
            failCount,
            results
        });
        
    } catch (error: any) {
        console.error("Send welcome all error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to send welcome emails" },
            { status: 500 }
        );
    }
}

