/**
 * VARBE Jobs System
 * 
 * Job board for art-related positions where employers can post jobs
 * and artists can browse and apply via email.
 */

import { db } from "./firebase";
import { 
    collection, 
    addDoc, 
    getDoc, 
    getDocs, 
    doc, 
    query, 
    orderBy, 
    where, 
    updateDoc, 
    deleteDoc,
    limit,
    increment
} from "firebase/firestore";
import { Job, JobType, JobCategory, JobStatus } from "@/types";

// ========================================
// JOB OPERATIONS
// ========================================

export async function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'viewCount' | 'applicationCount'>): Promise<string> {
    const job = {
        ...jobData,
        createdAt: Date.now(),
        viewCount: 0,
        applicationCount: 0,
    };
    
    const docRef = await addDoc(collection(db, "jobs"), job);
    return docRef.id;
}

export async function getJob(jobId: string): Promise<Job | null> {
    const docRef = doc(db, "jobs", jobId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return null;
}

export async function getActiveJobs(limitCount: number = 50): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}

export async function getFeaturedJobs(limitCount: number = 10): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        where("featured", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}

export async function getJobsByCategory(category: JobCategory, limitCount: number = 50): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}

export async function getJobsByType(type: JobType, limitCount: number = 50): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        where("type", "==", type),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}

export async function getRemoteJobs(limitCount: number = 50): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        where("isRemote", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}

export async function updateJob(jobId: string, data: Partial<Job>): Promise<void> {
    const docRef = doc(db, "jobs", jobId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

export async function deleteJob(jobId: string): Promise<void> {
    await deleteDoc(doc(db, "jobs", jobId));
}

export async function incrementJobView(jobId: string): Promise<void> {
    const docRef = doc(db, "jobs", jobId);
    await updateDoc(docRef, {
        viewCount: increment(1),
    });
}

export async function incrementApplicationCount(jobId: string): Promise<void> {
    const docRef = doc(db, "jobs", jobId);
    await updateDoc(docRef, {
        applicationCount: increment(1),
    });
}

// ========================================
// SEARCH & FILTER
// ========================================

export async function searchJobs(searchTerm: string): Promise<Job[]> {
    // Simple search - in production you'd use Algolia or similar
    const jobs = await getActiveJobs(100);
    const term = searchTerm.toLowerCase();
    
    return jobs.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.companyName.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.skills.some(s => s.toLowerCase().includes(term)) ||
        job.location.toLowerCase().includes(term)
    );
}

// ========================================
// HELPERS
// ========================================

export const JOB_TYPE_LABELS: Record<JobType, string> = {
    fulltime: 'Vollzeit',
    parttime: 'Teilzeit',
    freelance: 'Freelance',
    internship: 'Praktikum',
    project: 'Projekt',
    commission: 'Auftrag',
};

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
    illustration: 'Illustration',
    graphic_design: 'Grafikdesign',
    animation: 'Animation',
    game_art: 'Game Art',
    concept_art: 'Concept Art',
    ui_ux: 'UI/UX Design',
    photography: 'Fotografie',
    video: 'Video/Film',
    '3d': '3D Kunst',
    other: 'Sonstiges',
};

export const EXPERIENCE_LABELS: Record<string, string> = {
    entry: 'Einsteiger',
    mid: 'Mit Erfahrung',
    senior: 'Senior',
    any: 'Alle Level',
};

// ========================================
// SEED DATA
// ========================================

