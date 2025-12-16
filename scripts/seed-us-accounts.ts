// Script to seed 50 US test accounts with English posts
// Run with: npx ts-node --project tsconfig.seed.json scripts/seed-us-accounts.ts

import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBts3VdOg4ktMutTVh5ebugbD0pgf-F4KY",
    authDomain: "varbe-e96d2.firebaseapp.com",
    databaseURL: "https://varbe-e96d2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "varbe-e96d2",
    storageBucket: "varbe-e96d2.firebasestorage.app",
    messagingSenderId: "851653426804",
    appId: "1:851653426804:web:87c6e4e9f3c61cb0d0db21",
    measurementId: "G-LKJ6C1BPTC"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "varbe");

// ========================================
// US TEST ACCOUNTS DATA
// ========================================

const US_FIRST_NAMES = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
    'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
    'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Luna', 'Daniel',
    'Ella', 'Michael', 'Elizabeth', 'Sebastian', 'Sofia', 'Jack', 'Avery',
    'Owen', 'Scarlett', 'Gabriel', 'Emily', 'Matthew', 'Aria', 'Jayden',
    'Penelope', 'Leo', 'Layla', 'David', 'Chloe', 'Joseph', 'Victoria',
    'Samuel', 'Madison', 'Carter', 'Eleanor', 'John', 'Grace', 'Luke'
];

const US_LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts'
];

