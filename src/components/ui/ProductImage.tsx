/**
 * ProductImage Component
 * Handles both Base64 and URL-based images with automatic fallback
 */

import { useState } from 'react';
import { getImageSrc } from '@/lib/image-utils';

interface ImageData {
    data?: string;
    contentType?: string;
    url?: string;
    alt?: string;
    altAr?: string;
}

interface ProductImageProps {
    image: ImageData | string | null | undefined;
    alt?: string;
    className?: string;
    fallback?: string;
    onLoad?: () => void;
    onError?: () => void;
    onClick?: (e: React.MouseEvent) => void;
}

export function ProductImage({
    image,
    alt = '',
    className = '',
    fallback = '/placeholder.svg',
    onLoad,
    onError,
    onClick
}: ProductImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const imageSrc = hasError ? fallback : getImageSrc(image, fallback);

    const handleLoad = () => {
        setIsLoading(false);
        if (onLoad) onLoad();
    };

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        if (onError) onError();
    };

    return (
        <>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400/20 border-t-yellow-400"></div>
                </div>
            )}
            <img
                src={imageSrc}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={handleLoad}
                onError={handleError}
                onClick={onClick}
            />
        </>
    );
}
