import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Sample artists data
const artists = [
    {
        uid: 'artist_luna_stellar',
        email: 'luna@varbe.art',
        displayName: 'Luna Stellar',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        bio: 'Digital artist from Berlin. Creating cosmic and ethereal artworks.',
        location: 'Berlin, Germany',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
        uid: 'artist_max_urban',
        email: 'max@varbe.art',
        displayName: 'Max Urban',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        bio: 'Street artist and muralist. Bringing color to urban spaces.',
        location: 'Hamburg, Germany',
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    },
    {
        uid: 'artist_sophie_watercolor',
        email: 'sophie@varbe.art',
        displayName: 'Sophie Aquarell',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        bio: 'Watercolor enthusiast. Nature and botanical illustrations.',
        location: 'München, Germany',
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    },
    {
        uid: 'artist_james_digital',
        email: 'james@varbe.art',
        displayName: 'James Digital',
        role: 'seller',
        verificationStatus: 'verified',
        profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        bio: 'Concept artist and illustrator. Working in games and entertainment.',
        location: 'London, UK',
        createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
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
        publishedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
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
        publishedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
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

## Zusätzliches

- 2 Wasserbehälter (einer zum Reinigen, einer für sauberes Wasser)
- Küchenpapier
- Mischpalette

---

*Nächste Woche zeige ich euch erste Techniken!*`,
        category: 'tips',
        language: 'de',
        tags: ['aquarell', 'material', 'anfänger'],
        coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop',
        status: 'published',
        publishedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
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

## The Psychology of Pricing

> "If you price too low, people assume low quality"

A higher price can actually increase perceived value.

## My Recommendation

Start with what feels uncomfortable, then add 20%. You're probably still undercharging!

---

*Questions? Drop me a message!*`,
        category: 'tips',
        language: 'en',
        tags: ['pricing', 'business', 'tips'],
        coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        status: 'published',
        publishedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
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

## Platform Recommendations

| Platform | Best For |
|----------|----------|
| Varbe | Selling originals |
| ArtStation | Game/Entertainment art |
| Behance | Design work |
| Instagram | Building audience |

## Final Tip

**Get feedback before launching.** Fresh eyes catch things you miss.

---

*Show me your portfolio! Tag me on your profile.*`,
        category: 'tutorial',
        language: 'en',
        tags: ['portfolio', 'career', 'tips'],
        coverImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop',
        status: 'published',
        publishedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
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

## Year 4-5: Growth

- Multiple income streams
- Regular commissions
- Teaching workshops
- Income: €3000+/month

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
        publishedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
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

### Triadic
Three colors equally spaced. Creates **balance with variety**.

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

## Exercise

Take a painting you love and analyze its color choices. What relationships do you see?

---

*Want me to analyze your color choices? Share your work!*`,
        category: 'tutorial',
        language: 'en',
        tags: ['color', 'theory', 'basics'],
        coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=400&fit=crop',
        status: 'published',
        publishedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
];

function calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export async function POST(request: Request) {
    // Check for authorization header (simple protection)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer seed-varbe-2025') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Create artist users
        for (const artist of artists) {
            await setDoc(doc(db, 'users', artist.uid), {
                ...artist,
                followersCount: Math.floor(Math.random() * 500) + 50,
                followingCount: Math.floor(Math.random() * 100) + 10,
                postsCount: Math.floor(Math.random() * 50) + 5,
            });
            console.log(`Created artist: ${artist.displayName}`);
        }

        // Create German blog posts
        for (const post of germanPosts) {
            await addDoc(collection(db, 'blogPosts'), {
                ...post,
                readTimeMinutes: calculateReadTime(post.content),
                views: Math.floor(Math.random() * 500) + 50,
                likesCount: Math.floor(Math.random() * 100) + 10,
                createdAt: post.publishedAt,
            });
            console.log(`Created German post: ${post.title}`);
        }

        // Create English blog posts
        for (const post of englishPosts) {
            await addDoc(collection(db, 'blogPosts'), {
                ...post,
                readTimeMinutes: calculateReadTime(post.content),
                views: Math.floor(Math.random() * 500) + 50,
                likesCount: Math.floor(Math.random() * 100) + 10,
                createdAt: post.publishedAt,
            });
            console.log(`Created English post: ${post.title}`);
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Seeded database successfully',
            artists: artists.length,
            germanPosts: germanPosts.length,
            englishPosts: englishPosts.length
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ 
            error: 'Failed to seed database',
            details: error?.message || String(error),
            code: error?.code
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Use POST with Authorization header to seed the database' 
    });
}

