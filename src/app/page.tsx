'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { FashionStoreHero } from '@/components/home/FashionStoreHero';
import { ProductSections } from '@/components/home/ProductSections';
import { FeatureSections } from '@/components/home/FeatureSections';
import { Footer } from '@/components/layout/Footer';
import { ChevronRight, ArrowDown } from 'lucide-react';

interface Product {
  id: string | number; // Support both string (CUID) and number for backward compatibility
  name: string;
  nameAr?: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  originalPrice?: number;
  description: string;
  images: string[] | Array<{ url: string; alt?: string; altAr?: string }>;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  stockQuantity: number;
  category: {
    id: string | number;
    name: string;
  };
  rating?: number;
  reviewCount?: number;
  variants?: Array<{
    type: 'SIZE' | 'COLOR';
    value: string;
    valueAr?: string;
    stock?: number;
  }>;
  variantCombinations?: Array<{
    id: string;
    size?: string | null;
    color?: string | null;
    stock: number;
    sortOrder: number;
  }>;
}

export default function HomePage() {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showError, setShowError] = useState(false);
  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const [showProductSections, setShowProductSections] = useState(false);
  const [showViewAllButton, setShowViewAllButton] = useState(false);
  const [showFeatureSections, setShowFeatureSections] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch products
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let fallbackTimeout: NodeJS.Timeout | null = null;
    let productsFetched = false;

    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        // Set a shorter timeout for Burp Suite compatibility
        timeoutId = setTimeout(() => {
          if (!abortController.signal.aborted) {
            abortController.abort();
          }
          if (isMounted) {
            setIsLoading(false);
            setProducts([]);
          }
        }, 8000); // 8 seconds timeout (shorter for Burp Suite)

        // Try to fetch products with better error handling for different browsers
        let response: Response;
        try {
          // Fetch all products (or up to 100) - no limit restriction
          response = await fetch('/api/products?limit=100', {
            signal: abortController.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'same-origin', // Ensure cookies are sent
          });
        } catch (fetchError: any) {
          // Handle fetch errors (network issues, CORS, etc.)
          // Don't log AbortError as it's expected when component unmounts or in strict mode
          if (timeoutId) clearTimeout(timeoutId);
          if (isMounted && fetchError.name !== 'AbortError') {
            setIsLoading(false);
            setProducts([]);
          }
          return; // Exit early on fetch error
        }

        if (timeoutId) clearTimeout(timeoutId);

        if (!isMounted) return;

        if (response.ok) {
          let data: any;
          try {
            const responseText = await response.text();
            if (!responseText) {
              throw new Error('Empty response');
            }
            data = JSON.parse(responseText);
          } catch (parseError: any) {
            if (isMounted) {
              setProducts([]);
              setIsLoading(false);
            }
            return;
          }

          // Handle both formats: {success: true, data: [...]} and {products: [...]}
          const productsArray = data.data && Array.isArray(data.data)
            ? data.data
            : data.products && Array.isArray(data.products)
              ? data.products
              : null;

          if (!productsArray) {
            if (isMounted) {
              setProducts([]);
              setIsLoading(false);
            }
            return;
          }

          // Transform products to match expected format
          const transformedProducts = productsArray.map((product: any) => {
            const productId = product.id
              || product._id
              || product.productId
              || product.sku
              || Math.random().toString(36).substr(2, 9);
            const productName = product.name || 'Product';
            const productNameAr = product.nameAr || product.name || 'Product';
            const categoryData = product.category || {};
            const normalizedCategory = {
              id: categoryData.id
                || categoryData._id
                || product.categoryId
                || 'unknown',
              name: categoryData.name
                || product.categoryName
                || 'Category',
              nameAr: categoryData.nameAr
                || product.categoryNameAr
                || categoryData.name
                || product.categoryName
                || 'Category',
              slug: categoryData.slug || product.categorySlug || 'category'
            };
            // Handle images - keep as objects with url, alt, altAr structure
            // This matches what the API returns and what ProductCard expects
            let imageArray: Array<{ url: string; alt?: string; altAr?: string }> = [];
            if (product.images && Array.isArray(product.images)) {
              imageArray = product.images.map((img: any) => {
                // If it's already an object with url property, use it
                if (typeof img === 'object' && img !== null && img.url) {
                  return {
                    url: img.url,
                    alt: img.alt || product.name,
                    altAr: img.altAr || product.nameAr || product.name,
                  };
                }
                // If it's a string, convert to object
                if (typeof img === 'string' && img.trim()) {
                  return {
                    url: img.trim(),
                    alt: product.name,
                    altAr: product.nameAr || product.name,
                  };
                }
                // Invalid image, return null to filter out
                return null;
              }).filter((img: any) => img !== null) as Array<{ url: string; alt?: string; altAr?: string }>;
            }

            // If no images, use smart placeholder based on product name
            if (imageArray.length === 0) {
              // Use smart placeholder based on product type
              const getSmartPlaceholder = (name: string) => {
                const nameLower = name.toLowerCase();
                if (nameLower.includes('abaya') || nameLower.includes('عباية')) {
                  return 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('thobe') || nameLower.includes('ثوب') || nameLower.includes('djellaba') || nameLower.includes('جلابة')) {
                  return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('dress') || nameLower.includes('فستان')) {
                  return 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('shirt') || nameLower.includes('قميص') || nameLower.includes('t-shirt')) {
                  return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('jeans') || nameLower.includes('جينز')) {
                  return 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('jacket') || nameLower.includes('جاكيت') || nameLower.includes('coat') || nameLower.includes('معطف')) {
                  return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('suit') || nameLower.includes('بدلة')) {
                  return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('sweater') || nameLower.includes('كنزة') || nameLower.includes('hoodie')) {
                  return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('bag') || nameLower.includes('حقيبة') || nameLower.includes('handbag') || nameLower.includes('wallet') || nameLower.includes('محفظة')) {
                  return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('jewelry') || nameLower.includes('مجوهرات') || nameLower.includes('necklace') || nameLower.includes('earrings') || nameLower.includes('belt')) {
                  return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('scarf') || nameLower.includes('وشاح')) {
                  return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('cap') || nameLower.includes('طاقية') || nameLower.includes('bisht')) {
                  return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center';
                } else if (nameLower.includes('watch') || nameLower.includes('ساعة') || nameLower.includes('headphone') || nameLower.includes('speaker') || nameLower.includes('cable') || nameLower.includes('power bank')) {
                  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center';
                }
                // Default placeholder
                return 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center';
              };

              imageArray = [{
                url: getSmartPlaceholder(productName),
                alt: productName,
                altAr: productNameAr,
              }];
              // Silent - no console warning needed
            }

            // Create a new array to ensure each product has its own image array
            const finalImageArray = imageArray.map(img => ({ ...img }));

            return {
              id: productId,
              name: productName,
              nameAr: productNameAr,
              slug: product.slug || 'product',
              price: product.price || 0,
              salePrice: product.salePrice || null,
              discountPercent: product.discountPercent || null,
              originalPrice: undefined,
              description: product.description || 'Product description',
              images: finalImageArray, // Keep as objects with url, alt, altAr
              isFeatured: product.isFeatured || false,
              isNew: product.isNew || false,
              isBestseller: product.isBestseller || false,
              stockQuantity: product.stockQuantity || 0,
              category: normalizedCategory,
              rating: 4.5,
              reviewCount: Math.floor(Math.random() * 50) + 10,
              variants: product.variants || [],
              variantCombinations: product.variantCombinations || []
            };
          });

          // Check if all products have the same image URL (potential issue)
          if (transformedProducts.length > 1) {
            const firstProductFirstImage = transformedProducts[0].images[0];
            const firstImageUrl = typeof firstProductFirstImage === 'string'
              ? firstProductFirstImage
              : firstProductFirstImage?.url;

            const allSameImage = transformedProducts.every((p: any) => {
              const pFirstImage = p.images[0];
              const pImageUrl = typeof pFirstImage === 'string' ? pFirstImage : pFirstImage?.url;
              return pImageUrl === firstImageUrl;
            });

            // Check if all products have the same first image URL
          }

          if (isMounted) {
            setProducts(transformedProducts);
            productsFetched = true; // Mark as fetched
            // Clear fallback timeout since we got products
            if (fallbackTimeout) {
              clearTimeout(fallbackTimeout);
              fallbackTimeout = null;
            }
          }
        } else {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status: ${response.status} ${response.statusText}`;
          }
          if (isMounted) {
            setProducts([]);
          }
        }
      } catch (error: any) {
        if (!isMounted) return;

        if (error.name === 'AbortError') {
          // AbortError is expected when component unmounts or in React strict mode
          // Don't treat it as an error or update state
          return;
        }

        if (isMounted) {
          setProducts([]);
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    // Fallback timeout - only trigger if products weren't fetched after 12 seconds
    fallbackTimeout = setTimeout(() => {
      if (!productsFetched && isMounted) {
        setIsLoading(false);
        // Only clear products if they weren't set yet
        // Don't clear if products were already fetched
      }
    }, 12000);

    // Immediate execution
    fetchProducts();

    return () => {
      isMounted = false;
      // Only abort if not already aborted
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
      if (timeoutId) clearTimeout(timeoutId);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, []);

  // Scroll effect for View All button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);

      // Hide scroll indicator after scrolling
      if (scrollY > 200) {
        setShowScrollIndicator(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Staggered fade-in animations for sections
  useEffect(() => {
    // Reset states when hero starts loading
    if (isHeroLoading) {
      setShowProductSections(false);
      setShowViewAllButton(false);
      setShowFeatureSections(false);
      return;
    }

    // Only show product sections container after hero loads
    // The actual sections will appear with scroll animation via IntersectionObserver
    if (products.length > 0 && !isHeroLoading) {
      // Wait a bit for hero to fully render, then show container (but sections stay hidden until scroll)
      const timer = setTimeout(() => {
        setShowProductSections(true);
      }, 500); // Wait 500ms after hero loads

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isHeroLoading, products.length]);

  // Show feature sections (reviews/testimonials) after hero loads
  useEffect(() => {
    if (!isHeroLoading) {
      const timer = setTimeout(() => {
        setShowFeatureSections(true);
      }, 1500); // Wait 1.5 seconds after hero loads to show reviews section

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isHeroLoading]);

  // Fallback: if loading for too long, show error
  useEffect(() => {
    if (isLoading) {
      const errorTimeout = setTimeout(() => {
        setShowError(true);
      }, 12000); // Show error after 12 seconds

      return () => clearTimeout(errorTimeout);
    } else {
      setShowError(false);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#DAA520] mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading Products...') : 'جاري تحميل المنتجات...'}
          </h2>
          <p className="text-gray-500 mb-4" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'يرجى الانتظار بينما نجلب أحدث المنتجات' : 'Please wait while we fetch the latest products') : 'يرجى الانتظار بينما نجلب أحدث المنتجات'}
          </p>
          {showError && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800" suppressHydrationWarning>
                {mounted ? (language === 'ar'
                  ? 'يبدو أن التحميل يستغرق وقتاً طويلاً. يرجى تحديث الصفحة أو التحقق من الاتصال بالإنترنت.'
                  : 'Loading is taking longer than expected. Please refresh the page or check your internet connection.') : 'يبدو أن التحميل يستغرق وقتاً طويلاً. يرجى تحديث الصفحة أو التحقق من الاتصال بالإنترنت.'}
              </p>
              <button
                onClick={() => {
                  setIsLoading(false);
                  setProducts([]);
                  window.location.reload();
                }}
                className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                suppressHydrationWarning
              >
                {mounted ? (language === 'ar' ? 'إعادة تحميل' : 'Reload') : 'إعادة تحميل'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* FashionStore Hero Section with Curved Animations */}
      <FashionStoreHero
        products={products.map(p => ({
          ...p,
          id: p.id.toString(),
          image: Array.isArray(p.images) && p.images.length > 0
            ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url || 'https://placehold.co/600x400/eeeeee/999999?text=No+Image')
            : 'https://placehold.co/600x400/eeeeee/999999?text=No+Image',
          category: p.category?.name || 'Category'
        }))}
        onLoadingChange={setIsHeroLoading}
      />

      {/* Product Sections (Featured, Best Sellers, Latest) */}
      {!isHeroLoading && showProductSections && (
        <div>
          {products.length > 0 ? (
            <ProductSections products={products} />
          ) : (
            <section className="py-20 bg-primary">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  {language === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'No products available at the moment'}
                </h2>
                <p className="text-gray-500">
                  {language === 'ar' ? 'يرجى المحاولة لاحقاً' : 'Please try again later'}
                </p>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Single View All Products Button - Above Testimonials */}
      <section
        className={`py-12 bg-gradient-to-b from-white to-gray-50 transition-all duration-700 ease-out ${showViewAllButton
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center relative">
            {/* Scroll Indicator */}
            {showScrollIndicator && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <span className="text-xs font-medium">
                    {language === 'ar' ? 'مرر لأسفل' : 'Scroll Down'}
                  </span>
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>
            )}

            <button
              className={`group relative overflow-hidden px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform ${isScrolled
                ? 'bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-white shadow-xl hover:shadow-[#DAA520]/30 scale-105'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-[#DAA520] hover:to-[#B8860B] hover:text-white shadow-md hover:shadow-lg'
                } hover:scale-105 hover:-translate-y-1 animate-pulse`}
              onClick={() => window.open('/products', '_blank')}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#DAA520] to-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Button Content */}
              <div className="relative flex items-center gap-3">
                <span className="transition-all duration-300">
                  {language === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'}
                </span>
                <ChevronRight className={`w-5 h-5 transition-all duration-300 ${isScrolled ? 'group-hover:translate-x-1 group-hover:rotate-12' : 'group-hover:translate-x-1'
                  }`} />
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

              {/* Sparkle Effects */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping" />
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping delay-150" />
            </button>

            {/* Floating Elements - Smaller and More Dynamic */}
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#DAA520] rounded-full opacity-20 animate-bounce" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#B8860B] rounded-full opacity-30 animate-bounce delay-200" />
            <div className="absolute top-1/2 -left-4 w-3 h-3 bg-[#DAA520] rounded-full opacity-25 animate-bounce delay-100" />
            <div className="absolute top-1/4 -right-4 w-2 h-2 bg-[#B8860B] rounded-full opacity-35 animate-bounce delay-300" />
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <div
        className={`transition-all duration-700 ease-out ${showFeatureSections
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
          }`}
      >
        <FeatureSections />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
