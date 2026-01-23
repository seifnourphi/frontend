'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { DEFAULT_ADVERTISEMENTS, DefaultAdvertisement } from '@/lib/defaultAdvertisements';

interface AdvertisementImage {
  id: string;
  url: string;
  alt?: string;
  altAr?: string;
  name?: string;
  nameAr?: string;
  price?: number;
  sortOrder: number;
}

interface Advertisement {
  id: string;
  title: string;
  titleAr: string;
  subtitle?: string;
  subtitleAr?: string;
  badge?: string;
  badgeAr?: string;
  badgeColor?: string;
  description: string;
  descriptionAr: string;
  buttonText?: string;
  buttonTextAr?: string;
  image: string;
  price?: number;
  originalPrice?: number;
  isActive: boolean;
  sortOrder: number;
  displayType: string;
  images: AdvertisementImage[];
  highlightedWord?: string;
  highlightedWordAr?: string;
  highlightedWordColor?: string;
  highlightedWordUnderline?: boolean;
  showDiscountBadge?: boolean;
  discountBadgePosition?: string;
  features?: Array<{
    title: string;
    titleAr: string;
    icon?: string;
    sortOrder: number;
  }>;
  testimonialText?: string;
  testimonialTextAr?: string;
  testimonialAuthor?: string;
  testimonialAuthorAr?: string;
  promotionalBadges?: Array<{
    text: string;
    textAr: string;
    icon?: string;
    backgroundColor?: string;
    textColor?: string;
    sortOrder: number;
  }>;
  buttons?: Array<{
    text: string;
    textAr: string;
    href: string;
    variant: 'primary' | 'secondary' | 'outline';
    sortOrder: number;
  }>;
}

interface FashionStoreHeroProps {
  products: any[];
  onLoadingChange?: (isLoading: boolean) => void;
}

