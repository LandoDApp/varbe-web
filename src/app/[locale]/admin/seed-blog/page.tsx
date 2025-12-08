"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, setDoc, doc, updateDoc, increment } from "firebase/firestore";

// Sample artists data
// HINWEIS: Diese Accounts sind Demo-Accounts zur Demonstration der Plattform-Funktionen
const artists = [
    {
        uid: 'artist_luna_stellar',
        email: 'luna@varbe.art',
        displayName: 'Luna Stellar',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        bio: '⚠️ DEMO-ACCOUNT: Dies ist keine echte Person. Dieser Account dient zur Demonstration der Plattform-Funktionen.\n\n---\n\nDigital artist from Berlin. Creating cosmic and ethereal artworks.',
        location: 'Berlin, Germany',
        followersCount: 342,
        followingCount: 89,
        postsCount: 24,
        isDemo: true,
    },
    {
        uid: 'artist_max_urban',
        email: 'max@varbe.art',
        displayName: 'Max Urban',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        bio: '⚠️ DEMO-ACCOUNT: Dies ist keine echte Person. Dieser Account dient zur Demonstration der Plattform-Funktionen.\n\n---\n\nStreet artist and muralist. Bringing color to urban spaces.',
        location: 'Hamburg, Germany',
        followersCount: 567,
        followingCount: 123,
        postsCount: 45,
        isDemo: true,
    },
    {
        uid: 'artist_sophie_watercolor',
        email: 'sophie@varbe.art',
        displayName: 'Sophie Aquarell',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        bio: '⚠️ DEMO-ACCOUNT: Dies ist keine echte Person. Dieser Account dient zur Demonstration der Plattform-Funktionen.\n\n---\n\nWatercolor enthusiast. Nature and botanical illustrations.',
        location: 'München, Germany',
        followersCount: 289,
        followingCount: 156,
        postsCount: 38,
        isDemo: true,
    },
    {
        uid: 'artist_james_digital',
        email: 'james@varbe.art',
        displayName: 'James Digital',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        bio: '⚠️ DEMO-ACCOUNT: Dies ist keine echte Person. Dieser Account dient zur Demonstration der Plattform-Funktionen.\n\n---\n\nConcept artist and illustrator. Working in games and entertainment.',
        location: 'London, UK',
        followersCount: 892,
        followingCount: 201,
        postsCount: 67,
        isDemo: true,
    },
];