export const SEED_JOBS: Omit<Job, 'id' | 'createdAt' | 'viewCount' | 'applicationCount'>[] = [
    {
        companyName: "Pixel Dreams Studio",
        companyLogo: "https://ui-avatars.com/api/?name=Pixel+Dreams&background=CCFF00&color=000&bold=true",
        companyWebsite: "https://pixeldreams.example.com",
        contactEmail: "jobs@pixeldreams.example.com",
        title: "Senior Illustrator für Kinderbücher",
        description: `Wir suchen einen erfahrenen Illustrator für unsere neue Kinderbuch-Reihe!

**Was dich erwartet:**
- Kreative Freiheit bei der Gestaltung von Charakteren
- Zusammenarbeit mit preisgekrönten Autoren
- Langfristige Projekte mit fairer Vergütung

**Was du mitbringst:**
- Erfahrung in der Kinderbuch-Illustration
- Portfolio mit character-basierten Arbeiten
- Liebe zum Detail und zur Farbe

Wir freuen uns auf deine Bewerbung!`,
        type: "project",
        category: "illustration",
        skills: ["Kinderbuch", "Character Design", "Digital Art", "Procreate", "Photoshop"],
        experienceLevel: "senior",
        location: "Berlin, Deutschland",
        isRemote: true,
        salary: {
            min: 3000,
            max: 5000,
            currency: "EUR",
            period: "project",
        },
        status: "active",
        featured: true,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    {
        companyName: "GameForge Interactive",
        companyLogo: "https://ui-avatars.com/api/?name=GameForge&background=FF10F0&color=fff&bold=true",
        companyWebsite: "https://gameforge.example.com",
        contactEmail: "art@gameforge.example.com",
        title: "2D Game Artist (m/w/d)",
        description: `GameForge sucht einen talentierten 2D Artist für unser neues Indie-Game!

**Deine Aufgaben:**
- Erstellung von Sprites und Animationen
- UI/UX Design für das Spiel
- Zusammenarbeit mit dem Game Design Team

**Requirements:**
- Erfahrung mit Pixel Art oder Vector Art
- Verständnis von Game Design Prinzipien
- Portfolio mit Game Art Samples

Remote-Arbeit möglich. Flexibles Team. Faire Bezahlung.`,
        type: "fulltime",
        category: "game_art",
        skills: ["Pixel Art", "Spine", "Unity", "Aseprite", "Game Design"],
        experienceLevel: "mid",
        location: "Hamburg, Deutschland",
        isRemote: true,
        salary: {
            min: 3500,
            max: 4500,
            currency: "EUR",
            period: "month",
        },
        status: "active",
        featured: true,
        expiresAt: Date.now() + 45 * 24 * 60 * 60 * 1000,
    },
    {
        companyName: "Kreativ Agentur München",
        companyLogo: "https://ui-avatars.com/api/?name=Kreativ+Agentur&background=000&color=CCFF00&bold=true",
        companyWebsite: "https://kreativagentur.example.com",
        contactEmail: "hello@kreativagentur.example.com",
        title: "Grafikdesigner für Branding-Projekte",
        description: `Kleine aber feine Agentur sucht Verstärkung!

Wir arbeiten mit Startups und etablierten Marken zusammen und brauchen einen kreativen Kopf für:

- Logo Design
- Brand Guidelines
- Marketing Materials
- Social Media Content

Du arbeitest selbstständig und hast ein Auge für moderne Ästhetik? Dann meld dich!

**Benefits:**
- 4-Tage-Woche möglich
- Home Office
- Weiterbildungsbudget`,
        type: "parttime",
        category: "graphic_design",
        skills: ["Branding", "Logo Design", "Adobe CC", "Figma", "Print Design"],
        experienceLevel: "mid",
        location: "München, Deutschland",
        isRemote: true,
        salary: {
            min: 25,
            max: 40,
            currency: "EUR",
            period: "hour",
        },
        status: "active",
        featured: false,
        expiresAt: Date.now() + 21 * 24 * 60 * 60 * 1000,
    },
    {
        companyName: "Animation Studios Berlin",
        companyLogo: "https://ui-avatars.com/api/?name=ASB&background=6366f1&color=fff&bold=true",
        companyWebsite: "https://animationstudios.example.com",
        contactEmail: "careers@animationstudios.example.com",
        title: "Junior Animator (2D/Motion Graphics)",
        description: `Starte deine Karriere bei uns!

Wir produzieren Erklärvideos, Werbespots und Social Media Content für große Marken. Als Junior Animator lernst du von erfahrenen Motion Designern und arbeitest an echten Projekten.

**Was wir bieten:**
- Mentorship-Programm
- Moderne Tools (After Effects, Cinema 4D)
- Kreatives Büro in Kreuzberg
- Team-Events

**Was du brauchst:**
- Grundkenntnisse in After Effects
- Showreel oder Studienarbeiten
- Motivation zu lernen

Auch Quereinsteiger willkommen!`,
        type: "fulltime",
        category: "animation",
        skills: ["After Effects", "Motion Graphics", "2D Animation", "Illustrator"],
        experienceLevel: "entry",
        location: "Berlin, Deutschland",
        isRemote: false,
        salary: {
            min: 2400,
            max: 2800,
            currency: "EUR",
            period: "month",
        },
        status: "active",
        featured: false,
        expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
    },
    {
        companyName: "Portrait Foto Berlin",
        companyLogo: "https://ui-avatars.com/api/?name=PFB&background=f97316&color=fff&bold=true",
        contactEmail: "foto@portraitberlin.example.com",
        title: "Fotograf für Portrait-Sessions (Freelance)",
        description: `Wir erweitern unser Netzwerk!

Portrait Foto Berlin sucht Fotografen auf Freelance-Basis für:
- Business Portraits
- Familien-Shootings
- Events

Du hast eigenes Equipment und Erfahrung in der Portrait-Fotografie? Dann schick uns dein Portfolio!

Faire Tagesgage + schnelle Bezahlung garantiert.`,
        type: "freelance",
        category: "photography",
        skills: ["Portrait", "Lightroom", "Studio Lighting", "Event Photography"],
        experienceLevel: "mid",
        location: "Berlin, Deutschland",
        isRemote: false,
        salary: {
            min: 300,
            max: 500,
            currency: "EUR",
            period: "project",
        },
        status: "active",
        featured: false,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
    },
    {
        companyName: "Virtual Reality Labs",
        companyLogo: "https://ui-avatars.com/api/?name=VR+Labs&background=8b5cf6&color=fff&bold=true",
        companyWebsite: "https://vrlabs.example.com",
        contactEmail: "jobs@vrlabs.example.com",
        title: "3D Artist für VR-Erlebnisse",
        description: `Gestalte die Zukunft!

VR Labs entwickelt immersive VR-Erlebnisse für Museen, Unternehmen und Entertainment. Wir suchen einen 3D Artist der:

- Environments und Props modelliert
- PBR Texturing beherrscht
- Optimierung für VR versteht

**Tech Stack:** Blender, Substance, Unity

Wir bieten spannende Projekte, ein internationales Team und die Möglichkeit, an der Spitze der Technologie zu arbeiten.`,
        type: "fulltime",
        category: "3d",
        skills: ["Blender", "Substance Painter", "Unity", "VR", "PBR"],
        experienceLevel: "mid",
        location: "Frankfurt, Deutschland",
        isRemote: true,
        salary: {
            min: 4000,
            max: 5500,
            currency: "EUR",
            period: "month",
        },
        status: "active",
        featured: true,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    },
];

export async function seedJobs(): Promise<void> {
    console.log("🌱 Seeding jobs...");
    
    for (const jobData of SEED_JOBS) {
        try {
            const jobId = await createJob(jobData);
            console.log(`✅ Created job: ${jobData.title} (${jobId})`);
        } catch (error) {
            console.error(`❌ Failed to create job: ${jobData.title}`, error);
        }
    }
    
    console.log("🌱 Done seeding jobs!");
}