const US_CITIES = [
    { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
    { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
    { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
    { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
    { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
    { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
    { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
    { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
    { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
    { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
    { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
    { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
    { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
    { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
    { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
    { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
    { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
    { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
    { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
    { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 },
];

const ART_STYLES = [
    'digital art', 'oil painting', 'watercolor', 'acrylic', 'illustration',
    'character design', 'concept art', 'photography', 'mixed media', 'sculpture',
    'street art', 'abstract', 'realism', 'surrealism', 'pop art', 'minimalism',
    'portrait art', 'landscape', 'comic art', 'tattoo design', 'animation',
    'pixel art', 'graphic design', '3D art', 'collage'
];

const ENGLISH_BIOS = [
    "🎨 TEST ACCOUNT | Creating {style} from {city}. Passionate about bringing ideas to life through art.",
    "🖌️ TEST ACCOUNT | {style} artist based in {city}. Open for commissions!",
    "✨ TEST ACCOUNT | Full-time {style} creator. Coffee addict & night owl. 🦉",
    "🌟 TEST ACCOUNT | Self-taught {style} artist exploring color and form.",
    "🎭 TEST ACCOUNT | {city} based artist specializing in {style}. Let's create together!",
    "💫 TEST ACCOUNT | Turning caffeine into {style} since 2019.",
    "🔥 TEST ACCOUNT | {style} enthusiast | Art is my therapy 💙",
    "🌈 TEST ACCOUNT | Making the world more colorful one {style} piece at a time.",
    "⚡ TEST ACCOUNT | Professional {style} artist | DMs open for collabs",
    "🎪 TEST ACCOUNT | Weird art for weird people. {style} is my jam.",
    "🌙 TEST ACCOUNT | Nocturnal artist creating {style} in {city}.",
    "🍕 TEST ACCOUNT | Will make {style} for pizza 🎨",
    "🚀 TEST ACCOUNT | {city} creative. {style} is just the beginning.",
    "🎯 TEST ACCOUNT | Precision meets passion. {style} from the heart.",
    "🌿 TEST ACCOUNT | Nature-inspired {style} from sunny {city}.",
];

const POST_TEMPLATES = [
    "Just finished this piece! 🎨 Spent about {hours} hours on it. What do you think?",
    "New work in progress! Can't wait to show you the final result ✨",
    "Late night studio session vibes 🌙 Working on something special...",
    "Finally happy with how this turned out! {style} has been my focus lately.",
    "Commission work for an amazing client! Love when creative visions align 💫",
    "Experimenting with new techniques today. Always learning, always growing! 📚",
    "This piece took me out of my comfort zone, but I'm proud of the result 🙌",
    "Quick sketch from this morning's coffee session ☕",
    "Behind the scenes of my creative process! Tools: {tools}",
    "Throwback to one of my favorite pieces. Would love to revisit this style!",
    "Studio update: New art incoming! Stay tuned 🔔",
    "When the inspiration hits, you just gotta create! 🎭",
    "Color study for an upcoming project. Thoughts on the palette? 🎨",
    "Happy with today's progress! Art is a journey, not a destination 🛤️",
    "Weekend project complete! Time for some well-deserved rest 😴",
    "Trying out {technique} for the first time. Learning something new every day!",
    "This one's for all the night owls out there 🦉 Creating at 2am hits different",
    "Client approved! So excited to share this commissioned piece 🙏",
    "Work in progress - about 60% done. Can you guess what it'll be? 🤔",
    "New series dropping soon! Here's a sneak peek 👀",
    "Just hit {followers}k followers! Thank you all for the support 💙",
    "Mood: Creative and caffeinated ☕✨",
    "Sometimes the best art comes from the messiest process!",
    "Feeling grateful for this creative community 🌟",
    "Daily sketch #{number} - keeping the streak alive! 🔥",
    "Before and after: The power of layers and patience 🎨",
    "Found my new favorite color combination! 💜💛",
    "Art dump! Here's what I've been working on lately 📸",
    "The struggle is real but so is the satisfaction when it's done! 💪",
    "Anyone else get lost in the details? Just me? 🔍",
];

const TOOLS = [
    'Procreate, iPad Pro', 'Photoshop, Wacom', 'Clip Studio Paint',
    'oil paints, canvas', 'watercolors, cold press paper', 'acrylics, mixed media',
    'Blender, Cinema 4D', 'colored pencils, markers', 'spray paint, stencils',
    'camera, Adobe Lightroom', 'pen & ink, Bristol board', 'digital brushes, texture packs'
];

const TECHNIQUES = [
    'digital glazing', 'wet-on-wet', 'impasto', 'cross-hatching',
    'color blocking', 'negative space', 'stippling', 'layering',
    'blending modes', 'texture overlays', 'color grading', 'composition rules'
];

// Sample image URLs (placeholder images for testing)
const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800',
    'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
    'https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=800',
    'https://images.unsplash.com/photo-1551913902-c92207136625?w=800',
    'https://images.unsplash.com/photo-1569172122301-bc5008bc09c5?w=800',
    'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800',
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
    'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=800',
    'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800',
];

// ========================================
// HELPER FUNCTIONS
// ========================================

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsername(firstName: string, lastName: string): string {
    const styles = [
        `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        `${firstName.toLowerCase()}_art`,
        `${firstName.toLowerCase()}.creates`,
        `the_${firstName.toLowerCase()}`,
        `${firstName.toLowerCase()}${Math.floor(Math.random() * 99)}`,
        `${firstName.toLowerCase()}_studio`,
        `art_by_${firstName.toLowerCase()}`,
    ];
    return randomFrom(styles);
}

function generateBio(style: string, city: string): string {
    const template = randomFrom(ENGLISH_BIOS);
    return template
        .replace(/{style}/g, style)
        .replace(/{city}/g, city);
}

function generatePostText(style: string): string {
    const template = randomFrom(POST_TEMPLATES);
    return template
        .replace(/{style}/g, style)
        .replace(/{hours}/g, String(Math.floor(Math.random() * 20) + 2))
        .replace(/{tools}/g, randomFrom(TOOLS))
        .replace(/{technique}/g, randomFrom(TECHNIQUES))
        .replace(/{followers}/g, String(Math.floor(Math.random() * 50) + 1))
        .replace(/{number}/g, String(Math.floor(Math.random() * 365) + 1));
}

function generateUserId(index: number): string {
    return `us_test_artist_${index}_${Date.now().toString(36)}`;
}

// ========================================
// SEED FUNCTIONS
// ========================================

interface TestUser {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    displayName: string;
    bio: string;
    style: string;
    city: typeof US_CITIES[0];
}

async function createTestUsers(count: number): Promise<TestUser[]> {
    console.log(`\n🚀 Creating ${count} US test accounts...\n`);
    
    const users: TestUser[] = [];
    
    for (let i = 0; i < count; i++) {
        const firstName = US_FIRST_NAMES[i % US_FIRST_NAMES.length];
        const lastName = randomFrom(US_LAST_NAMES);
        const username = generateUsername(firstName, lastName);
        const style = randomFrom(ART_STYLES);
        const city = US_CITIES[i % US_CITIES.length];
        const userId = generateUserId(i);
        
        const user: TestUser = {
            id: userId,
            firstName,
            lastName,
            username,
            displayName: `${firstName} ${lastName}`,
            bio: generateBio(style, city.city),
            style,
            city,
        };
        
        // Create user profile in Firestore
        const userProfile = {
            email: `${username}@test.varbe.org`,
            displayName: user.displayName,
            username: user.username,
            bio: user.bio,
            profilePictureUrl: '',
            headerImageUrl: '',
            location: `${city.city}, ${city.state}, USA`,
            website: '',
            socialLinks: {},
            verificationStatus: 'verified',
            role: 'user',
            isPublic: true,
            followersCount: Math.floor(Math.random() * 5000) + 100,
            followingCount: Math.floor(Math.random() * 500) + 50,
            postsCount: 0,
            createdAt: Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
            artistProfile: {
                artStyle: style,
                mediums: [style],
                influences: [],
                studioLocation: {
                    city: city.city,
                    country: 'USA',
                    latitude: city.lat + (Math.random() - 0.5) * 0.1,
                    longitude: city.lng + (Math.random() - 0.5) * 0.1,
                    showOnMap: true,
                },
                openForCommissions: Math.random() > 0.3,
                openForCollabs: Math.random() > 0.4,
            },
        };
        
        try {
            await setDoc(doc(db, "users", userId), userProfile);
            console.log(`  ✅ Created user: ${user.displayName} (@${user.username}) - ${city.city}, ${city.state}`);
            users.push(user);
        } catch (error) {
            console.error(`  ❌ Failed to create user: ${user.displayName}`, error);
        }
    }
    
    console.log(`\n✅ Created ${users.length} test users\n`);
    return users;
}

async function createPostsForUsers(users: TestUser[], postsPerUser: number = 3): Promise<void> {
    console.log(`\n📝 Creating posts for ${users.length} users (${postsPerUser} posts each)...\n`);
    
    let totalPosts = 0;
    const postsRef = collection(db, "feed_posts");
    
    for (const user of users) {
        const numPosts = Math.floor(Math.random() * postsPerUser) + 1; // 1 to postsPerUser
        
        for (let i = 0; i < numPosts; i++) {
            const hasImage = Math.random() > 0.2; // 80% chance of having image
            const numImages = hasImage ? Math.floor(Math.random() * 3) + 1 : 0;
            const images: string[] = [];
            
            for (let j = 0; j < numImages; j++) {
                images.push(randomFrom(SAMPLE_IMAGES));
            }
            
            const post = {
                artistId: user.id,
                type: 'update',
                text: generatePostText(user.style),
                images,
                visibility: 'public',
                likesCount: Math.floor(Math.random() * 500) + 10,
                commentsCount: Math.floor(Math.random() * 50),
                sharesCount: Math.floor(Math.random() * 20),
                createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
                moderationStatus: 'approved',
                moderationScores: {},
                moderationReasons: [],
                needsAdminReview: false,
            };
            
            try {
                await addDoc(postsRef, post);
                totalPosts++;
            } catch (error) {
                console.error(`  ❌ Failed to create post for ${user.displayName}`, error);
            }
        }
        
        // Update user's post count
        try {
            await setDoc(doc(db, "users", user.id), { postsCount: numPosts }, { merge: true });
        } catch (error) {
            // Ignore update errors
        }
        
        console.log(`  ✅ Created ${numPosts} posts for ${user.displayName}`);
    }
    
    console.log(`\n✅ Created ${totalPosts} total posts\n`);
}

// ========================================
// MAIN
// ========================================

async function main() {
    console.log('═'.repeat(60));
    console.log('🇺🇸 VARBE US TEST ACCOUNTS SEEDER');
    console.log('═'.repeat(60));
    
    const NUM_USERS = 50;
    const POSTS_PER_USER = 4;
    
    try {
        // Create test users
        const users = await createTestUsers(NUM_USERS);
        
        // Create posts for each user
        await createPostsForUsers(users, POSTS_PER_USER);
        
        console.log('═'.repeat(60));
        console.log(`🎉 SUCCESS! Created:`);
        console.log(`   • ${users.length} US test accounts`);
        console.log(`   • ~${users.length * POSTS_PER_USER} English posts`);
        console.log('═'.repeat(60));
        
    } catch (error) {
        console.error('\n❌ SEEDING FAILED:', error);
    }
    
    process.exit(0);
}

main();

