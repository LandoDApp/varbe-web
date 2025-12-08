/**
 * Seed script to populate Firebase with test data for Local and Challenges features
 * Run this once to create test artists, events, and challenges
 */

import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, writeBatch, doc, setDoc } from "firebase/firestore";
import { LocalArtist, LocalEvent, Challenge, ArtistMedium } from "@/types";

// ========================================
// TEST ARTISTS - Scattered around the world
// ========================================

const TEST_ARTISTS: Omit<LocalArtist, 'id' | 'createdAt'>[] = [
    // Germany
    {
        userId: 'seed_artist_1',
        displayName: 'MaxDigital',
        artistName: 'Max Mustermann',
        bio: 'Digital artist specializing in cyberpunk aesthetics and futuristic cityscapes. Open for commissions! 🌃',
        medium: 'digital',
        profilePictureUrl: '',
        location: {
            city: 'Bremen',
            country: 'Germany',
            latitude: 53.0793,
            longitude: 8.8017
        },
        openForCommissions: true,
        openStudio: true,
        openForCollabs: true,
        studioHours: 'Fridays 14:00-18:00',
        followersCount: 1234,
        artworksCount: 45,
        availableForMeetup: true,
        meetupMessage: 'Grab a coffee this week? ☕',
        featuredArtworks: []
    },
    {
        userId: 'seed_artist_2',
        displayName: 'BerlinPainter',
        artistName: 'Lisa Schmidt',
        bio: 'Oil painter focused on abstract expressionism. Studio in Kreuzberg with regular open days.',
        medium: 'traditional',
        profilePictureUrl: '',
        location: {
            city: 'Berlin',
            country: 'Germany',
            latitude: 52.5200,
            longitude: 13.4050
        },
        openForCommissions: true,
        openStudio: true,
        openForCollabs: false,
        studioHours: 'Saturdays 10:00-16:00',
        followersCount: 2567,
        artworksCount: 89,
        availableForMeetup: false,
        featuredArtworks: []
    },
    {
        userId: 'seed_artist_3',
        displayName: 'MunichPhoto',
        artistName: 'Thomas Foto',
        bio: 'Street photographer capturing urban moments. Available for collaborations and workshops.',
        medium: 'photography',
        profilePictureUrl: '',
        location: {
            city: 'Munich',
            country: 'Germany',
            latitude: 48.1351,
            longitude: 11.5820
        },
        openForCommissions: false,
        openStudio: false,
        openForCollabs: true,
        followersCount: 3421,
        artworksCount: 234,
        availableForMeetup: true,
        meetupMessage: 'Looking for photo walk buddies!',
        featuredArtworks: []
    },
    
    // USA
    {
        userId: 'seed_artist_4',
        displayName: 'NYCIllustrator',
        artistName: 'Jennifer Arts',
        bio: 'Character designer and illustrator. Creating worlds one drawing at a time. ✨',
        medium: 'illustration',
        profilePictureUrl: '',
        location: {
            city: 'New York',
            country: 'USA',
            latitude: 40.7128,
            longitude: -74.0060
        },
        openForCommissions: true,
        openStudio: false,
        openForCollabs: true,
        followersCount: 8945,
        artworksCount: 156,
        availableForMeetup: false,
        featuredArtworks: []
    },
    {
        userId: 'seed_artist_5',
        displayName: 'LADigitalArt',
        artistName: 'Mike Creative',
        bio: 'Motion graphics and digital art. Working with brands and indie projects.',
        medium: 'digital',
        profilePictureUrl: '',
        location: {
            city: 'Los Angeles',
            country: 'USA',
            latitude: 34.0522,
            longitude: -118.2437
        },
        openForCommissions: true,
        openStudio: true,
        openForCollabs: true,
        studioHours: 'By appointment',
        followersCount: 5678,
        artworksCount: 78,
        availableForMeetup: true,
        meetupMessage: 'Coffee in WeHo?',
        featuredArtworks: []
    },
    
    // UK
    {
        userId: 'seed_artist_6',
        displayName: 'LondonSculptor',
        artistName: 'Emma Stone',
        bio: 'Contemporary sculptor working with recycled materials. Studio visits welcome!',
        medium: 'sculpture',
        profilePictureUrl: '',
        location: {
            city: 'London',
            country: 'UK',
            latitude: 51.5074,
            longitude: -0.1278
        },
        openForCommissions: true,
        openStudio: true,
        openForCollabs: true,
        studioHours: 'Wed-Sat 11:00-17:00',
        followersCount: 4321,
        artworksCount: 34,
        availableForMeetup: true,
        meetupMessage: 'Fancy a gallery walk?',
        featuredArtworks: []
    },
    
    // Japan
    {
        userId: 'seed_artist_7',
        displayName: 'TokyoManga',
        artistName: 'Yuki Tanaka',
        bio: 'Manga artist and character designer. Working on my first serialized manga! 🎌',
        medium: 'illustration',
        profilePictureUrl: '',
        location: {
            city: 'Tokyo',
            country: 'Japan',
            latitude: 35.6762,
            longitude: 139.6503
        },
        openForCommissions: true,
        openStudio: false,
        openForCollabs: true,
        followersCount: 15678,
        artworksCount: 456,
        availableForMeetup: false,
        featuredArtworks: []
    },
    
    // France
    {
        userId: 'seed_artist_8',
        displayName: 'ParisArtiste',
        artistName: 'Marie Dubois',
        bio: 'Mixed media artist exploring identity and memory. Exhibitions across Europe.',
        medium: 'mixed',
        profilePictureUrl: '',
        location: {
            city: 'Paris',
            country: 'France',
            latitude: 48.8566,
            longitude: 2.3522
        },
        openForCommissions: false,
        openStudio: true,
        openForCollabs: true,
        studioHours: 'Thursdays 14:00-19:00',
        followersCount: 6789,
        artworksCount: 67,
        availableForMeetup: true,
        meetupMessage: 'Meet at Musée d\'Orsay?',
        featuredArtworks: []
    },
    
    // Australia
    {
        userId: 'seed_artist_9',
        displayName: 'SydneyStreetArt',
        artistName: 'Jake Wilson',
        bio: 'Street artist and muralist. Painting the city one wall at a time. 🎨',
        medium: 'traditional',
        profilePictureUrl: '',
        location: {
            city: 'Sydney',
            country: 'Australia',
            latitude: -33.8688,
            longitude: 151.2093
        },
        openForCommissions: true,
        openStudio: false,
        openForCollabs: true,
        followersCount: 7890,
        artworksCount: 123,
        availableForMeetup: true,
        meetupMessage: 'Doing a mural this weekend, come watch!',
        featuredArtworks: []
    },
    
    // Brazil
    {
        userId: 'seed_artist_10',
        displayName: 'RioColors',
        artistName: 'Ana Silva',
        bio: 'Vibrant digital illustrations celebrating Brazilian culture and nature.',
        medium: 'digital',
        profilePictureUrl: '',
        location: {
            city: 'Rio de Janeiro',
            country: 'Brazil',
            latitude: -22.9068,
            longitude: -43.1729
        },
        openForCommissions: true,
        openStudio: false,
        openForCollabs: true,
        followersCount: 4567,
        artworksCount: 89,
        availableForMeetup: false,
        featuredArtworks: []
    }
];