// German blog posts
const germanPosts = [
    {
        authorId: 'artist_luna_stellar',
        title: 'Digitale Kunst für Anfänger: Meine Top 5 Tipps',
        slug: 'digitale-kunst-fuer-anfaenger-top-5-tipps',
        excerpt: 'Du möchtest mit digitaler Kunst starten? Hier sind meine wichtigsten Tipps für den Einstieg.',
        content: `# Digitale Kunst für Anfänger: Meine Top 5 Tipps

Als ich vor 5 Jahren mit digitaler Kunst angefangen habe, war ich völlig überfordert. Heute teile ich meine wichtigsten Erkenntnisse mit euch.

## 1. Starte mit dem was du hast

Du brauchst kein teures Grafiktablett. Viele großartige Künstler haben mit einer Maus oder einem günstigen Tablet angefangen. **Der wichtigste Schritt ist, überhaupt anzufangen.**

## 2. Lerne die Grundlagen

Bevor du in komplexe Techniken eintauchst, meistere die Basics:
- Linienführung
- Farbtheorie
- Komposition
- Licht und Schatten

## 3. Nutze kostenlose Software

Du musst kein Vermögen für Software ausgeben. **Krita** und **GIMP** sind kostenlos und extrem leistungsfähig.

## 4. Übe täglich

Auch nur 15 Minuten am Tag machen einen Unterschied. Konsistenz schlägt Intensität.

## 5. Teile deine Arbeit

Hab keine Angst, deine Werke zu zeigen. Die Community hier auf Varbe ist supportiv und hilft dir zu wachsen.

---

*Hast du Fragen? Schreib mir gerne eine Nachricht!*`,
        category: 'tutorial',
        language: 'de',
        tags: ['anfänger', 'digital', 'tipps'],
        coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 3,
        views: 234,
        likesCount: 45,
    },
    {
        authorId: 'artist_max_urban',
        title: 'Street Art in Deutschland: Die besten Spots',
        slug: 'street-art-deutschland-beste-spots',
        excerpt: 'Von Berlin bis München - hier findest du die coolsten Street Art Locations in Deutschland.',
        content: `# Street Art in Deutschland: Die besten Spots

Street Art ist mehr als Graffiti - es ist eine Kunstform die unsere Städte zum Leben erweckt.

## Berlin - Die Hauptstadt der Street Art

Berlin ist das Mekka für Street Art in Deutschland:

- **East Side Gallery** - 1.3km bemalte Berliner Mauer
- **RAW-Gelände** - Ständig wechselnde Murals
- **Kreuzberg** - Überall versteckte Gems

## Hamburg

Die Schanze und St. Pauli bieten unzählige legale Walls und beeindruckende Pieces.

## München

> "München ist sauberer, aber die Street Art die es gibt, ist dafür umso spezieller"

## Tipps für Street Art Touren

1. Nimm eine Kamera mit
2. Respektiere die Werke
3. Frag lokale Künstler nach Hidden Gems
4. Besuche legale Walls

**Welche Stadt hat die beste Street Art?** Teile deine Meinung in den Kommentaren!`,
        category: 'community',
        language: 'de',
        tags: ['streetart', 'deutschland', 'spots'],
        coverImage: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 4,
        views: 567,
        likesCount: 89,
    },
    {
        authorId: 'artist_sophie_watercolor',
        title: 'Aquarell für Einsteiger: Material-Guide',
        slug: 'aquarell-einsteiger-material-guide',
        excerpt: 'Welche Farben, Pinsel und welches Papier brauchst du wirklich? Ein ehrlicher Guide ohne Schnickschnack.',
        content: `# Aquarell für Einsteiger: Material-Guide

Aquarell ist meine große Liebe. Aber der Einstieg kann verwirrend sein - hier ist mein ehrlicher Guide.

## Das Papier - Das Wichtigste!

**Spar nicht am Papier!** Das ist der größte Fehler den Anfänger machen.

Empfehlungen:
- Mindestens 300g/m²
- Kaltgepresst für Anfänger
- Marken: Hahnemühle, Arches, Canson

## Farben

Du brauchst keine 48 Farben. Starte mit diesen 6:

1. Kadmiumgelb
2. Kadmiumrot
3. Ultramarinblau
4. Siena gebrannt
5. Paynesgrau
6. Saftgrün

## Pinsel

- 1x Rundpinsel Größe 8-10
- 1x Rundpinsel Größe 4
- 1x Flachpinsel 2cm

**Das war's!** Mehr brauchst du nicht zum Starten.

---

*Nächste Woche zeige ich euch erste Techniken!*`,
        category: 'tips',
        language: 'de',
        tags: ['aquarell', 'material', 'anfänger'],
        coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 5,
        views: 423,
        likesCount: 67,
    },
];