export function FashionStoreHero({ products, onLoadingChange }: FashionStoreHeroProps) {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [currentAd, setCurrentAd] = useState(0);
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [leftContentVisible, setLeftContentVisible] = useState(false);
  const [rightContentVisible, setRightContentVisible] = useState(false);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvertisements, setShowAdvertisements] = useState(true); // Control show/hide
  const [curvePath, setCurvePath] = useState('');
  const [isFading, setIsFading] = useState(false); // For fade transition between ads
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track first load
  const heroRef = useRef<HTMLDivElement>(null);
  const adContentRef = useRef<HTMLDivElement>(null);

  // Fetch advertisements settings (show/hide) and advertisements from database
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        // Fetch both settings and advertisements in parallel for better performance
        const [settingsResponse, advertisementsResponse] = await Promise.allSettled([
          fetch('/api/settings/store').catch(() => null), // Don't fail if settings fetch fails
          fetch('/api/advertisements')
        ]);

        // Handle settings response
        if (settingsResponse.status === 'fulfilled' && settingsResponse.value && settingsResponse.value.ok) {
          try {
            const settingsData = await settingsResponse.value.json();
            const storeSettings = settingsData.storeSettings || settingsData.data?.storeSettings || settingsData.data?.store || {};
            // Check if there's a setting to show/hide advertisements
            // Default to true if not specified
            const shouldShow = storeSettings.showAdvertisements !== undefined
              ? storeSettings.showAdvertisements
              : true;
            setShowAdvertisements(shouldShow);
          } catch (settingsError) {
            // If settings parse fails, default to showing advertisements
            setShowAdvertisements(true);
          }
        } else {
          // If settings fetch fails, default to showing advertisements
          setShowAdvertisements(true);
        }

        // Handle advertisements response
        if (advertisementsResponse.status === 'rejected' || !advertisementsResponse.value.ok) {
          throw new Error('Failed to fetch advertisements');
        }

        const data = await advertisementsResponse.value.json();
        // Advertisements fetched - no sensitive data logged
        let dbAdvertisements = (data.advertisements || data.data?.advertisements || []).map((ad: any) => ({
          ...ad,
          badgeColor: ad.badgeColor || '#DAA520' // Ensure badgeColor is always present
        }));

        // Remove duplicates based on id (keep first occurrence)
        const seenIds = new Set<string>();
        const seenTitles = new Set<string>();
        dbAdvertisements = dbAdvertisements.filter((ad: Advertisement) => {
          if (!ad.id) return false; // Skip ads without id

          // Check for duplicate id
          if (seenIds.has(ad.id)) {
            return false; // Skip duplicate
          }

          // Check for duplicate title (case-insensitive)
          const titleKey = (ad.title || '').toLowerCase().trim();
          const titleArKey = (ad.titleAr || '').toLowerCase().trim();
          if (titleKey && seenTitles.has(titleKey)) {
            return false; // Skip duplicate
          }
          if (titleArKey && seenTitles.has(titleArKey)) {
            return false; // Skip duplicate
          }

          seenIds.add(ad.id);
          if (titleKey) seenTitles.add(titleKey);
          if (titleArKey) seenTitles.add(titleArKey);
          return true;
        });

        // If no advertisements from database, use default ones
        if (dbAdvertisements.length === 0) {
          // Convert default advertisements to the expected format
          const defaultAds: Advertisement[] = DEFAULT_ADVERTISEMENTS.map(ad => ({
            id: ad.id,
            title: ad.title,
            titleAr: ad.titleAr,
            subtitle: ad.subtitle,
            subtitleAr: ad.subtitleAr,
            badge: ad.badge,
            badgeAr: ad.badgeAr,
            badgeColor: (ad as any).badgeColor || '#DAA520',
            description: ad.description,
            descriptionAr: ad.descriptionAr,
            buttonText: ad.buttonText,
            buttonTextAr: ad.buttonTextAr,
            image: ad.image,
            price: ad.price,
            originalPrice: ad.originalPrice,
            isActive: ad.isActive,
            sortOrder: ad.sortOrder,
            displayType: ad.displayType,
            images: ad.images,
            highlightedWord: ad.highlightedWord,
            highlightedWordAr: ad.highlightedWordAr,
            highlightedWordColor: ad.highlightedWordColor,
            highlightedWordUnderline: ad.highlightedWordUnderline,
            showDiscountBadge: ad.showDiscountBadge,
            discountBadgePosition: ad.discountBadgePosition,
            features: (ad as any).features || [],
            testimonialText: (ad as any).testimonialText || '',
            testimonialTextAr: (ad as any).testimonialTextAr || '',
            testimonialAuthor: (ad as any).testimonialAuthor || '',
            testimonialAuthorAr: (ad as any).testimonialAuthorAr || '',
            promotionalBadges: (ad as any).promotionalBadges || [],
            buttons: (ad as any).buttons || []
          }));
          setAdvertisements(defaultAds);
        } else {
          setAdvertisements(dbAdvertisements);
        }
      } catch (error) {
        // On error, use default advertisements
        const defaultAds: Advertisement[] = DEFAULT_ADVERTISEMENTS.map(ad => ({
          id: ad.id,
          title: ad.title,
          titleAr: ad.titleAr,
          subtitle: ad.subtitle,
          subtitleAr: ad.subtitleAr,
          badge: ad.badge,
          badgeAr: ad.badgeAr,
          badgeColor: (ad as any).badgeColor || '#DAA520',
          description: ad.description,
          descriptionAr: ad.descriptionAr,
          buttonText: ad.buttonText,
          buttonTextAr: ad.buttonTextAr,
          image: ad.image,
          price: ad.price,
          originalPrice: ad.originalPrice,
          isActive: ad.isActive,
          sortOrder: ad.sortOrder,
          displayType: ad.displayType,
          images: ad.images,
          highlightedWord: ad.highlightedWord,
          highlightedWordAr: ad.highlightedWordAr,
          highlightedWordColor: ad.highlightedWordColor,
          highlightedWordUnderline: ad.highlightedWordUnderline,
          showDiscountBadge: ad.showDiscountBadge,
          discountBadgePosition: ad.discountBadgePosition,
          features: (ad as any).features || [],
          testimonialText: (ad as any).testimonialText || '',
          testimonialTextAr: (ad as any).testimonialTextAr || '',
          testimonialAuthor: (ad as any).testimonialAuthor || '',
          testimonialAuthorAr: (ad as any).testimonialAuthorAr || '',
          promotionalBadges: (ad as any).promotionalBadges || [],
          buttons: (ad as any).buttons || []
        }));
        setAdvertisements(defaultAds);
      } finally {
        setIsLoading(false);
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }
    };

    fetchAdvertisements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fade functionality with smooth transition
  useEffect(() => {
    if (advertisements.length === 0 || advertisements.length === 1) return;

    const interval = setInterval(() => {
      // Start fade out
      setIsFading(true);

      // After fade out completes, change ad and fade in
      setTimeout(() => {
        setCurrentAd((prev) => (prev + 1) % advertisements.length);
        setIsFading(false);
      }, 500); // Half of transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  // Professional initial load animation - Only on first load and after ads are loaded
  useEffect(() => {
    // Don't start animation if:
    // 1. Not initial load
    // 2. Still loading
    // 3. No advertisements available
    if (!isInitialLoad || isLoading || advertisements.length === 0) {
      // If not initial load or still loading, ensure visibility states are reset
      if (!isInitialLoad || isLoading) {
        setIsAdVisible(false);
        setLeftContentVisible(false);
        setRightContentVisible(false);
      }
      return;
    }

    // Reset all animation states before starting
    setIsAdVisible(false);
    setLeftContentVisible(false);
    setRightContentVisible(false);

    // Force a re-render to ensure states are reset
    const resetDelay = setTimeout(() => {
      // Small delay to ensure DOM is ready and render is complete
      const startDelay = setTimeout(() => {
        // Professional staggered animation sequence
        const timer1 = setTimeout(() => {
          setIsAdVisible(true);
        }, 150);

        const timer2 = setTimeout(() => {
          setLeftContentVisible(true);
        }, 450);

        const timer3 = setTimeout(() => {
          setRightContentVisible(true);
        }, 650);

        // Mark initial load as complete after animations finish
        const timer4 = setTimeout(() => {
          setIsInitialLoad(false);
        }, 1800); // Increased to allow all animations to complete

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
          clearTimeout(timer4);
        };
      }, 100); // Increased delay to ensure DOM is ready

      return () => {
        clearTimeout(startDelay);
      };
    }, 50);

    return () => {
      clearTimeout(resetDelay);
    };
  }, [isInitialLoad, isLoading, advertisements.length]); // Run when ads are loaded

  // Fade transition when switching ads (after initial load)
  useEffect(() => {
    if (isInitialLoad) return;

    // Reset content visibility for fade transition
    if (isFading) {
      setLeftContentVisible(false);
      setRightContentVisible(false);
    } else {
      // Fade in new content
      setTimeout(() => {
        setLeftContentVisible(true);
      }, 100);
      setTimeout(() => {
        setRightContentVisible(true);
      }, 200);
    }
  }, [isFading, isInitialLoad]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  // Generate random decorative curve on component mount and regenerate on ad change
  useEffect(() => {
    // Generate a random curved SVG path that extends beyond the page
    const generateCurve = () => {
      // Start from off-screen left, curve through, end off-screen right
      const startX = -150 + Math.random() * 100;
      const startY = 150 + Math.random() * 100;
      const control1X = 200 + Math.random() * 300;
      const control1Y = 100 + Math.random() * 150;
      const control2X = 800 + Math.random() * 400;
      const control2Y = 300 + Math.random() * 200;
      const endX = 1600 + Math.random() * 100;
      const endY = 500 + Math.random() * 200;

      return `M ${startX},${startY} C ${control1X},${control1Y} ${control2X},${control2Y} ${endX},${endY}`;
    };
    setCurvePath(generateCurve());
  }, [currentAd]); // Regenerate when ad changes

  // Notify parent about loading state
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Reset heights when advertisements list changes
  // No dynamic height calculation - using fixed height like reference site

  // If advertisements are hidden, don't render anything
  if (!showAdvertisements) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#DAA520]"></div>
      </div>
    );
  }

  if (advertisements.length === 0) {
    return null; // Don't show empty state if no advertisements
  }

  // Ensure currentAd is within bounds
  const safeCurrentAd = currentAd >= 0 && currentAd < advertisements.length ? currentAd : 0;
  const currentAdvertisement = advertisements[safeCurrentAd];

  // Function to highlight words in text
  const highlightText = (text: string, highlightedWord?: string, color?: string, underline?: boolean) => {
    if (!text) return text;

    // Split by newlines first
    const lines = text.split('\n');

    if (!highlightedWord) {
      // No highlighting, just preserve line breaks
      return (
        <span>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }

    // Has highlighting, process each line
    return (
      <span>
        {lines.map((line, lineIndex) => {
          const parts = line.split(new RegExp(`(${highlightedWord})`, 'gi'));
          return (
            <span key={lineIndex}>
              {parts.map((part, partIndex) =>
                part.toLowerCase() === highlightedWord.toLowerCase() ? (
                  <span
                    key={partIndex}
                    style={{
                      color: color || '#e91e63',
                      textDecoration: underline ? 'underline' : 'none',
                      textDecorationColor: color || '#e91e63',
                      textDecorationThickness: underline ? '2px' : '0'
                    }}
                  >
                    {part}
                  </span>
                ) : part
              )}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  };

  // Calculate discount percentage
  const calculateDiscount = (price: number, originalPrice: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // Get position classes for discount badge
  const getDiscountBadgePositionClasses = (position: string) => {
    switch (position) {
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      default:
        return 'top-6 right-6';
    }
  };

  return (
    <section
      ref={heroRef}
      className={`relative bg-primary py-12 lg:py-20 overflow-hidden ${isLoading ? 'min-h-[600px]' : ''}`}
    >
      {/* Decorative Curve - Behind Advertisement */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1600 800"
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DAA520" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#F4A460" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: 'blur(1.5px)' }}
            />
          )}
        </svg>
      </div>

      {/* Hero Content - Fixed Size Container */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Advertisement Container - Professional Initial Load Animation */}
        {!isLoading && advertisements.length > 0 && (
          <div
            className={`h-[600px] sm:h-[650px] md:h-[700px] lg:h-[750px] xl:h-[800px] relative w-full bg-card rounded-lg overflow-hidden`}
            style={{
              animation: isInitialLoad && isAdVisible
                ? 'professionalFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : undefined,
              transition: isInitialLoad && !isAdVisible
                ? undefined
                : (isInitialLoad ? undefined : 'opacity 0.5s ease-in-out'),
              opacity: isInitialLoad && !isAdVisible
                ? 0
                : (isInitialLoad && isAdVisible ? undefined : 1),
              transform: isInitialLoad && !isAdVisible
                ? 'translateY(48px) scale(0.95)'
                : undefined
            }}
          >
            {/* Fade Container for Advertisements */}
            <div className="relative h-full w-full">
              <div
                ref={adContentRef}
                className={`h-full w-full transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'
                  }`}
              >
                {/* Check if displayType is SINGLE - use special layout */}
                {currentAdvertisement.displayType === 'SINGLE' ? (
                  /* Premium Quality Products Display (SINGLE with features and testimonial) */
                  <div className="relative flex flex-col w-full h-full">
                    {/* Main Content Area - Fixed height like reference site */}
                    <div className={`flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 items-start lg:items-center p-5 sm:p-6 md:p-8 lg:p-12 h-full ${currentAdvertisement.images && currentAdvertisement.images.length >= 4
                      ? ''
                      : ''
                      }`}>
                      {/* Left Side - Content - Professional Animation */}
                      <div
                        className={`flex flex-col justify-start lg:justify-center space-y-2 sm:space-y-3 lg:space-y-4 w-full lg:h-full order-1 lg:order-1 ${!leftContentVisible ? 'opacity-0' : ''
                          }`}
                        style={{
                          animation: isInitialLoad && leftContentVisible
                            ? 'slideInFromLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                            : undefined,
                          transition: isInitialLoad
                            ? undefined
                            : 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
                          transform: isInitialLoad
                            ? undefined
                            : (leftContentVisible ? 'translateX(0)' : 'translateX(-48px)'),
                          opacity: isInitialLoad ? (leftContentVisible ? undefined : 0) : (leftContentVisible ? 1 : 0)
                        }}
                      >
                        {/* Badge - Custom Color Style - Mobile Optimized */}
                        {currentAdvertisement.badge && (
                          <div className="inline-block mb-3 sm:mb-4">
                            <span
                              className="px-1.5 py-0.5 text-white text-[9px] font-bold rounded-full shadow-md flex items-center justify-center"
                              style={{
                                background: currentAdvertisement.badgeColor
                                  ? `linear-gradient(to bottom right, ${currentAdvertisement.badgeColor}, ${currentAdvertisement.badgeColor}dd)`
                                  : 'linear-gradient(to bottom right, #DAA520, #B8860B)'
                              }}
                            >
                              {language === 'ar' ? currentAdvertisement.badgeAr : currentAdvertisement.badge}
                            </span>
                          </div>
                        )}

                        {/* Title - Reference Site Style - Mobile Optimized */}
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 leading-tight mb-2 sm:mb-3 md:mb-4">
                          {highlightText(
                            language === 'ar' ? currentAdvertisement.titleAr : currentAdvertisement.title,
                            language === 'ar' ? currentAdvertisement.highlightedWordAr : currentAdvertisement.highlightedWord,
                            currentAdvertisement.highlightedWordColor || '#DAA520',
                            currentAdvertisement.highlightedWordUnderline
                          )}
                        </h1>

                        {/* Description - Reference Site Style - Mobile Optimized */}
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed mb-3 sm:mb-4 md:mb-6 max-w-2xl">
                          {language === 'ar' ? currentAdvertisement.descriptionAr : currentAdvertisement.description}
                        </p>

                        {/* Promotional Badges */}
                        {currentAdvertisement.promotionalBadges && currentAdvertisement.promotionalBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 sm:pt-2">
                            {currentAdvertisement.promotionalBadges
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                              .map((badge, index) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md"
                                  style={{
                                    background: badge.backgroundColor
                                      ? `linear-gradient(to bottom right, ${badge.backgroundColor}, ${badge.backgroundColor}dd)`
                                      : 'linear-gradient(to bottom right, #FCE7F3, #FBCFE8)',
                                    color: badge.textColor || '#9F1239'
                                  }}
                                >
                                  <span className="line-clamp-1">{language === 'ar' ? badge.textAr : badge.text}</span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Features - Reference Site Style */}
                        {currentAdvertisement.features && currentAdvertisement.features.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {currentAdvertisement.features
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                              .map((feature, index) => (
                                <div key={index} className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                  {feature.icon && (
                                    <div className="w-12 h-12 mb-2 flex items-center justify-center text-[#DAA520]">
                                      <span className="text-3xl">{feature.icon}</span>
                                    </div>
                                  )}
                                  <h3 className="font-semibold text-gray-900 text-sm">
                                    {language === 'ar' ? feature.titleAr : feature.title}
                                  </h3>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Buttons - Support multiple buttons or single button */}
                        {currentAdvertisement.buttons && currentAdvertisement.buttons.length > 0 ? (
                          <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 sm:pt-2 max-h-[3rem] sm:max-h-[3.5rem] lg:max-h-[4rem] overflow-hidden">
                            {currentAdvertisement.buttons
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                              .slice(0, 2) // Limit to 2 buttons max
                              .map((button, index) => (
                                <Link
                                  key={index}
                                  href={button.href || '/products'}
                                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base font-semibold rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg whitespace-nowrap ${button.variant === 'primary'
                                    ? 'bg-[#6B21A8] text-white hover:bg-[#7C3AED]'
                                    : button.variant === 'secondary'
                                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                                      : 'bg-white text-[#6B21A8] border-2 border-[#6B21A8] hover:bg-[#6B21A8] hover:text-white'
                                    }`}
                                >
                                  <span className="truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]">{language === 'ar' ? button.textAr : button.text}</span>
                                  {button.variant === 'primary' && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
                                </Link>
                              ))}
                          </div>
                        ) : currentAdvertisement.buttonText ? (
                          <div className="mb-6">
                            <Link
                              href="/products"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DAA520] text-white font-semibold rounded-lg hover:bg-[#C4941F] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                              <span>{language === 'ar' ? currentAdvertisement.buttonTextAr : currentAdvertisement.buttonText}</span>
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </div>
                        ) : null}

                        {/* Testimonial - Reference Site Style */}
                        {currentAdvertisement.testimonialText && (
                          <div className="pt-4 border-t border-gray-200 mt-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-[#DAA520] rounded-full flex items-center justify-center text-white text-lg font-bold">
                                  "
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 italic mb-1">
                                  "{language === 'ar' ? currentAdvertisement.testimonialTextAr : currentAdvertisement.testimonialText}"
                                </p>
                                <p className="text-xs text-gray-500">
                                  - {language === 'ar' ? currentAdvertisement.testimonialAuthorAr : currentAdvertisement.testimonialAuthor}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Image - Professional Animation */}
                      <div
                        className={`relative w-full lg:h-full flex items-start lg:items-center justify-center order-2 lg:order-2 mt-6 sm:mt-0 ${!rightContentVisible ? 'opacity-0' : ''
                          }`}
                        style={{
                          animation: isInitialLoad && rightContentVisible
                            ? 'slideInFromRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                            : undefined,
                          transition: isInitialLoad
                            ? undefined
                            : 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
                          transform: isInitialLoad
                            ? undefined
                            : (rightContentVisible ? 'translateX(0)' : 'translateX(48px)'),
                          opacity: isInitialLoad ? (rightContentVisible ? undefined : 0) : (rightContentVisible ? 1 : 0)
                        }}
                      >
                        <div className="relative w-full max-w-full h-auto flex items-center justify-center">
                          {/* Background Circle - Pink circular accent behind image */}
                          {!currentAdvertisement.images || currentAdvertisement.images.length < 4 ? (
                            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 lg:w-[450px] lg:h-[450px] bg-pink-200 rounded-full opacity-20 -z-10"></div>
                          ) : null}
                          <img
                            src={
                              currentAdvertisement.image
                                ? (currentAdvertisement.image.startsWith('http') || currentAdvertisement.image.startsWith('https')
                                  ? currentAdvertisement.image
                                  : currentAdvertisement.image.startsWith('/')
                                    ? currentAdvertisement.image
                                    : `/uploads/${currentAdvertisement.image.replace(/^uploads\//, '')}`)
                                : '/uploads/good.png'
                            }
                            alt={language === 'ar' ? currentAdvertisement.titleAr : currentAdvertisement.title}
                            className={`w-full h-auto max-w-full object-contain relative z-10 rounded-lg ${currentAdvertisement.images && currentAdvertisement.images.length >= 4
                              ? 'max-h-[280px] sm:max-h-[250px] md:max-h-[350px] lg:max-h-[450px] xl:max-h-[500px]'
                              : 'max-h-[320px] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[450px] xl:max-h-[500px]'
                              }`}
                            style={{ maxWidth: '100%', height: 'auto' }}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== '/uploads/good.png') {
                                target.src = '/uploads/good.png';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Products Grid (4 products) - Reference Site Style with Animation - Mobile Optimized */}
                    {currentAdvertisement.images && currentAdvertisement.images.length >= 4 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[140px] sm:h-[160px] md:h-[200px] lg:h-[220px] xl:h-[240px] pb-3 pt-3 sm:pb-4 sm:pt-4 md:pb-5 md:pt-5 lg:pb-6 lg:pt-6 xl:pb-7 xl:pt-7 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 bg-card border-t border-default overflow-hidden z-10"
                        style={{
                          animation: rightContentVisible ? 'slideUpFade 0.8s ease-out 0.3s both' : 'none'
                        }}
                      >
                        {currentAdvertisement.images
                          .slice(0, 4)
                          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                          .map((product, index) => {
                            // Debug: Log product data
                            return (
                              <div
                                key={index}
                                className="bg-card rounded-lg overflow-hidden h-full flex flex-col group cursor-pointer"
                                style={{
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                  animation: `fadeInUp 0.6s ease-out ${0.4 + (index * 0.1)}s both`
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <div className="flex-1 flex items-center justify-center min-h-[60px] max-h-[80px] sm:min-h-[70px] sm:max-h-[90px] md:min-h-[90px] md:max-h-[110px] lg:min-h-[110px] lg:max-h-[130px] xl:min-h-[130px] xl:max-h-[150px] overflow-hidden">
                                  <img
                                    src={product.url || '/uploads/good.png'}
                                    alt={language === 'ar' ? product.altAr : product.alt}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (target.src !== '/uploads/good.png') {
                                        target.src = '/uploads/good.png';
                                      }
                                    }}
                                  />
                                </div>
                                <div className="p-1.5 sm:p-2 md:p-3 lg:p-4 bg-white">
                                  <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-1.5 line-clamp-1">
                                    {language === 'ar' ? product.nameAr : product.name}
                                  </h4>
                                  {product.price !== undefined && product.price !== null && (
                                    <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#DAA520]">
                                      {typeof product.price === 'number'
                                        ? (language === 'ar' ? `ج.م ${product.price.toLocaleString('en-US')}` : `EGP ${product.price.toLocaleString('en-US')}`)
                                        : String(product.price)
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Default Layout for GRID and FEATURED types */
                  <div className="flex flex-col lg:flex-row h-full">
                    {/* Text Content - Top on mobile, Left on desktop */}
                    <div className="flex-1 flex items-start lg:items-center justify-center p-4 sm:p-8 lg:p-12 order-1 lg:order-1">
                      <div
                        className={`max-w-2xl transition-all duration-700 ease-out ${leftContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                          }`}
                        style={{
                          transform: leftContentVisible ? 'translateY(0)' : 'translateY(32px)',
                          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out'
                        }}
                      >
                        {/* Badge - Custom Color Style - Mobile Optimized */}
                        {currentAdvertisement.badge && (
                          <div
                            className="inline-flex items-center justify-center gap-2 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md mb-4 sm:mb-6"
                            style={{
                              background: currentAdvertisement.badgeColor
                                ? `linear-gradient(to bottom right, ${currentAdvertisement.badgeColor}, ${currentAdvertisement.badgeColor}dd)`
                                : 'linear-gradient(to bottom right, #DAA520, #B8860B)'
                            }}
                          >
                            <span>{language === 'ar' ? currentAdvertisement.badgeAr : currentAdvertisement.badge}</span>
                          </div>
                        )}

                        {/* Main Heading - Reference Site Style - Mobile Optimized */}
                        <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
                          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 leading-tight">
                            {highlightText(
                              language === 'ar' ? currentAdvertisement.titleAr : currentAdvertisement.title,
                              language === 'ar' ? currentAdvertisement.highlightedWordAr : currentAdvertisement.highlightedWord,
                              currentAdvertisement.highlightedWordColor || '#DAA520',
                              currentAdvertisement.highlightedWordUnderline
                            )}
                          </h1>

                          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed max-w-xl">
                            {language === 'ar' ? currentAdvertisement.descriptionAr : currentAdvertisement.description}
                          </p>
                        </div>

                        {/* CTA Button - Golden Style - Mobile Optimized */}
                        {currentAdvertisement.buttonText && (
                          <div>
                            <Link
                              href="/products"
                              className="inline-flex items-center gap-2 bg-[#DAA520] hover:bg-[#C4941F] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                              <span>{language === 'ar' ? currentAdvertisement.buttonTextAr : currentAdvertisement.buttonText}</span>
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Content - Bottom on mobile, Right on desktop */}
                    <div className="flex-1 flex items-start lg:items-center justify-center p-4 sm:p-8 lg:p-12 order-2 lg:order-2">
                      <div
                        className={`relative w-full h-full ${!rightContentVisible ? 'opacity-0' : ''
                          }`}
                        style={{
                          animation: isInitialLoad && rightContentVisible
                            ? 'zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                            : undefined,
                          transition: isInitialLoad
                            ? undefined
                            : 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
                          transform: isInitialLoad
                            ? undefined
                            : (rightContentVisible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.95)'),
                          opacity: isInitialLoad ? (rightContentVisible ? undefined : 0) : (rightContentVisible ? 1 : 0)
                        }}
                      >
                        {/* Different layouts based on displayType */}
                        {currentAdvertisement.displayType === 'GRID' ? (
                          /* Product Grid - 2x2 Layout for New Arrivals */
                          <div className="grid grid-cols-2 gap-4 h-full">
                            {/* Use database images if available, otherwise fallback to hardcoded */}
                            {(currentAdvertisement.images && currentAdvertisement.images.length > 0
                              ? currentAdvertisement.images
                              : [
                                { name: 'Modern Style', price: language === 'ar' ? `ج.م ${79.99.toLocaleString('en-US')}` : `EGP ${79.99.toLocaleString('en-US')}`, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80', bg: 'bg-orange-50' },
                                { name: 'Casual Collection', price: language === 'ar' ? `ج.م ${64.99.toLocaleString('en-US')}` : `EGP ${64.99.toLocaleString('en-US')}`, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80', bg: 'bg-amber-50' },
                                { name: 'Premium Design', price: language === 'ar' ? `ج.م ${89.99.toLocaleString('en-US')}` : `EGP ${89.99.toLocaleString('en-US')}`, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80', bg: 'bg-gray-50' },
                                { name: 'Elegant Series', price: language === 'ar' ? `ج.م ${74.99.toLocaleString('en-US')}` : `EGP ${74.99.toLocaleString('en-US')}`, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80', bg: 'bg-blue-50' }
                              ]
                            ).map((product, productIndex) => {
                              // Debug: Log product data
                              return (
                                <div
                                  key={productIndex}
                                  className={`bg-white rounded-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 ${rightContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}
                                  style={{
                                    animationDelay: `${0.5 + (productIndex * 0.1)}s`,
                                    transitionDelay: `${0.5 + (productIndex * 0.1)}s`
                                  }}
                                >
                                  <div className={`aspect-[3/2] flex items-center justify-center min-h-[150px] sm:min-h-[180px] md:min-h-[220px] relative`}>
                                    <img
                                      src={(product as any).url || (product as any).image || '/uploads/good.png'}
                                      alt={(product as any).name || (product as any).alt || 'Product'}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== '/uploads/good.png') {
                                          target.src = '/uploads/good.png';
                                        }
                                      }}
                                    />

                                    {/* Badges Container */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                      {/* Discount Badge */}
                                      {(product as any).originalPrice && (product as any).price && (product as any).originalPrice > (product as any).price && (() => {
                                        const discount = Math.round(((Number((product as any).originalPrice) - Number((product as any).price)) / Number((product as any).originalPrice)) * 100);
                                        return discount > 0 ? (
                                          <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md transform hover:scale-110 transition-transform flex items-center justify-center">
                                            <span className="relative z-10">-{discount}%</span>
                                          </div>
                                        ) : null;
                                      })()}

                                      {/* New Badge */}
                                      {(product as any).isNew && (
                                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md flex items-center justify-center">
                                          <span>{language === 'ar' ? 'جديد' : 'New'}</span>
                                        </div>
                                      )}

                                      {/* Bestseller Badge */}
                                      {(product as any).isBestseller && (
                                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md flex items-center justify-center">
                                          <span>{language === 'ar' ? 'الأكثر مبيعاً' : 'Bestseller'}</span>
                                        </div>
                                      )}

                                      {/* Featured Badge */}
                                      {(product as any).isFeatured && (
                                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md flex items-center justify-center">
                                          <span>{language === 'ar' ? 'مميز' : 'Featured'}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-3 sm:p-4">
                                    <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-1 sm:mb-1.5">
                                      {language === 'ar' ? ((product as any).nameAr || (product as any).altAr || (product as any).alt) : ((product as any).name || (product as any).alt || (product as any).altAr)}
                                    </h3>
                                    {(() => {
                                      const productPrice = (product as any).price;
                                      if (productPrice !== undefined && productPrice !== null && productPrice !== '') {
                                        if (typeof productPrice === 'number' && productPrice > 0) {
                                          return (
                                            <p className="text-sm sm:text-base md:text-lg font-bold text-[#DAA520] text-left">
                                              {language === 'ar' ? `ج.م ${productPrice.toLocaleString('en-US')}` : `EGP ${productPrice.toLocaleString('en-US')}`}
                                            </p>
                                          );
                                        } else if (typeof productPrice === 'string' && productPrice.trim() !== '') {
                                          return (
                                            <p className="text-sm sm:text-base md:text-lg font-bold text-[#DAA520] text-left">
                                              {productPrice}
                                            </p>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : currentAdvertisement.displayType === 'FEATURED' ? (
                          /* Single Product Display for Season Sale */
                          <div
                            className="relative bg-white rounded-2xl overflow-hidden border-0 group h-full transition-all duration-500 hover:-translate-y-3 cursor-pointer flex flex-col"
                            style={{
                              boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.08)',
                              maxHeight: '550px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 25px 50px -10px rgba(0, 0, 0, 0.25), 0 20px 25px -5px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.08)';
                            }}
                          >
                            <div className="relative overflow-hidden w-full flex-1 aspect-[16/9] max-h-[350px] sm:max-h-[400px] md:max-h-[450px] lg:max-h-[500px] xl:max-h-[550px]">
                              <img
                                src={
                                  currentAdvertisement.image
                                    ? (currentAdvertisement.image.startsWith('http') || currentAdvertisement.image.startsWith('https')
                                      ? currentAdvertisement.image
                                      : currentAdvertisement.image.startsWith('/')
                                        ? currentAdvertisement.image
                                        : `/uploads/${currentAdvertisement.image.replace(/^uploads\//, '')}`)
                                    : '/uploads/good.png'
                                }
                                alt={language === 'ar' ? currentAdvertisement.titleAr : currentAdvertisement.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.15]"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== '/uploads/good.png') {
                                    target.src = '/uploads/good.png';
                                  }
                                }}
                              />

                              {/* Overlay with stronger effect on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent group-hover:from-black/40 group-hover:via-black/15 transition-all duration-500" />

                              {/* Animated shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                              {/* Dynamic Discount Badge with animation */}
                              {currentAdvertisement.showDiscountBadge !== false && currentAdvertisement.price && currentAdvertisement.originalPrice &&
                                calculateDiscount(currentAdvertisement.price, currentAdvertisement.originalPrice) > 0 && (
                                  <div className={`absolute ${getDiscountBadgePositionClasses(currentAdvertisement.discountBadgePosition || 'top-right')} z-10`}>
                                    <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md whitespace-nowrap inline-flex items-center justify-center transform hover:scale-110 transition-transform">
                                      <span className="relative z-10">-{calculateDiscount(currentAdvertisement.price, currentAdvertisement.originalPrice)}%</span>
                                    </div>
                                  </div>
                                )}

                              {/* Product Info Card with enhanced hover effects */}
                              <div className="absolute bottom-3 left-3 z-10">
                                <div className="bg-white/95 backdrop-blur-md rounded-lg p-2.5 max-w-[200px] shadow-xl transform group-hover:scale-105 transition-all duration-300 border border-white/20">
                                  <h3 className="text-xs font-semibold text-gray-900 mb-1 group-hover:text-red-600 transition-colors duration-300 line-clamp-1">
                                    {language === 'ar' ? currentAdvertisement.titleAr : currentAdvertisement.title}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">
                                      {currentAdvertisement.price ? (language === 'ar' ? `ج.م ${currentAdvertisement.price.toLocaleString('en-US')}` : `EGP ${currentAdvertisement.price.toLocaleString('en-US')}`) : ''}
                                    </span>
                                    {currentAdvertisement.originalPrice && (
                                      <span className="text-xs text-gray-500 line-through group-hover:text-gray-600 transition-colors">
                                        {language === 'ar' ? `ج.م ${currentAdvertisement.originalPrice.toLocaleString('en-US')}` : `EGP ${currentAdvertisement.originalPrice.toLocaleString('en-US')}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Default Single Image Display */
                          <div className="relative flex justify-center items-center h-full">
                            {/* Background Circle */}
                            <div className="w-96 h-96 bg-pink-200 rounded-full opacity-20"></div>

                            {/* Product Image */}
                            <div className="absolute z-10 flex justify-center" style={{ top: '47%', transform: 'translateY(-50%)' }}>
                              <div className="relative">
                                <img
                                  src={
                                    currentAdvertisement.image
                                      ? (currentAdvertisement.image.startsWith('http') || currentAdvertisement.image.startsWith('https')
                                        ? currentAdvertisement.image
                                        : currentAdvertisement.image.startsWith('/')
                                          ? currentAdvertisement.image
                                          : `/uploads/${currentAdvertisement.image.replace(/^uploads\//, '')}`)
                                      : '/uploads/good.png'
                                  }
                                  alt={language === 'ar' ? currentAdvertisement.titleAr : currentAdvertisement.title}
                                  className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/uploads/good.png') {
                                      target.src = '/uploads/good.png';
                                    }
                                  }}
                                />

                                {/* Floating Elements */}
                                <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-600 rounded-full opacity-80 animate-bounce"></div>
                                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full opacity-80 animate-bounce delay-200"></div>
                                <div className="absolute top-1/4 -left-6 w-4 h-4 bg-purple-400 rounded-full opacity-60 animate-bounce delay-100"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentAd((prev) => (prev - 1 + advertisements.length) % advertisements.length)}
            className="w-10 h-10 bg-white hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/25 border border-gray-200 hover:border-red-600 transform hover:scale-105"
          >
            <svg className="w-5 h-5 text-gray-600 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentAd((prev) => (prev + 1) % advertisements.length)}
            className="w-10 h-10 bg-white hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/25 border border-gray-200 hover:border-red-600 transform hover:scale-105"
          >
            <svg className="w-5 h-5 text-gray-600 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}