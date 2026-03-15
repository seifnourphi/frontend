/**
 * Image utility functions for handling both Base64 and URL-based images
 * Provides backward compatibility during migration
 */

export interface ImageData {
    data?: string;
    contentType?: string;
    url?: string; // Legacy format
    alt?: string;
    altAr?: string;
}

/**
 * Get image source URL from image object
 * Handles both new Base64 format and legacy URL format
 * @param image - Image object (Base64 or URL)
 * @param fallback - Fallback image URL if image is invalid
 * @returns Image source URL (data URL or regular URL)
 */
export const getImageSrc = (
    image: ImageData | string | null | undefined,
    fallback: string = '/placeholder.svg'
): string => {
    // Handle null/undefined
    if (!image) return fallback;

    // Handle string (legacy format or direct URL)
    if (typeof image === 'string') {
        // Ensure it's a valid string and not empty
        return image.trim() || fallback;
    }

    // Ensure image is an object (not array or other types)
    if (typeof image !== 'object' || Array.isArray(image)) {
        return fallback;
    }

    // Handle new Base64 format
    if (image.data && image.contentType) {
        // Ensure data and contentType are strings
        if (typeof image.data === 'string' && typeof image.contentType === 'string') {
            return `data:${image.contentType};base64,${image.data}`;
        }
    }

    // Handle legacy URL format
    if (image.url && typeof image.url === 'string') {
        return image.url;
    }

    // Fallback
    return fallback;
};

/**
 * Get first image from product images array
 * @param images - Array of images
 * @param fallback - Fallback image URL
 * @returns Image source URL
 */
export const getFirstImageSrc = (
    images: (ImageData | string)[] | null | undefined,
    fallback: string = '/placeholder.svg'
): string => {
    if (!images || images.length === 0) return fallback;
    return getImageSrc(images[0], fallback);
};

/**
 * Get image at specific index
 * @param images - Array of images
 * @param index - Index of image to get
 * @param fallback - Fallback image URL
 * @returns Image source URL
 */
export const getImageAtIndex = (
    images: (ImageData | string)[] | null | undefined,
    index: number,
    fallback: string = '/placeholder.svg'
): string => {
    if (!images || images.length <= index) return fallback;
    return getImageSrc(images[index], fallback);
};

/**
 * Convert file to Base64 for upload
 * @param file - File object
 * @returns Promise with Base64 data and content type
 */
export const fileToBase64 = (file: File): Promise<{ data: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
            resolve({
                data: base64,
                contentType: file.type
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Get alt text from image object
 * @param image - Image object
 * @param lang - Language ('en' or 'ar')
 * @param fallback - Fallback alt text
 * @returns Alt text
 */
export const getImageAlt = (
    image: ImageData | string | null | undefined,
    lang: 'en' | 'ar' = 'en',
    fallback: string = ''
): string => {
    if (!image || typeof image === 'string') return fallback;

    if (lang === 'ar' && image.altAr) return image.altAr;
    if (image.alt) return image.alt;

    return fallback;
};

/**
 * Check if image is Base64 format
 * @param image - Image object
 * @returns True if Base64 format
 */
export const isBase64Image = (image: ImageData | string | null | undefined): boolean => {
    if (!image || typeof image === 'string') return false;
    return !!(image.data && image.contentType);
};

/**
 * Check if image is URL format
 * @param image - Image object
 * @returns True if URL format
 */
export const isUrlImage = (image: ImageData | string | null | undefined): boolean => {
    if (!image) return false;
    if (typeof image === 'string') return true;
    return !!image.url;
};

/**
 * Get default product image based on product name
 * @param productName - Product name
 * @returns Default image URL
 */
export const getDefaultImage = (productName?: string): string => {
    // You can customize this to return different defaults based on product name
    return '/placeholder.svg';
};