// English blog posts
const englishPosts = [
    {
        authorId: 'artist_james_digital',
        title: 'How to Price Your Art: A Complete Guide',
        slug: 'how-to-price-your-art-complete-guide',
        excerpt: 'Struggling with pricing? Here\'s everything you need to know about valuing your artwork.',
        content: `# How to Price Your Art: A Complete Guide

Pricing art is one of the hardest things for artists to figure out. Let me share what I've learned over 10 years.

## The Formula That Works

**Price = (Hourly Rate × Hours) + Materials + Markup**

But there's more to it than just math.

## Factors to Consider

### 1. Your Experience Level
- Beginner: Lower prices, build portfolio
- Intermediate: Market rate
- Established: Premium pricing

### 2. Size & Complexity
Larger works = more time = higher price. Simple!

### 3. Market Research
Look at what similar artists charge. Don't undercut dramatically.

## Common Mistakes

1. **Underpricing** - You're worth more than you think
2. **Inconsistent pricing** - Keep a price list
3. **Emotional pricing** - Don't price based on feelings

## My Recommendation

Start with what feels uncomfortable, then add 20%. You're probably still undercharging!

---

*Questions? Drop me a message!*`,
        category: 'tips',
        language: 'en',
        tags: ['pricing', 'business', 'tips'],
        coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 6,
        views: 892,
        likesCount: 156,
    },
    {
        authorId: 'artist_luna_stellar',
        title: 'Building Your Art Portfolio: Do\'s and Don\'ts',
        slug: 'building-art-portfolio-dos-donts',
        excerpt: 'Your portfolio is your calling card. Here\'s how to make it shine.',
        content: `# Building Your Art Portfolio: Do's and Don'ts

Your portfolio can make or break opportunities. Let me help you build one that works.

## The Do's ✅

### 1. Curate Ruthlessly
Show only your **best 10-15 pieces**. Quality over quantity, always.

### 2. Tell a Story
Arrange your work to show:
- Your range
- Your style
- Your growth

### 3. Include Process
Clients love seeing how you work. Add some work-in-progress shots.

### 4. Keep It Updated
Remove old work. Your portfolio should reflect your current skill level.

## The Don'ts ❌

### 1. Don't Include Everything
That sketch from 5 years ago? Delete it.

### 2. Don't Use Bad Photos
Blurry, poorly lit photos = amateur vibes.

### 3. Don't Copy Without Credit
If you did a study of someone else's work, label it clearly.

## Final Tip

**Get feedback before launching.** Fresh eyes catch things you miss.

---

*Show me your portfolio! Tag me on your profile.*`,
        category: 'tutorial',
        language: 'en',
        tags: ['portfolio', 'career', 'tips'],
        coverImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 4,
        views: 634,
        likesCount: 112,
    },
    {
        authorId: 'artist_max_urban',
        title: 'From Hobby to Career: My Journey as an Artist',
        slug: 'hobby-to-career-artist-journey',
        excerpt: 'How I went from weekend painter to full-time artist. The honest truth.',
        content: `# From Hobby to Career: My Journey as an Artist

5 years ago, I was working in IT and painting on weekends. Today, art is my full-time job. Here's how it happened.

## The Beginning

I never planned to be a professional artist. I just loved creating. But one day, someone offered to buy my work.

**That changed everything.**

## Year 1: Testing the Waters

- Started selling on weekends
- Built an Instagram following
- Made about €200/month

## Year 2: Getting Serious

- Quit my part-time job
- Created a proper portfolio
- First mural commission!
- Income: €800/month

## Year 3: The Leap

This was scary. I quit IT completely.

> "The day I quit my job, I was terrified. But I've never been happier."

## What I Learned

1. **Start before you're ready** - You'll never feel ready
2. **Save money first** - Have 6 months runway
3. **Diversify income** - Don't rely on one thing
4. **Network constantly** - Community is everything
5. **Keep creating** - Even when no one's watching

## Would I Do It Again?

100%. Best decision of my life.

---

*If you're thinking about making the leap, my DMs are open.*`,
        category: 'artist_spotlight',
        language: 'en',
        tags: ['career', 'story', 'inspiration'],
        coverImage: 'https://images.unsplash.com/photo-1456086272160-b28b0645b729?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 5,
        views: 1245,
        likesCount: 234,
    },
    {
        authorId: 'artist_sophie_watercolor',
        title: 'Color Theory Basics Every Artist Should Know',
        slug: 'color-theory-basics-every-artist',
        excerpt: 'Understanding color will transform your art. Here are the fundamentals.',
        content: `# Color Theory Basics Every Artist Should Know

Color is one of the most powerful tools in an artist's arsenal. Let's break it down.

## The Color Wheel

Start here. Everything builds on this.

### Primary Colors
- Red
- Yellow
- Blue

### Secondary Colors
- Orange (Red + Yellow)
- Green (Yellow + Blue)
- Purple (Blue + Red)

## Color Relationships

### Complementary
Colors opposite each other on the wheel. Creates **contrast and energy**.

Examples:
- Blue & Orange
- Red & Green
- Yellow & Purple

### Analogous
Colors next to each other. Creates **harmony and cohesion**.

## Color Temperature

**Warm colors** (red, orange, yellow):
- Feel energetic
- Advance in space
- Evoke excitement

**Cool colors** (blue, green, purple):
- Feel calming
- Recede in space
- Evoke tranquility

## Practical Tips

1. **Limit your palette** - 3-5 colors max
2. **Establish dominance** - One color should lead
3. **Use neutrals** - They make colors pop
4. **Trust the wheel** - It doesn't lie

---

*Want me to analyze your color choices? Share your work!*`,
        category: 'tutorial',
        language: 'en',
        tags: ['color', 'theory', 'basics'],
        coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=400&fit=crop',
        status: 'published',
        readTimeMinutes: 4,
        views: 567,
        likesCount: 98,
    },
];

