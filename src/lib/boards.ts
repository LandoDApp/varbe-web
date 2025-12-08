/**
 * VARBE Boards System (Pinterest-Style Collections)
 * 
 * Users can create boards to organize saved posts.
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
    arrayUnion,
    arrayRemove
} from "firebase/firestore";
import { Board } from "@/types";

// ========================================
// BOARD OPERATIONS
// ========================================

export async function createBoard(
    userId: string,
    title: string,
    description?: string,
    isPrivate: boolean = false,
    isCollaborative: boolean = false
): Promise<string> {
    const boardData = {
        userId,
        title,
        description: description || '',
        coverImageUrl: null,
        isPrivate,
        isCollaborative,
        postIds: [],
        contributors: [],
        createdAt: Date.now(),
    };
    
    const docRef = await addDoc(collection(db, "boards"), boardData);
    return docRef.id;
}

export async function getBoard(boardId: string): Promise<Board | null> {
    const docRef = doc(db, "boards", boardId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Board;
    }
    return null;
}

export async function getUserBoards(userId: string): Promise<Board[]> {
    const q = query(
        collection(db, "boards"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
}

export async function getPublicUserBoards(userId: string): Promise<Board[]> {
    const q = query(
        collection(db, "boards"),
        where("userId", "==", userId),
        where("isPrivate", "==", false),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
}

export async function updateBoard(
    boardId: string,
    data: Partial<Omit<Board, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
    const docRef = doc(db, "boards", boardId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

export async function deleteBoard(boardId: string): Promise<void> {
    await deleteDoc(doc(db, "boards", boardId));
}

// ========================================
// POST TO BOARD OPERATIONS
// ========================================

export async function addPostToBoard(boardId: string, postId: string): Promise<void> {
    const boardRef = doc(db, "boards", boardId);
    await updateDoc(boardRef, {
        postIds: arrayUnion(postId),
        updatedAt: Date.now(),
    });
}

export async function removePostFromBoard(boardId: string, postId: string): Promise<void> {
    const boardRef = doc(db, "boards", boardId);
    await updateDoc(boardRef, {
        postIds: arrayRemove(postId),
        updatedAt: Date.now(),
    });
}

export async function setBoardCover(boardId: string, imageUrl: string): Promise<void> {
    const boardRef = doc(db, "boards", boardId);
    await updateDoc(boardRef, {
        coverImageUrl: imageUrl,
        updatedAt: Date.now(),
    });
}

// ========================================
// QUERIES
// ========================================

export async function getBoardsContainingPost(userId: string, postId: string): Promise<Board[]> {
    const userBoards = await getUserBoards(userId);
    return userBoards.filter(board => board.postIds.includes(postId));
}

export async function isPostInAnyBoard(userId: string, postId: string): Promise<boolean> {
    const boards = await getBoardsContainingPost(userId, postId);
    return boards.length > 0;
}

// ========================================
// COLLABORATIVE BOARDS
// ========================================

/**
 * Get all public collaborative boards (that anyone can pin to)
 */
export async function getPublicCollaborativeBoards(): Promise<Board[]> {
    try {
        const q = query(
            collection(db, "boards"),
            where("isPrivate", "==", false),
            where("isCollaborative", "==", true),
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
    } catch (error) {
        // Fallback: get all boards and filter client-side
        console.error("Error fetching collaborative boards:", error);
        const allBoards = await getAllPublicBoards();
        return allBoards.filter(b => b.isCollaborative);
    }
}

/**
 * Get all public boards
 */
export async function getAllPublicBoards(): Promise<Board[]> {
    try {
        const q = query(
            collection(db, "boards"),
            where("isPrivate", "==", false),
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
    } catch (error) {
        console.error("Error fetching public boards:", error);
        return [];
    }
}

/**
 * Get all boards a user can pin to:
 * - Their own boards
 * - Public collaborative boards from others
 */
export async function getBoardsForPinning(userId: string): Promise<Board[]> {
    try {
        // Get user's own boards
        const ownBoards = await getUserBoards(userId);
        
        // Get public collaborative boards from others
        const collaborativeBoards = await getPublicCollaborativeBoards();
        
        // Filter out user's own boards from collaborative (already included)
        const otherCollabBoards = collaborativeBoards.filter(b => b.userId !== userId);
        
        // Combine and return
        return [...ownBoards, ...otherCollabBoards];
    } catch (error) {
        console.error("Error fetching boards for pinning:", error);
        return [];
    }
}

/**
 * Pin a post to a board (works for own boards and collaborative boards)
 */
export async function pinPostToBoard(
    boardId: string, 
    postId: string, 
    userId: string
): Promise<void> {
    const board = await getBoard(boardId);
    if (!board) throw new Error("Board not found");
    
    // Check permission: own board OR collaborative board
    if (board.userId !== userId && !board.isCollaborative) {
        throw new Error("You don't have permission to pin to this board");
    }
    
    const boardRef = doc(db, "boards", boardId);
    await updateDoc(boardRef, {
        postIds: arrayUnion(postId),
        contributors: arrayUnion(userId),
        updatedAt: Date.now(),
    });
}

/**
 * Unpin a post from a board
 */
export async function unpinPostFromBoard(
    boardId: string, 
    postId: string, 
    userId: string
): Promise<void> {
    const board = await getBoard(boardId);
    if (!board) throw new Error("Board not found");
    
    // Only owner can unpin, or if it's a collaborative board
    if (board.userId !== userId && !board.isCollaborative) {
        throw new Error("You don't have permission to unpin from this board");
    }
    
    const boardRef = doc(db, "boards", boardId);
    await updateDoc(boardRef, {
        postIds: arrayRemove(postId),
        updatedAt: Date.now(),
    });
}

/**
 * Get boards that contain a specific post (for showing "pinned to" info)
 */
export async function getBoardsWithPost(postId: string): Promise<Board[]> {
    try {
        // Note: Firestore doesn't support array-contains with ordering well
        // So we get all public boards and filter client-side
        const allBoards = await getAllPublicBoards();
        return allBoards.filter(b => b.postIds.includes(postId));
    } catch (error) {
        console.error("Error fetching boards with post:", error);
        return [];
    }
}