// ========================================
// TEST EVENTS
// ========================================

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const TEST_EVENTS: Omit<LocalEvent, 'id' | 'createdAt' | 'attendeesCount' | 'attendees' | 'artistsCount' | 'participatingArtists'>[] = [
    {
        hostId: 'seed_artist_1',
        hostName: '@MaxDigital',
        title: 'FRIDAY ART WALK',
        description: 'Join us for our monthly art walk in Bremen! Local artists showing their latest work. Food trucks, live music, and good vibes. Bring your friends!',
        category: 'art_walk',
        imageUrl: '',
        date: now + 7 * DAY,
        startTime: '18:00',
        endTime: '22:00',
        location: {
            name: 'Kunstquartier Bremen',
            address: 'Schwachhauser Str. 12',
            city: 'Bremen',
            country: 'Germany',
            latitude: 53.0800,
            longitude: 8.8050
        },
        freeEntry: true,
        featured: true
    },
    {
        hostId: 'seed_artist_2',
        hostName: '@BerlinPainter',
        title: 'OPEN STUDIO KREUZBERG',
        description: 'Visit local artist studios in Kreuzberg! See how art is made, meet the creators, and discover new talent. Refreshments provided.',
        category: 'open_studio',
        imageUrl: '',
        date: now + 10 * DAY,
        startTime: '14:00',
        endTime: '18:00',
        location: {
            name: 'Studio Collective Kreuzberg',
            address: 'Oranienstraße 25',
            city: 'Berlin',
            country: 'Germany',
            latitude: 52.4990,
            longitude: 13.4184
        },
        freeEntry: true,
        featured: false
    },
    {
        hostId: 'seed_artist_4',
        hostName: '@NYCIllustrator',
        title: 'DIGITAL ART SHOWCASE NYC',
        description: 'A showcase of the best digital artists in New York. Interactive installations, live digital painting sessions, and networking.',
        category: 'exhibition',
        imageUrl: '',
        date: now + 14 * DAY,
        startTime: '16:00',
        endTime: '21:00',
        location: {
            name: 'Brooklyn Digital Art Center',
            address: '123 Bedford Ave',
            city: 'New York',
            country: 'USA',
            latitude: 40.7193,
            longitude: -73.9571
        },
        freeEntry: false,
        price: 15,
        featured: true
    },
    {
        hostId: 'seed_artist_6',
        hostName: '@LondonSculptor',
        title: 'SCULPTURE WORKSHOP',
        description: 'Learn the basics of sculpture with recycled materials. All skill levels welcome. Materials provided.',
        category: 'workshop',
        imageUrl: '',
        date: now + 21 * DAY,
        startTime: '11:00',
        endTime: '15:00',
        location: {
            name: 'The Sculpture Studio',
            address: 'Shoreditch High Street',
            city: 'London',
            country: 'UK',
            latitude: 51.5242,
            longitude: -0.0756
        },
        freeEntry: false,
        price: 45,
        featured: false
    },
    {
        hostId: 'seed_artist_7',
        hostName: '@TokyoManga',
        title: 'MANGA MEETUP TOKYO',
        description: 'Monthly meetup for manga artists and enthusiasts. Share your work, get feedback, and make friends!',
        category: 'meetup',
        imageUrl: '',
        date: now + 5 * DAY,
        startTime: '19:00',
        endTime: '22:00',
        location: {
            name: 'Akihabara Community Center',
            address: 'Sotokanda 1-1-1',
            city: 'Tokyo',
            country: 'Japan',
            latitude: 35.7023,
            longitude: 139.7745
        },
        freeEntry: true,
        featured: false
    }
];