// ========================================
// FEED POSTS (verschiedene Typen)
// ========================================

const feedPosts = [
    // Artwork Post mit Bild
    {
        artistId: 'artist_luna_stellar',
        type: 'artwork',
        text: '✨ Neues Werk fertig! "Cosmic Dreams" - Digitale Malerei, 4000x3000px. Diese Arbeit hat mich 3 Wochen gekostet, aber ich bin so happy mit dem Ergebnis! 🌌\n\nWas denkt ihr - soll ich mehr kosmische Themen machen?\n\n#digitalart #cosmic #art #künstler',
        images: ['https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&h=800&fit=crop'],
        tags: ['digitalart', 'cosmic', 'newwork'],
        visibility: 'public',
        likesCount: 234,
        commentsCount: 45,
        sharesCount: 12,
    },
    // Sketch/WIP Post
    {
        artistId: 'artist_sophie_watercolor',
        type: 'sketch',
        text: '📝 Schnelle Skizze von heute morgen im Park. Manchmal sind die spontanen Zeichnungen die besten!\n\nIch liebe es, einfach rauszugehen und zu zeichnen ohne Plan. Macht ihr das auch?',
        images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'],
        tags: ['sketch', 'pleinair', 'zeichnung'],
        visibility: 'public',
        likesCount: 156,
        commentsCount: 23,
        sharesCount: 5,
    },
    // Process Post (mehrere Bilder)
    {
        artistId: 'artist_max_urban',
        type: 'process',
        text: '🎨 PROCESS POST: Vom leeren Wand zum fertigen Mural!\n\nSwipe durch um den ganzen Prozess zu sehen →\n\n1️⃣ Skizze\n2️⃣ Grundierung\n3️⃣ Base Colors\n4️⃣ Details\n5️⃣ Fertig!\n\nDas Projekt hat 4 Tage gedauert. Danke an alle die vorbei gekommen sind! 🙏',
        images: [
            'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1551913902-c92207136625?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1561059488-916d69792237?w=800&h=600&fit=crop',
        ],
        tags: ['mural', 'streetart', 'process'],
        visibility: 'public',
        likesCount: 567,
        commentsCount: 89,
        sharesCount: 34,
    },
    // Thought/Text-only Post
    {
        artistId: 'artist_james_digital',
        type: 'thought',
        text: '💭 Unpopular Opinion:\n\nDu musst nicht jeden Tag posten um als Künstler erfolgreich zu sein.\n\nQualität > Quantität. Immer.\n\nLieber ein richtig gutes Werk pro Woche als 7 mittelmäßige.\n\nWer stimmt zu? 👇',
        images: [],
        tags: ['gedanken', 'artistlife', 'motivation'],
        visibility: 'public',
        likesCount: 892,
        commentsCount: 156,
        sharesCount: 78,
    },
    // Update Post
    {
        artistId: 'artist_luna_stellar',
        type: 'update',
        text: '📢 UPDATE: Meine Prints sind jetzt auch in A2 verfügbar!\n\nViele haben danach gefragt - jetzt ist es soweit. Schaut in meinem Shop vorbei!\n\nLink in Bio 🔗',
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop'],
        tags: ['prints', 'shop', 'news'],
        visibility: 'public',
        likesCount: 123,
        commentsCount: 34,
        sharesCount: 8,
    },
    // Announcement Post
    {
        artistId: 'artist_sophie_watercolor',
        type: 'announcement',
        text: '🎉 EXCITING NEWS!\n\nIch werde nächsten Monat einen Aquarell-Workshop geben!\n\n📅 Datum: 15. Februar\n📍 Ort: Kunstverein München\n💰 Preis: 89€ (Material inklusive)\n\nNur 12 Plätze verfügbar. Wer ist dabei?',
        images: ['https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop'],
        tags: ['workshop', 'aquarell', 'münchen'],
        visibility: 'public',
        likesCount: 234,
        commentsCount: 67,
        sharesCount: 45,
    },
    // Another Artwork Post
    {
        artistId: 'artist_james_digital',
        type: 'artwork',
        text: '🖼️ "The Last Pixel" - Character Design für ein unveröffentlichtes Projekt\n\nKann noch nicht viel verraten, aber dieser Character ist einer meiner Favoriten!\n\nTools: Photoshop + Wacom\nZeit: ca. 20 Stunden',
        images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=800&fit=crop'],
        tags: ['characterdesign', 'digital', 'conceptart'],
        visibility: 'public',
        likesCount: 445,
        commentsCount: 78,
        sharesCount: 23,
    },
    // Casual Update
    {
        artistId: 'artist_max_urban',
        type: 'update',
        text: 'Studio-Update: Endlich aufgeräumt! 🧹\n\nWer kennt es - manchmal muss man erstmal Chaos beseitigen bevor die Kreativität fließen kann.\n\nWie sieht euer Arbeitsplatz gerade aus? (Honest answers only 😂)',
        images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'],
        tags: ['studio', 'artistlife', 'workspace'],
        visibility: 'public',
        likesCount: 189,
        commentsCount: 56,
        sharesCount: 3,
    },
];

