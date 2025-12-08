/**
 * VARBE Image Compression Utility
 * 
 * Features:
 * - Resizes images to max Full HD (1920x1080)
 * - Compresses images to JPEG with quality settings
 * - Validates file sizes
 * - Maintains aspect ratio
 * - Optimized for artwork display
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1
    maxFileSizeMB?: number;
    format?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    maxFileSizeMB: 2,
    format: 'jpeg',
};

/**
 * Compress and resize an image file
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Validate input
    if (!file.type.startsWith('image/')) {
        throw new Error('Die Datei muss ein Bild sein');
    }
    
    // Check max file size (before compression) - reject extremely large files
    const maxUploadSizeMB = 50; // 50MB absolute maximum
    if (file.size > maxUploadSizeMB * 1024 * 1024) {
        throw new Error(`Die Datei ist zu groß (max. ${maxUploadSizeMB}MB)`);
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = () => {
                try {
                    // Calculate new dimensions maintaining aspect ratio
                    const { width, height } = calculateDimensions(
                        img.width,
                        img.height,
                        opts.maxWidth,
                        opts.maxHeight
                    );
                    
                    // Create canvas and compress
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context nicht verfügbar'));
                        return;
                    }
                    
                    // Draw with high quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob with quality settings
                    const mimeType = opts.format === 'webp' 
                        ? 'image/webp' 
                        : opts.format === 'png'
                        ? 'image/png'
                        : 'image/jpeg';
                    
                    // Try to compress with decreasing quality if file is too large
                    compressWithQuality(canvas, mimeType, opts.quality, opts.maxFileSizeMB)
                        .then((blob) => {
                            // Create new File from blob
                            const extension = opts.format === 'webp' ? 'webp' : opts.format === 'png' ? 'png' : 'jpg';
                            const originalName = file.name.replace(/\.[^/.]+$/, '');
                            const newFileName = `${originalName}_compressed.${extension}`;
                            
                            const compressedFile = new File([blob], newFileName, {
                                type: mimeType,
                                lastModified: Date.now(),
                            });
                            
                            const result: CompressionResult = {
                                file: compressedFile,
                                originalSize: file.size,
                                compressedSize: compressedFile.size,
                                compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100),
                                width,
                                height,
                            };
                            
                            console.log(`📸 Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} (${result.compressionRatio}% reduction)`);
                            resolve(result);
                        })
                        .catch(reject);
                        
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
            img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {},
    onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
        const result = await compressImage(files[i], options);
        results.push(result);
        onProgress?.(i + 1, files.length);
    }
    
    return results;
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;
    
    // If image is smaller than max dimensions, don't upscale
    if (width <= maxWidth && height <= maxHeight) {
        return { width, height };
    }
    
    // Calculate aspect ratio
    const aspectRatio = width / height;
    
    // Scale down to fit within max dimensions
    if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
    }
    
    if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
    }
    
    return { width, height };
}

/**
 * Compress canvas to blob with iterative quality reduction if needed
 */
async function compressWithQuality(
    canvas: HTMLCanvasElement,
    mimeType: string,
    initialQuality: number,
    maxFileSizeMB: number
): Promise<Blob> {
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    let quality = initialQuality;
    const minQuality = 0.3;
    const qualityStep = 0.1;
    
    while (quality >= minQuality) {
        const blob = await canvasToBlob(canvas, mimeType, quality);
        
        if (blob.size <= maxSizeBytes) {
            return blob;
        }
        
        quality -= qualityStep;
        console.log(`📸 Reducing quality to ${Math.round(quality * 100)}% (file size: ${formatFileSize(blob.size)})`);
    }
    
    // Return lowest quality version even if still too large
    return canvasToBlob(canvas, mimeType, minQuality);
}

/**
 * Convert canvas to blob (promisified)
 */
function canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Blob konnte nicht erstellt werden'));
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validate image dimensions and file size before compression
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Die Datei muss ein Bild sein' };
    }
    
    // Check file size (max 50MB before compression)
    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { 
            valid: false, 
            error: `Die Datei ist zu groß. Maximum: ${maxSizeMB}MB` 
        };
    }
    
    // Allowed formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: 'Nur JPEG, PNG, WebP und GIF Bilder sind erlaubt' 
        };
    }
    
    return { valid: true };
}

/**
 * Get image dimensions without loading full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
            img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
        reader.readAsDataURL(file);
    });
}

/**
 * Presets for different use cases
 */
export const COMPRESSION_PRESETS = {
    // For artwork main images (high quality, Full HD max)
    artwork: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        maxFileSizeMB: 2,
        format: 'jpeg' as const,
    },
    
    // For process/behind-the-scenes images (medium quality)
    process: {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.75,
        maxFileSizeMB: 1,
        format: 'jpeg' as const,
    },
    
    // For thumbnails (small, low quality)
    thumbnail: {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.7,
        maxFileSizeMB: 0.2,
        format: 'jpeg' as const,
    },
    
    // For profile pictures
    profile: {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
        maxFileSizeMB: 0.5,
        format: 'jpeg' as const,
    },
    
    // For certificates/signatures (preserve quality)
    signature: {
        maxWidth: 800,
        maxHeight: 400,
        quality: 0.9,
        maxFileSizeMB: 0.5,
        format: 'png' as const,
    },
    
    // For profile banners/covers
    banner: {
        maxWidth: 1920,
        maxHeight: 600,
        quality: 0.85,
        maxFileSizeMB: 1.5,
        format: 'jpeg' as const,
    },
    
    // For feed posts
    feed: {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxFileSizeMB: 1,
        format: 'jpeg' as const,
    },
};



