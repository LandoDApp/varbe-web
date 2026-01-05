/**
 * VARBE Authentizitätszertifikat Generator
 * 
 * Generates a downloadable PDF certificate for artworks
 * Uses browser-native PDF generation (no external libraries required)
 */

import { Artwork, UserProfile } from "@/types";

export interface CertificateData {
    artwork: Artwork;
    artist: UserProfile;
    buyerName?: string;
    purchaseDate?: number;
}

/**
 * Generate certificate HTML for printing/PDF
 */
export function generateCertificateHTML(data: CertificateData): string {
    const { artwork, artist, buyerName, purchaseDate } = data;
    
    const certificateId = artwork.certificateId || `VARBE-${Date.now().toString(36).toUpperCase()}`;
    const issuedDate = artwork.certificateIssued 
        ? new Date(artwork.certificateIssued).toLocaleDateString('de-DE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : new Date().toLocaleDateString('de-DE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    
    const purchaseDateFormatted = purchaseDate 
        ? new Date(purchaseDate).toLocaleDateString('de-DE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : null;
    
    // Generate QR code URL (using a free QR code API)
    const verifyUrl = `https://varbe.de/verify/${certificateId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VARBE Authentizitätszertifikat - ${artwork.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            color: #000;
        }
        
        .certificate {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            border: 8px solid #000;
            position: relative;
            background: linear-gradient(135deg, #fff 0%, #f8f8f8 100%);
        }
        
        .certificate::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #000;
            pointer-events: none;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 4px solid #000;
        }
        
        .logo {
            font-family: 'Bangers', cursive;
            font-size: 48px;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        
        .logo span {
            background: #CCFF00;
            padding: 5px 15px;
            border: 4px solid #000;
            box-shadow: 4px 4px 0 #000;
        }
        
        .title {
            font-family: 'Bangers', cursive;
            font-size: 32px;
            margin-top: 20px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        
        .artwork-section {
            display: flex;
            gap: 30px;
            margin: 30px 0;
        }
        
        .artwork-image {
            width: 200px;
            height: 200px;
            border: 4px solid #000;
            background: #f0f0f0;
            flex-shrink: 0;
            object-fit: cover;
        }
        
        .artwork-details {
            flex: 1;
        }
        
        .artwork-title {
            font-family: 'Bangers', cursive;
            font-size: 28px;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .detail-row {
            display: flex;
            margin: 8px 0;
        }
        
        .detail-label {
            font-weight: 700;
            width: 120px;
            flex-shrink: 0;
        }
        
        .detail-value {
            flex: 1;
        }
        
        .story-section {
            margin: 30px 0;
            padding: 20px;
            background: #f5f5f5;
            border: 2px solid #000;
        }
        
        .story-title {
            font-family: 'Bangers', cursive;
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .story-text {
            font-style: italic;
            line-height: 1.6;
        }
        
        .verification-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 4px solid #000;
        }
        
        .certificate-id {
            font-family: monospace;
            font-size: 14px;
            background: #000;
            color: #fff;
            padding: 8px 15px;
            letter-spacing: 1px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-image {
            max-height: 60px;
            max-width: 200px;
            margin-bottom: 5px;
        }
        
        .signature-line {
            width: 200px;
            border-top: 2px solid #000;
            margin: 0 auto;
        }
        
        .signature-label {
            font-size: 12px;
            margin-top: 5px;
        }
        
        .qr-section {
            text-align: center;
        }
        
        .qr-code {
            width: 100px;
            height: 100px;
            border: 2px solid #000;
        }
        
        .qr-label {
            font-size: 10px;
            margin-top: 5px;
            max-width: 100px;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        
        .badge {
            display: inline-block;
            background: #CCFF00;
            color: #000;
            padding: 3px 10px;
            font-weight: 700;
            font-size: 12px;
            border: 2px solid #000;
            margin: 2px;
        }
        
        .purchase-info {
            margin-top: 20px;
            padding: 15px;
            background: #e8ffe8;
            border: 2px solid #000;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .certificate {
                border: 8px solid #000 !important;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="logo"><span>VARBE</span></div>
            <div class="title">Authentizitätszertifikat</div>
        </div>
        
        <div class="artwork-section">
            ${artwork.images[0] ? `<img src="${artwork.images[0]}" alt="${artwork.title}" class="artwork-image">` : '<div class="artwork-image"></div>'}
            
            <div class="artwork-details">
                <div class="artwork-title">${artwork.title}</div>
                
                <div class="detail-row">
                    <span class="detail-label">Künstler:</span>
                    <span class="detail-value">${artist.displayName || 'Unbekannt'}</span>
                </div>
                
                ${artwork.year ? `
                <div class="detail-row">
                    <span class="detail-label">Jahr:</span>
                    <span class="detail-value">${artwork.year}</span>
                </div>
                ` : ''}
                
                <div class="detail-row">
                    <span class="detail-label">Technik:</span>
                    <span class="detail-value">${getTechniqueName(artwork.technique)}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Kategorie:</span>
                    <span class="detail-value">${getCategoryName(artwork.category)}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Maße:</span>
                    <span class="detail-value">${artwork.dimensions} cm</span>
                </div>
                
                ${artwork.location ? `
                <div class="detail-row">
                    <span class="detail-label">Standort:</span>
                    <span class="detail-value">${artwork.location}</span>
                </div>
                ` : ''}
                
                <div style="margin-top: 15px;">
                    ${artist.verificationStatus === 'verified' ? '<span class="badge">✅ VERIFIZIERTER KÜNSTLER</span>' : ''}
                    ${artwork.kiFreeVerified ? '<span class="badge">🎨 100% KI-FREI</span>' : ''}
                </div>
            </div>
        </div>
        
        ${artwork.artistStory ? `
        <div class="story-section">
            <div class="story-title">📖 Die Story hinter dem Werk</div>
            <p class="story-text">"${artwork.artistStory}"</p>
        </div>
        ` : ''}
        
        ${buyerName && purchaseDateFormatted ? `
        <div class="purchase-info">
            <strong>Erworben von:</strong> ${buyerName}<br>
            <strong>Kaufdatum:</strong> ${purchaseDateFormatted}
        </div>
        ` : ''}
        
        <div class="verification-section">
            <div>
                <p style="font-size: 12px; margin-bottom: 5px;"><strong>Zertifikat-ID:</strong></p>
                <div class="certificate-id">${certificateId}</div>
                <p style="font-size: 11px; color: #666; margin-top: 5px;">
                    Ausgestellt am ${issuedDate}
                </p>
            </div>
            
            <div class="signature-box">
                ${artwork.artistSignature ? 
                    `<img src="${artwork.artistSignature}" alt="Künstler-Signatur" class="signature-image">` : 
                    '<div style="height: 60px;"></div>'
                }
                <div class="signature-line"></div>
                <p class="signature-label">Künstler-Signatur</p>
            </div>
            
            <div class="qr-section">
                <img src="${qrCodeUrl}" alt="QR-Code" class="qr-code">
                <p class="qr-label">Scannen zur Verifizierung</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Dieses Zertifikat bestätigt die Authentizität des oben genannten Kunstwerks.</p>
            <p>VARBE - Der Kunstmarktplatz für echte, menschliche Kreativität</p>
            <p style="margin-top: 10px;">varbe.de | © ${new Date().getFullYear()} VARBE</p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Open certificate in new window for printing/saving
 */
export function openCertificate(data: CertificateData): void {
    const html = generateCertificateHTML(data);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

/**
 * Download certificate as HTML file
 */
export function downloadCertificate(data: CertificateData): void {
    const html = generateCertificateHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `VARBE-Zertifikat-${data.artwork.certificateId || 'certificate'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper functions
function getTechniqueName(technique: string): string {
    const names: Record<string, string> = {
        oil: 'Öl',
        acrylic: 'Acryl',
        watercolor: 'Aquarell',
        digital: 'Digital',
        sculpture: 'Skulptur',
        mixed: 'Mixed Media',
        other: 'Andere',
    };
    return names[technique] || technique;
}

function getCategoryName(category: string): string {
    const names: Record<string, string> = {
        painting: 'Malerei',
        sculpture: 'Skulptur',
        digital: 'Digital Art',
        photography: 'Fotografie',
        mixed: 'Mixed Media',
        crafts: 'Kunsthandwerk',
        other: 'Andere',
    };
    return names[category] || category;
}