// ========================================
// COMMENTS für Posts
// ========================================

const sampleComments = [
    { text: 'Wow, das ist unglaublich! 😍', userId: 'artist_sophie_watercolor' },
    { text: 'Die Farben sind der Wahnsinn!', userId: 'artist_max_urban' },
    { text: 'How long did this take you?', userId: 'artist_james_digital' },
    { text: 'So inspiring! Keep up the great work 💪', userId: 'artist_luna_stellar' },
    { text: 'Das muss ich unbedingt auch mal probieren', userId: 'artist_sophie_watercolor' },
    { text: 'Der Prozess ist mega interessant zu sehen', userId: 'artist_max_urban' },
    { text: 'Absolut agreed! Quality over quantity always', userId: 'artist_james_digital' },
    { text: 'Ich wäre so dabei! Wo kann man sich anmelden?', userId: 'artist_luna_stellar' },
    { text: 'Die Details sind crazy 🔥', userId: 'artist_sophie_watercolor' },
    { text: 'Love the color palette!', userId: 'artist_max_urban' },
    { text: 'Danke für den Tipp! Hab direkt bestellt', userId: 'artist_james_digital' },
    { text: 'Mein Workspace sieht NICHT so aufgeräumt aus 😅', userId: 'artist_luna_stellar' },
];

