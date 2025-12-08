import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';

// Email to receive contact form submissions
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "info@varbe.org";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const { name, email, subject, message } = await request.json();
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { success: false, error: "All fields are required" },
                { status: 400 }
            );
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email format" },
                { status: 400 }
            );
        }
        
        // Subject mapping
        const subjectLabels: Record<string, string> = {
            general: "Allgemeine Frage",
            artist: "Frage als Künstler",
            buyer: "Frage als Käufer",
            technical: "Technisches Problem",
            other: "Sonstiges"
        };
        
        const subjectLabel = subjectLabels[subject] || subject;
        
        // Check if Resend API key is configured
        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY not configured");
            return NextResponse.json(
                { success: false, error: "Email service not configured" },
                { status: 500 }
            );
        }
        
        // Send email via Resend
        const resend = new Resend(RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: 'Varbe Kontakt <noreply@varbe.org>',
            to: CONTACT_EMAIL,
            replyTo: email,
            subject: `[Varbe] ${subjectLabel} - von ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #000; border-bottom: 3px solid #CCFF00; padding-bottom: 10px;">
                        📨 Neue Kontaktanfrage
                    </h2>
                    
                    <table style="width: 100%; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 100px;">Name:</td>
                            <td style="padding: 8px 0;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">E-Mail:</td>
                            <td style="padding: 8px 0;">
                                <a href="mailto:${email}">${email}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Betreff:</td>
                            <td style="padding: 8px 0;">${subjectLabel}</td>
                        </tr>
                    </table>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #CCFF00; margin: 20px 0;">
                        <p style="font-weight: bold; margin-top: 0;">Nachricht:</p>
                        <p style="white-space: pre-wrap; margin-bottom: 0;">${message}</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                        Gesendet über das Varbe Kontaktformular<br>
                        Absender: ${name} (${email})
                    </p>
                </div>
            `
        });
        
        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to send email" },
                { status: 500 }
            );
        }
        
        console.log("Email sent successfully:", data?.id);
        
        return NextResponse.json(
            { success: true, message: "Message sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send message" },
            { status: 500 }
        );
    }
}
