import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { email, name, locale = 'de' } = await request.json();
        
        // Validate required fields
        if (!email) {
            return NextResponse.json(
                { success: false, error: "Missing email" },
                { status: 400 }
            );
        }
        
        // Check if Resend API key is configured
        if (!process.env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY not configured");
            return NextResponse.json(
                { success: false, error: "Email service not configured" },
                { status: 500 }
            );
        }
        
        // Email content based on locale
        const isGerman = locale === 'de';
        
        const subject = isGerman 
            ? 'Willkommen bei Varbe! 🎨'
            : 'Welcome to Varbe! 🎨';
            
        const greeting = isGerman
            ? `Hallo ${name || 'Künstler'}!`
            : `Hello ${name || 'Artist'}!`;
            
        const welcomeText = isGerman
            ? 'Herzlich willkommen in der Varbe-Community! Wir freuen uns, dich an Bord zu haben.'
            : 'Welcome to the Varbe community! We\'re excited to have you on board.';
            
        const whatIsVarbe = isGerman
            ? 'Varbe ist der Marktplatz für echte, handgemachte Kunst - 100% KI-frei und von verifizierten Künstlern.'
            : 'Varbe is the marketplace for real, handmade art - 100% AI-free and from verified artists.';

        const features = isGerman ? [
            { emoji: '🎨', title: 'Entdecke einzigartige Kunst', desc: 'Stöbere durch Tausende von Originalwerken' },
            { emoji: '💬', title: 'Verbinde dich mit Künstlern', desc: 'Chatte direkt mit den Kreativen' },
            { emoji: '🛡️', title: '100% KI-frei', desc: 'Nur echte, handgemachte Kunst' },
            { emoji: '🌍', title: 'Lokale Künstler finden', desc: 'Entdecke Kunst aus deiner Nähe' }
        ] : [
            { emoji: '🎨', title: 'Discover unique art', desc: 'Browse through thousands of original works' },
            { emoji: '💬', title: 'Connect with artists', desc: 'Chat directly with creators' },
            { emoji: '🛡️', title: '100% AI-free', desc: 'Only real, handmade art' },
            { emoji: '🌍', title: 'Find local artists', desc: 'Discover art near you' }
        ];
        
        const ctaText = isGerman
            ? 'Jetzt entdecken'
            : 'Start exploring';
            
        const artistCta = isGerman
            ? 'Du bist Künstler? Werde Teil unserer Community und verkaufe deine Werke!'
            : 'Are you an artist? Join our community and sell your work!';
            
        const becomeArtist = isGerman
            ? 'Künstler werden'
            : 'Become an artist';

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varbe.org';

        // Plain text version (important for spam filters!)
        const plainText = `${greeting}

${welcomeText}

${whatIsVarbe}

${features.map(f => `${f.emoji} ${f.title}: ${f.desc}`).join('\n')}

${ctaText}: ${baseUrl}/${locale}/marketplace

---
${artistCta}
${becomeArtist}: ${baseUrl}/${locale}/artist/verify

© ${new Date().getFullYear()} Varbe
${baseUrl}`;

        // Send welcome email via Resend
        // Use Resend's test domain if varbe.org is not verified yet
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Varbe <noreply@varbe.org>';
        
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
                        
                        <!-- Welcome Banner -->
                        <div style="background: linear-gradient(135deg, #CCFF00 0%, #00FF88 100%); border: 4px solid #000; padding: 24px; text-align: center; margin-bottom: 24px;">
                            <h2 style="font-size: 32px; font-weight: 900; margin: 0; color: #000;">
                                🎉 ${isGerman ? 'Willkommen!' : 'Welcome!'}
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
                                ${isGerman ? 'Folge uns:' : 'Follow us:'}
                            </p>
                            <div>
                                <a href="https://instagram.com/varbe.art" style="color: #000; text-decoration: none; margin: 0 8px;">📸 Instagram</a>
                                <a href="https://twitter.com/varbe_art" style="color: #000; text-decoration: none; margin: 0 8px;">🐦 Twitter</a>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 16px;">
                            <p style="font-size: 12px; color: #999; margin: 0;">
                                © ${new Date().getFullYear()} Varbe. ${isGerman ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
                            </p>
                            <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
                                <a href="${baseUrl}/${locale}/datenschutz" style="color: #999;">${isGerman ? 'Datenschutz' : 'Privacy'}</a> · 
                                <a href="${baseUrl}/${locale}/impressum" style="color: #999;">${isGerman ? 'Impressum' : 'Imprint'}</a>
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
                { success: false, error: "Failed to send welcome email" },
                { status: 500 }
            );
        }
        
        console.log("Welcome email sent successfully:", data?.id);
        
        return NextResponse.json(
            { success: true, message: "Welcome email sent" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Send welcome email error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send welcome email" },
            { status: 500 }
        );
    }
}

