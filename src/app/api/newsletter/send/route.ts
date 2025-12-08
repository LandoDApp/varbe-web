import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { secretKey, subject, previewText } = await request.json();
        
        // Simple protection
        if (secretKey !== process.env.ADMIN_SECRET_KEY && secretKey !== 'varbe-newsletter-2024') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { success: false, error: "RESEND_API_KEY not configured" },
                { status: 500 }
            );
        }
        
        // Get all newsletter subscribers
        const subscribersRef = collection(db, "newsletter_subscribers");
        const subscribersSnapshot = await getDocs(subscribersRef);
        
        const subscribers = subscribersSnapshot.docs
            .map(doc => doc.data())
            .filter(sub => sub.active !== false && sub.email);
        
        console.log(`Found ${subscribers.length} active newsletter subscribers`);
        
        if (subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No subscribers found",
                totalSubscribers: 0
            });
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varbe.org';
        const results: { email: string; success: boolean; error?: string; emailId?: string }[] = [];
        
        // Email content - avoid spam triggers
        const emailSubject = subject || 'Willkommen beim Varbe Newsletter';
        
        for (const subscriber of subscribers) {
            try {
                // Get subscriber's preferred locale
                const subLocale = subscriber.locale || 'de';
                const isGerman = subLocale === 'de';
                
                // Unsubscribe link
                const unsubscribeUrl = `${baseUrl}/${subLocale}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
                
                // Localized content
                const localizedSubject = subject || (isGerman ? 'Willkommen beim Varbe Newsletter' : 'Welcome to the Varbe Newsletter');
                const greeting = isGerman ? 'Hey!' : 'Hey!';
                const thankYou = isGerman 
                    ? 'Danke fürs Anmelden beim Varbe Newsletter!'
                    : 'Thanks for signing up for the Varbe newsletter!';
                const intro = isGerman
                    ? 'Varbe ist der Marktplatz für echte, handgemachte Kunst - 100% KI-frei und von verifizierten Künstlern.'
                    : 'Varbe is the marketplace for real, handmade art - 100% AI-free and from verified artists.';
                const feature1Title = isGerman ? 'Neue Kunstwerke' : 'New Artworks';
                const feature1Desc = isGerman ? 'Entdecke wöchentlich neue Originale' : 'Discover new originals weekly';
                const feature2Title = isGerman ? 'Behind the Scenes' : 'Behind the Scenes';
                const feature2Desc = isGerman ? 'Einblicke in die Ateliers' : 'Inside the studios';
                const feature3Title = isGerman ? 'Lokale Events' : 'Local Events';
                const feature3Desc = isGerman ? 'Ausstellungen in deiner Nähe' : 'Exhibitions near you';
                const ctaText = isGerman ? 'KUNST ENTDECKEN' : 'DISCOVER ART';
                const footerText = isGerman 
                    ? 'Du erhältst diese E-Mail, weil du dich angemeldet hast.'
                    : 'You receive this email because you subscribed.';
                const unsubText = isGerman ? 'Abmelden' : 'Unsubscribe';
                
                const { data: emailData, error } = await resend.emails.send({
                    from: 'Varbe Newsletter <newsletter@varbe.org>',
                    to: subscriber.email,
                    subject: localizedSubject,
                    headers: {
                        'List-Unsubscribe': `<${unsubscribeUrl}>`,
                        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                    },
                    text: `${greeting}

${thankYou}

${intro}

- ${feature1Title}: ${feature1Desc}
- ${feature2Title}: ${feature2Desc}
- ${feature3Title}: ${feature3Desc}

${ctaText}: ${baseUrl}/${subLocale}/marketplace

---
${footerText}
${unsubText}: ${unsubscribeUrl}

Varbe - ${baseUrl}`,
                    html: `
                        <!DOCTYPE html>
                        <html lang="${subLocale}">
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Varbe Newsletter</title>
                        </head>
                        <body style="margin: 0; padding: 0; background: repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #ffffff 10px, #ffffff 20px); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                
                                <!-- Main Card with Comic Border -->
                                <div style="background: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0 #000000;">
                                    
                                    <!-- Header -->
                                    <div style="background: #000000; padding: 24px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #CCFF00; letter-spacing: 2px; text-transform: uppercase;">
                                            VARBE
                                        </h1>
                                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #ffffff; letter-spacing: 3px; text-transform: uppercase;">
                                            ${isGerman ? 'KUNST OHNE KI' : 'ART WITHOUT AI'}
                                        </p>
                                    </div>
                                    
                                    <!-- Content -->
                                    <div style="padding: 32px;">
                                        
                                        <!-- Greeting Badge -->
                                        <div style="display: inline-block; background: #CCFF00; padding: 8px 16px; border: 3px solid #000000; transform: rotate(-2deg); margin-bottom: 20px;">
                                            <span style="font-size: 18px; font-weight: 900; color: #000000;">${greeting}</span>
                                        </div>
                                        
                                        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #000000; font-weight: 600;">
                                            ${thankYou}
                                        </p>
                                        
                                        <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                                            ${intro}
                                        </p>
                                        
                                        <!-- Features with Comic Style -->
                                        <div style="margin: 0 0 28px 0;">
                                            <div style="background: #f9f9f9; border: 3px solid #000000; padding: 16px; margin-bottom: 12px;">
                                                <strong style="color: #000000; font-size: 14px;">${feature1Title}</strong>
                                                <p style="margin: 4px 0 0 0; color: #666666; font-size: 13px;">${feature1Desc}</p>
                                            </div>
                                            <div style="background: #f9f9f9; border: 3px solid #000000; padding: 16px; margin-bottom: 12px;">
                                                <strong style="color: #000000; font-size: 14px;">${feature2Title}</strong>
                                                <p style="margin: 4px 0 0 0; color: #666666; font-size: 13px;">${feature2Desc}</p>
                                            </div>
                                            <div style="background: #f9f9f9; border: 3px solid #000000; padding: 16px;">
                                                <strong style="color: #000000; font-size: 14px;">${feature3Title}</strong>
                                                <p style="margin: 4px 0 0 0; color: #666666; font-size: 13px;">${feature3Desc}</p>
                                            </div>
                                        </div>
                                        
                                        <!-- CTA Button Comic Style -->
                                        <div style="text-align: center; margin: 32px 0 16px 0;">
                                            <a href="${baseUrl}/${subLocale}/marketplace" 
                                               style="display: inline-block; background: #CCFF00; color: #000000; text-decoration: none; font-size: 16px; font-weight: 900; padding: 16px 32px; border: 4px solid #000000; box-shadow: 4px 4px 0 #000000; text-transform: uppercase; letter-spacing: 1px;">
                                                ${ctaText} →
                                            </a>
                                        </div>
                                        
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style="background: #f5f5f5; border-top: 3px solid #000000; padding: 20px; text-align: center;">
                                        <p style="margin: 0 0 12px 0; font-size: 12px; color: #666666;">
                                            ${footerText}
                                        </p>
                                        <a href="${unsubscribeUrl}" style="color: #000000; font-size: 12px; font-weight: 600;">${unsubText}</a>
                                        <span style="color: #cccccc; margin: 0 8px;">|</span>
                                        <a href="${baseUrl}" style="color: #000000; font-size: 12px;">varbe.org</a>
                                    </div>
                                    
                                </div>
                                
                            </div>
                        </body>
                        </html>
                    `
                });
                
                if (error) {
                    console.error(`❌ Error sending to ${subscriber.email}:`, error);
                    results.push({ email: subscriber.email, success: false, error: error.message });
                } else {
                    console.log(`✅ Sent newsletter to ${subscriber.email}, ID: ${emailData?.id}`);
                    results.push({ email: subscriber.email, success: true, emailId: emailData?.id });
                }
                
                // Delay to avoid rate limiting (Resend: 2 req/sec)
                await new Promise(resolve => setTimeout(resolve, 600));
                
            } catch (err: any) {
                console.error(`❌ Error sending to ${subscriber.email}:`, err);
                results.push({ email: subscriber.email, success: false, error: err.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        return NextResponse.json({
            success: true,
            message: `Sent ${successCount} newsletter emails, ${failCount} failed`,
            totalSubscribers: subscribers.length,
            successCount,
            failCount,
            results
        });
        
    } catch (error: any) {
        console.error("Newsletter send error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to send newsletter" },
            { status: 500 }
        );
    }
}