// ========================================
// TEST CHALLENGES
// ========================================

const weekNumber = Math.ceil((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * DAY));

const TEST_CHALLENGES: Omit<Challenge, 'id' | 'createdAt' | 'submissionsCount' | 'participantsCount'>[] = [
    {
        title: 'CYBERPUNK CITYSCAPE',
        prompt: 'Create a futuristic cityscape with neon lights, flying vehicles, and rain-soaked streets. Think Blade Runner meets your personal style. Focus on atmosphere and mood lighting.',
        type: 'weekly',
        difficulty: 'medium',
        mediumRestriction: 'any',
        startDate: now - 5 * DAY,
        endDate: now + 2 * DAY,
        status: 'active',
        featured: true,
        week: weekNumber,
        prize: 'Featured on Homepage + Badge',
        rules: [
            'Any medium allowed',
            'Original work only (no AI!)',
            'Submit by deadline',
            'Max 1 submission per artist'
        ],
        inspirationImages: []
    },
    {
        title: 'MINIMALIST LANDSCAPE',
        prompt: 'Less is more. Create a landscape using minimal elements - focus on negative space, simple shapes, and limited color palettes.',
        type: 'weekly',
        difficulty: 'easy',
        mediumRestriction: 'any',
        startDate: now - 3 * DAY,
        endDate: now + 5 * DAY,
        status: 'active',
        featured: false,
        week: weekNumber,
        prize: 'Badge + Artist Spotlight',
        rules: [
            'Any medium allowed',
            'Maximum 5 colors',
            'Original work only'
        ],
        inspirationImages: []
    },
    {
        title: 'PORTRAIT CHALLENGE',
        prompt: 'Create a portrait that tells a story. It can be realistic, abstract, or stylized - focus on emotion and character.',
        type: 'weekly',
        difficulty: 'medium',
        mediumRestriction: 'any',
        startDate: now - 2 * DAY,
        endDate: now + 7 * DAY,
        status: 'active',
        featured: false,
        week: weekNumber,
        prize: 'Badge',
        rules: [
            'Any medium allowed',
            'Original work only',
            'Can be self-portrait or fictional character'
        ],
        inspirationImages: []
    },
    {
        title: 'ABSTRACT EMOTIONS',
        prompt: 'Express an emotion through abstract art. No figurative elements - use color, shape, texture, and composition to convey feeling.',
        type: 'weekly',
        difficulty: 'hard',
        mediumRestriction: 'any',
        startDate: now - 1 * DAY,
        endDate: now + 3 * DAY,
        status: 'active',
        featured: false,
        week: weekNumber,
        prize: 'Badge',
        rules: [
            'No figurative elements',
            'Original work only',
            'Include emotion in title'
        ],
        inspirationImages: []
    },
    // Upcoming
    {
        title: 'WINTER WONDERLAND',
        prompt: 'Create a magical winter scene. Snow, ice, northern lights - make it magical!',
        type: 'weekly',
        difficulty: 'easy',
        mediumRestriction: 'any',
        startDate: now + 7 * DAY,
        endDate: now + 14 * DAY,
        status: 'upcoming',
        featured: true,
        week: weekNumber + 1,
        prize: 'Badge + Featured',
        rules: [],
        inspirationImages: []
    },
    {
        title: 'CHARACTER DESIGN CHALLENGE',
        prompt: 'Design an original character with a unique backstory. Show them in their natural environment.',
        type: 'weekly',
        difficulty: 'medium',
        mediumRestriction: 'any',
        startDate: now + 14 * DAY,
        endDate: now + 21 * DAY,
        status: 'upcoming',
        featured: false,
        week: weekNumber + 2,
        prize: 'Badge',
        rules: [],
        inspirationImages: []
    },
    // Past
    {
        title: 'RETRO FUTURISM',
        prompt: '1980s vision of the future. Synthesizers, VHS aesthetics, and chrome dreams.',
        type: 'weekly',
        difficulty: 'medium',
        mediumRestriction: 'any',
        startDate: now - 14 * DAY,
        endDate: now - 7 * DAY,
        status: 'ended',
        featured: false,
        week: weekNumber - 1,
        prize: 'Badge',
        rules: [],
        winnerId: 'seed_artist_5',
        inspirationImages: []
    },
    {
        title: 'NATURE CLOSE-UP',
        prompt: 'Capture the beauty of nature up close. Macro photography, detailed illustrations, or abstract interpretations.',
        type: 'weekly',
        difficulty: 'easy',
        mediumRestriction: 'any',
        startDate: now - 21 * DAY,
        endDate: now - 14 * DAY,
        status: 'ended',
        featured: false,
        week: weekNumber - 2,
        prize: 'Badge',
        rules: [],
        winnerId: 'seed_artist_3',
        inspirationImages: []
    }
];

