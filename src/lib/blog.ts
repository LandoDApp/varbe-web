import { db } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy, 
    limit,
    startAfter,
    DocumentSnapshot,
    increment
} from 'firebase/firestore';
import { BlogPost, BlogCategory, BlogLanguage } from '@/types';

const BLOG_COLLECTION = 'blogPosts';

// Generate URL-friendly slug from title
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[äöüß]/g, (char) => {
            const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
            return map[char] || char;
        })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
}

// Calculate read time from content
export function calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Create a new blog post
export async function createBlogPost(
    authorId: string,
    data: {
        title: string;
        content: string;
        excerpt: string;
        category: BlogCategory;
        language: BlogLanguage;
        coverImage?: string;
        tags?: string[];
        status?: 'draft' | 'published';
    }
): Promise<string> {
    const slug = generateSlug(data.title);
    const readTime = calculateReadTime(data.content);
    
    const blogPost: Omit<BlogPost, 'id'> = {
        authorId,
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        language: data.language,
        coverImage: data.coverImage,
        tags: data.tags || [],
        readTimeMinutes: readTime,
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? Date.now() : undefined,
        views: 0,
        likesCount: 0,
        createdAt: Date.now(),
    };
    
    const docRef = await addDoc(collection(db, BLOG_COLLECTION), blogPost);
    return docRef.id;
}

// Update a blog post
export async function updateBlogPost(
    postId: string,
    data: Partial<Omit<BlogPost, 'id' | 'authorId' | 'createdAt'>>
): Promise<void> {
    const docRef = doc(db, BLOG_COLLECTION, postId);
    
    // Recalculate read time if content changed
    if (data.content) {
        data.readTimeMinutes = calculateReadTime(data.content);
    }
    
    // Regenerate slug if title changed
    if (data.title) {
        data.slug = generateSlug(data.title);
    }
    
    // Set publishedAt if status changed to published
    if (data.status === 'published') {
        const existingDoc = await getDoc(docRef);
        if (existingDoc.exists() && !existingDoc.data().publishedAt) {
            data.publishedAt = Date.now();
        }
    }
    
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
    });
}

// Delete a blog post
export async function deleteBlogPost(postId: string): Promise<void> {
    await deleteDoc(doc(db, BLOG_COLLECTION, postId));
}

// Get a single blog post by ID
export async function getBlogPostById(postId: string): Promise<BlogPost | null> {
    const docRef = doc(db, BLOG_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
        id: docSnap.id,
        ...docSnap.data()
    } as BlogPost;
}

// Get a blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const q = query(
        collection(db, BLOG_COLLECTION),
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data()
    } as BlogPost;
}

// Get published blog posts
export async function getPublishedBlogPosts(
    options?: {
        category?: BlogCategory;
        language?: BlogLanguage;
        tag?: string;
        limitCount?: number;
        lastDoc?: DocumentSnapshot;
    }
): Promise<{ posts: BlogPost[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(
        collection(db, BLOG_COLLECTION),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
    );
    
    // Build query with filters
    const filters: any[] = [where('status', '==', 'published')];
    
    if (options?.category) {
        filters.push(where('category', '==', options.category));
    }
    
    if (options?.language) {
        filters.push(where('language', '==', options.language));
    }
    
    q = query(
        collection(db, BLOG_COLLECTION),
        ...filters,
        orderBy('publishedAt', 'desc')
    );
    
    if (options?.limitCount) {
        q = query(q, limit(options.limitCount));
    }
    
    if (options?.lastDoc) {
        q = query(q, startAfter(options.lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as BlogPost));
    
    // Filter by tag if specified (client-side since Firestore doesn't support array-contains with other where clauses well)
    const filteredPosts = options?.tag 
        ? posts.filter(post => post.tags?.includes(options.tag!))
        : posts;
    
    return {
        posts: filteredPosts,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
}

// Get blog posts by author
export async function getBlogPostsByAuthor(
    authorId: string,
    includeUnpublished = false
): Promise<BlogPost[]> {
    let q = query(
        collection(db, BLOG_COLLECTION),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc')
    );
    
    if (!includeUnpublished) {
        q = query(
            collection(db, BLOG_COLLECTION),
            where('authorId', '==', authorId),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc')
        );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as BlogPost));
}

// Increment view count
export async function incrementBlogPostViews(postId: string): Promise<void> {
    const docRef = doc(db, BLOG_COLLECTION, postId);
    await updateDoc(docRef, {
        views: increment(1)
    });
}

// Get category display name
export function getCategoryDisplayName(category: BlogCategory, locale = 'de'): string {
    const names: Record<BlogCategory, { de: string; en: string }> = {
        tutorial: { de: 'Tutorial', en: 'Tutorial' },
        news: { de: 'News', en: 'News' },
        artist_spotlight: { de: 'Künstler Spotlight', en: 'Artist Spotlight' },
        community: { de: 'Community', en: 'Community' },
        tips: { de: 'Tipps & Tricks', en: 'Tips & Tricks' },
        announcement: { de: 'Ankündigung', en: 'Announcement' },
    };
    return names[category][locale as 'de' | 'en'] || names[category].de;
}

// Get all categories
export function getAllCategories(): { value: BlogCategory; label: string }[] {
    return [
        { value: 'tutorial', label: 'Tutorial' },
        { value: 'tips', label: 'Tipps & Tricks' },
        { value: 'artist_spotlight', label: 'Künstler Spotlight' },
        { value: 'community', label: 'Community' },
        { value: 'news', label: 'News' },
        { value: 'announcement', label: 'Ankündigung' },
    ];
}