export default function SeedBlogPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<string[]>([]);
    const [seeding, setSeeding] = useState(false);
    const [done, setDone] = useState(false);

    const addStatus = (msg: string) => {
        setStatus(prev => [...prev, msg]);
    };

    // Helper to add delay between operations
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Update existing artists with demo disclaimer
    const updateExistingArtists = async () => {
        setSeeding(true);
        setStatus([]);
        addStatus('⚠️ Aktualisiere bestehende Demo-Accounts...');

        try {
            for (const artist of artists) {
                await delay(200);
                await updateDoc(doc(db, 'users', artist.uid), {
                    bio: artist.bio,
                    isDemo: true,
                });
                addStatus(`  ✅ ${artist.displayName} aktualisiert`);
            }

            addStatus('');
            addStatus('🎉 FERTIG! Alle Demo-Accounts wurden aktualisiert.');
            addStatus('Die Bio enthält jetzt den Hinweis, dass es Demo-Accounts sind.');
            setDone(true);
        } catch (error: any) {
            addStatus(`❌ Fehler: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    const seedDatabase = async () => {
        setSeeding(true);
        addStatus('🚀 Starte Seeding...');

        try {
            // Create artists
            addStatus('👥 Erstelle Künstler-Accounts...');
            for (const artist of artists) {
                await delay(200);
                await setDoc(doc(db, 'users', artist.uid), {
                    ...artist,
                    createdAt: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
                });
                addStatus(`  ✅ ${artist.displayName}`);
            }

            // Create German posts
            addStatus('🇩🇪 Erstelle deutsche Blog-Posts...');
            for (const post of germanPosts) {
                await delay(200);
                await addDoc(collection(db, 'blogPosts'), {
                    ...post,
                    publishedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                    createdAt: Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
                });
                addStatus(`  ✅ ${post.title}`);
            }

            // Create English posts
            addStatus('🇬🇧 Erstelle englische Blog-Posts...');
            for (const post of englishPosts) {
                await delay(200);
                await addDoc(collection(db, 'blogPosts'), {
                    ...post,
                    publishedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                    createdAt: Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
                });
                addStatus(`  ✅ ${post.title}`);
            }

            // Create Feed Posts
            addStatus('');
            addStatus('📱 Erstelle Feed-Posts...');
            const createdPostIds: string[] = [];
            for (const post of feedPosts) {
                await delay(300); // Small delay to avoid rate limits
                const postRef = await addDoc(collection(db, 'feed_posts'), {
                    ...post,
                    createdAt: Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
                });
                createdPostIds.push(postRef.id);
                addStatus(`  ✅ ${post.type}: "${post.text.substring(0, 40)}..."`);
            }

            // Create Comments for Posts
            addStatus('');
            addStatus('💬 Erstelle Kommentare...');
            for (let i = 0; i < createdPostIds.length; i++) {
                const postId = createdPostIds[i];
                // Add 2-4 random comments per post
                const numComments = Math.floor(Math.random() * 3) + 2;
                for (let j = 0; j < numComments; j++) {
                    await delay(100);
                    const comment = sampleComments[(i + j) % sampleComments.length];
                    await addDoc(collection(db, 'feed_comments'), {
                        postId,
                        userId: comment.userId,
                        text: comment.text,
                        likesCount: Math.floor(Math.random() * 20),
                        createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                    });
                }
                addStatus(`  ✅ ${numComments} Kommentare für Post ${i + 1}`);
            }

            // Create Likes for Posts
            addStatus('');
            addStatus('❤️ Erstelle Likes...');
            const artistIds = artists.map(a => a.uid);
            for (const postId of createdPostIds) {
                await delay(100);
                // Each artist likes some random posts
                for (const artistId of artistIds) {
                    if (Math.random() > 0.3) { // 70% chance to like
                        await addDoc(collection(db, 'feed_likes'), {
                            postId,
                            userId: artistId,
                            createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                        });
                    }
                }
            }
            addStatus(`  ✅ Likes verteilt`);

            // Create Reposts (Quote Reposts)
            addStatus('');
            addStatus('🔄 Erstelle Reposts...');
            const repostComments = [
                'Das muss man gesehen haben! 👀',
                'Incredible work by an amazing artist!',
                'So true! 💯',
                'Inspiration pur!',
                'Teile ich gerne weiter!',
            ];
            // Create 3-4 reposts
            for (let i = 0; i < 4; i++) {
                await delay(200);
                const originalPostId = createdPostIds[Math.floor(Math.random() * createdPostIds.length)];
                const reposterId = artistIds[(i + 1) % artistIds.length];
                await addDoc(collection(db, 'feed_reposts'), {
                    originalPostId,
                    userId: reposterId,
                    comment: repostComments[i % repostComments.length],
                    createdAt: Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000,
                });
                addStatus(`  ✅ Repost ${i + 1}`);
            }

            // Create Follows between artists
            addStatus('');
            addStatus('👥 Erstelle Follows...');
            for (let i = 0; i < artistIds.length; i++) {
                for (let j = 0; j < artistIds.length; j++) {
                    if (i !== j && Math.random() > 0.3) {
                        await delay(50);
                        await addDoc(collection(db, 'follows'), {
                            followerId: artistIds[i],
                            followingId: artistIds[j],
                            notifyOnPost: Math.random() > 0.5,
                            createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
                        });
                    }
                }
            }
            addStatus(`  ✅ Follows erstellt`);

            addStatus('');
            addStatus('🎉 FERTIG! Alle Daten wurden erstellt.');
            addStatus('');
            addStatus('Erstellt:');
            addStatus(`  • ${artists.length} Künstler-Accounts`);
            addStatus(`  • ${germanPosts.length + englishPosts.length} Blog-Posts`);
            addStatus(`  • ${feedPosts.length} Feed-Posts`);
            addStatus(`  • Kommentare, Likes, Reposts & Follows`);
            setDone(true);
        } catch (error: any) {
            addStatus(`❌ Fehler: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white border-4 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-3xl font-heading uppercase mb-4">🌱 DATABASE SEEDING</h1>
                    
                    <div className="text-blue-600 p-4 bg-blue-100 border-2 border-blue-300 mb-4">
                        ℹ️ Firestore-Regeln erlauben Seeding. Klicke den Button um fortzufahren.
                    </div>

                    <div className="mb-6">
                        <p className="mb-2">Dies wird erstellen:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                            <li>4 verifizierte Künstler-Accounts <span className="text-orange-600">(mit Demo-Hinweis)</span></li>
                            <li>3 deutsche Blog-Posts + 4 englische Blog-Posts</li>
                            <li>8 Feed-Posts (artwork, sketch, process, thought, update, announcement)</li>
                            <li>Kommentare auf allen Posts</li>
                            <li>Likes zwischen Künstlern</li>
                            <li>Reposts/Retweets</li>
                            <li>Follows zwischen Künstlern</li>
                        </ul>
                    </div>

                    {!done && (
                        <div className="space-y-3">
                            <Button 
                                variant="accent" 
                                onClick={seedDatabase}
                                disabled={seeding}
                                className="w-full text-xl py-4"
                            >
                                {seeding ? '⏳ Seeding läuft...' : '🚀 DATENBANK SEEDEN'}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={updateExistingArtists}
                                disabled={seeding}
                                className="w-full py-3"
                            >
                                ⚠️ Nur Demo-Hinweis zu bestehenden Accounts hinzufügen
                            </Button>
                        </div>
                    )}

                    {status.length > 0 && (
                        <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm max-h-96 overflow-y-auto">
                            {status.map((s, i) => (
                                <div key={i}>{s}</div>
                            ))}
                        </div>
                    )}

                    {done && (
                        <div className="mt-6 space-y-2">
                            <a href="/de/feed" className="text-accent underline font-heading block">
                                → Zum Feed
                            </a>
                            <a href="/de/blog" className="text-accent underline font-heading block">
                                → Zum Blog
                            </a>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