// ========================================
// SEED FUNCTIONS
// ========================================

/**
 * Seed local artists to Firebase
 */
export const seedLocalArtists = async (): Promise<void> => {
    console.log("🌱 Seeding local artists...");
    
    try {
        const batch = writeBatch(db);
        const artistsRef = collection(db, "localArtists");
        
        for (const artist of TEST_ARTISTS) {
            const docRef = doc(artistsRef);
            batch.set(docRef, {
                ...artist,
                createdAt: Date.now()
            });
        }
        
        await batch.commit();
        console.log(`✅ Seeded ${TEST_ARTISTS.length} local artists`);
    } catch (error) {
        console.error("❌ Error seeding artists:", error);
        throw error;
    }
};

/**
 * Seed local events to Firebase
 */
export const seedLocalEvents = async (): Promise<void> => {
    console.log("🌱 Seeding local events...");
    
    try {
        const batch = writeBatch(db);
        const eventsRef = collection(db, "localEvents");
        
        for (const event of TEST_EVENTS) {
            const docRef = doc(eventsRef);
            batch.set(docRef, {
                ...event,
                attendeesCount: Math.floor(Math.random() * 50) + 10,
                attendees: [],
                artistsCount: Math.floor(Math.random() * 15) + 3,
                participatingArtists: [],
                createdAt: Date.now()
            });
        }
        
        await batch.commit();
        console.log(`✅ Seeded ${TEST_EVENTS.length} local events`);
    } catch (error) {
        console.error("❌ Error seeding events:", error);
        throw error;
    }
};

/**
 * Seed challenges to Firebase
 */
export const seedChallenges = async (): Promise<void> => {
    console.log("🌱 Seeding challenges...");
    
    try {
        const batch = writeBatch(db);
        const challengesRef = collection(db, "challenges");
        
        for (const challenge of TEST_CHALLENGES) {
            const docRef = doc(challengesRef);
            batch.set(docRef, {
                ...challenge,
                submissionsCount: challenge.status === 'ended' 
                    ? Math.floor(Math.random() * 500) + 200 
                    : challenge.status === 'active' 
                        ? Math.floor(Math.random() * 300) + 50 
                        : 0,
                participantsCount: challenge.status === 'ended'
                    ? Math.floor(Math.random() * 600) + 250
                    : challenge.status === 'active'
                        ? Math.floor(Math.random() * 400) + 100
                        : 0,
                createdAt: Date.now()
            });
        }
        
        await batch.commit();
        console.log(`✅ Seeded ${TEST_CHALLENGES.length} challenges`);
    } catch (error) {
        console.error("❌ Error seeding challenges:", error);
        throw error;
    }
};

/**
 * Seed all data
 */
export const seedAllData = async (): Promise<void> => {
    console.log("🚀 Starting full data seed...\n");
    
    await seedLocalArtists();
    await seedLocalEvents();
    await seedChallenges();
    
    console.log("\n✅ All data seeded successfully!");
};

/**
 * Clear all seeded data (for testing)
 */
export const clearSeededData = async (): Promise<void> => {
    console.log("🗑️ Clearing seeded data...");
    
    try {
        // Clear local artists
        const artistsSnapshot = await getDocs(collection(db, "localArtists"));
        const artistBatch = writeBatch(db);
        artistsSnapshot.docs.forEach(d => artistBatch.delete(d.ref));
        await artistBatch.commit();
        
        // Clear local events
        const eventsSnapshot = await getDocs(collection(db, "localEvents"));
        const eventBatch = writeBatch(db);
        eventsSnapshot.docs.forEach(d => eventBatch.delete(d.ref));
        await eventBatch.commit();
        
        // Clear challenges
        const challengesSnapshot = await getDocs(collection(db, "challenges"));
        const challengeBatch = writeBatch(db);
        challengesSnapshot.docs.forEach(d => challengeBatch.delete(d.ref));
        await challengeBatch.commit();
        
        console.log("✅ All seeded data cleared");
    } catch (error) {
        console.error("❌ Error clearing data:", error);
        throw error;
    }
};

