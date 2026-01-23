'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { useWishlist } from '@/components/providers/WishlistProvider';
import {
  ArrowLeft,
  Heart,
  Share2,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { getImageSrc } from '@/lib/image-utils';

interface Product {
  _id?: string;
  id?: string; // Support both _id and id for compatibility
  name: string;
  nameAr: string;
  slug: string;
  sku: string;
  description: string;
  descriptionAr: string;
  shortDescription?: string;
  shortDescriptionAr?: string;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  stockQuantity: number;
  gender?: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  views?: number;
  clicks?: number;
  whatsappClicks?: number;
  category?: {
    _id?: string;
    id?: string;
    name: string;
    nameAr?: string;
    slug: string;
  } | string | null;
  images?: Array<{
    _id?: string;
    id?: string;
    url: string;
    alt?: string;
    altAr?: string;
    sortOrder?: number;
  }> | string[];
  variants?: Array<{
    _id?: string;
    id?: string;
    type: 'SIZE' | 'COLOR';
    value: string;
    valueAr?: string;
    price?: number;
    stock?: number;
    sortOrder?: number;
  }>;
  variantCombinations?: Array<{
    _id?: string;
    id?: string;
    size?: string | null;
    color?: string | null;
    stock: number;
    sortOrder?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { csrfToken } = useCSRF();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedCombination, setSelectedCombination] = useState<{ size?: string; color?: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: '',
    commentAr: ''
  });

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Cache for reviews to prevent excessive requests
  const reviewsCacheRef = useRef<{ [key: string]: { data: any[]; timestamp: number } }>({});
  const isFetchingReviewsRef = useRef(false);
  const reviewsCacheDuration = 2 * 60 * 1000; // 2 minutes cache for reviews

  useEffect(() => {
    const productId = product?._id?.toString() || product?.id;
    if (productId) {
      // Debounce to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchProductReviews();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [product?._id, product?.id]);

  const fetchProductReviews = async (forceRefresh = false) => {
    const productId = product?._id?.toString() || product?.id;
    if (!productId) {
      setProductReviews([]);
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && reviewsCacheRef.current[productId]) {
      const cacheAge = Date.now() - reviewsCacheRef.current[productId].timestamp;
      if (cacheAge < reviewsCacheDuration) {
        const cachedReviews = reviewsCacheRef.current[productId].data || [];
        setProductReviews(cachedReviews);
        return;
      }
    }

    // Prevent concurrent requests
    if (isFetchingReviewsRef.current) {
      return;
    }

    isFetchingReviewsRef.current = true;
    setIsLoadingReviews(true);
    try {
      const response = await fetch(`/api/customer-reviews?productId=${productId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const reviews = data.reviews || data.data?.reviews || [];

        // Update cache
        reviewsCacheRef.current[productId] = {
          data: reviews,
          timestamp: Date.now()
        };
        setProductReviews(reviews);
      } else {
        // Use cached data if available, otherwise set empty array
        if (reviewsCacheRef.current[productId]) {
          setProductReviews(reviewsCacheRef.current[productId].data || []);
        } else {
          setProductReviews([]);
        }
      }
    } catch (error) {
      // Use cached data if available, otherwise set empty array
      if (reviewsCacheRef.current[productId]) {
        setProductReviews(reviewsCacheRef.current[productId].data || []);
      } else {
        setProductReviews([]);
      }
    } finally {
      setIsLoadingReviews(false);
      isFetchingReviewsRef.current = false;
    }
  };

  const fetchProduct = async () => {
    if (!slug || typeof slug !== 'string') {
      router.push('/products');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${slug}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // Failed to fetch product
        router.push('/products');
        return;
      }

      const data = await response.json();

      // Handle MongoDB response format: {success: true, data: product}
      let productData: Product | null = null;

      if (data?.success && data?.data) {
        productData = data.data;
      } else if (data?.product) {
        productData = data.product;
      } else if (data && typeof data === 'object' && !data.success) {
        productData = data;
      }

      if (!productData) {
        router.push('/products');
        return;
      }

      // Normalize product data for MongoDB format
      const normalizedProduct: Product = {
        ...productData,
        id: productData._id?.toString() || productData.id || '',
        category: productData.category
          ? (typeof productData.category === 'object'
            ? {
              id: productData.category._id?.toString() || productData.category.id || '',
              _id: productData.category._id?.toString() || productData.category._id,
              name: productData.category.name || '',
              nameAr: productData.category.nameAr || productData.category.name || '',
              slug: productData.category.slug || ''
            }
            : null)
          : null,
        images: (productData.images || []).map((img: any) => {
          // Keep original image object structure for compatibility
          if (typeof img === 'string') {
            return { url: img, alt: '', altAr: '' };
          }
          return {
            id: img._id?.toString() || img.id || '',
            _id: img._id?.toString() || img._id,
            url: img.url || img.path || '',
            data: img.data,
            contentType: img.contentType,
            alt: img.alt || '',
            altAr: img.altAr || '',
            sortOrder: img.sortOrder || 0
          };
        }),
        variants: (productData.variants || []).map((v: any) => ({
          id: v._id?.toString() || v.id || '',
          _id: v._id?.toString() || v._id,
          type: v.type,
          value: v.value || '',
          valueAr: v.valueAr || '',
          price: v.price,
          stock: v.stock || 0,
          sortOrder: v.sortOrder || 0
        })),
        variantCombinations: (productData.variantCombinations || []).map((vc: any) => ({
          id: vc._id?.toString() || vc.id || '',
          _id: vc._id?.toString() || vc._id,
          size: vc.size || null,
          color: vc.color || null,
          stock: vc.stock || 0,
          sortOrder: vc.sortOrder || 0
        })),
        whatsappClicks: productData.clicks || productData.whatsappClicks || 0,
        views: productData.views || 0
      };

      setProduct(normalizedProduct);

      // Track product view (debounced to prevent rate limiting)
      const productId = normalizedProduct._id?.toString() || normalizedProduct.id || '';
      if (productId) {
        // Use a small delay to batch requests and prevent rate limiting
        setTimeout(() => {
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'PRODUCT_VIEW',
              productId: productId,
              entityId: productId,
              entityType: 'product',
            }),
          }).catch(() => {
            // Silently fail analytics requests to prevent console spam
          });
        }, 500); // 500ms delay
      }
    } catch (error) {
      // Error fetching product
      router.push('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return language === 'ar'
      ? `ج.م ${price.toLocaleString('en-US')}`
      : `EGP ${price.toLocaleString('en-US')}`;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const sizes = (product.variants || []).filter(v => v.type === 'SIZE');
    const colors = (product.variants || []).filter(v => v.type === 'COLOR');

    // If product has variants, show modal to select them
    if (sizes.length > 0 && colors.length > 0) {
      if (!selectedSize || !selectedColor) {
        setShowVariantModal(true);
        return;
      }
    } else if (sizes.length > 0 && !selectedSize) {
      setShowVariantModal(true);
      return;
    } else if (colors.length > 0 && !selectedColor) {
      setShowVariantModal(true);
      return;
    }

    // Proceed with adding to cart
    addToCartHandler();
  };

  // Validate comment format (Arabic, English, numbers only)
  const validateCommentFormat = (text: string): { isValid: boolean; error?: string } => {
    if (!text || !text.trim()) {
      return { isValid: false, error: language === 'ar' ? 'التعليق لا يمكن أن يكون فارغاً' : 'Comment cannot be empty' };
    }

    // Check if contains only allowed characters
    const allowedPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,!?؛،\-_()]*$/;

    if (!allowedPattern.test(text)) {
      return {
        isValid: false,
        error: language === 'ar'
          ? 'التعليق يمكن أن يحتوي فقط على حروف عربية وإنجليزية وأرقام وعلامات ترقيم أساسية'
          : 'Comment can only contain Arabic letters, English letters, numbers, spaces, and basic punctuation'
      };
    }

    if (text.trim().length < 3) {
      return { isValid: false, error: language === 'ar' ? 'التعليق يجب أن يكون على الأقل 3 أحرف' : 'Comment must be at least 3 characters long' };
    }

    if (text.length > 300) {
      return { isValid: false, error: language === 'ar' ? 'التعليق يجب ألا يتجاوز 300 حرف' : 'Comment must not exceed 300 characters' };
    }

    return { isValid: true };
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast(
        language === 'ar' ? 'يجب تسجيل الدخول لإضافة رأي عن المنتج' : 'Please login to add a product review',
        'error',
        3000
      );
      return;
    }

    // Check if at least one comment field is provided based on language
    const currentComment = language === 'ar' ? reviewFormData.commentAr : reviewFormData.comment;
    if (!currentComment || !currentComment.trim()) {
      showToast(
        language === 'ar' ? 'يرجى إضافة تعليق' : 'Please add a comment',
        'error',
        3000
      );
      return;
    }

    // Validate comment format
    const validation = validateCommentFormat(currentComment);
    if (!validation.isValid) {
      showToast(
        validation.error || (language === 'ar' ? 'صيغة التعليق غير صحيحة' : 'Invalid comment format'),
        'error',
        4000
      );
      return;
    }

    if (!csrfToken) {
      showToast(
        language === 'ar'
          ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
          : 'Your session has expired. Please sign in again.',
        'error',
        3000
      );
      return;
    }

    setIsSubmittingReview(true);
    try {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const productId = product?._id?.toString() || product?.id?.toString() || '';

      if (!productId) {
        showToast(
          language === 'ar' ? 'خطأ: معرف المنتج غير موجود' : 'Error: Product ID not found',
          'error',
          3000
        );
        setIsSubmittingReview(false);
        return;
      }

      const response = await fetch('/api/customer-reviews', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          ...reviewFormData,
          productId: productId, // Add product ID for product-specific reviews
          csrfToken: csrfToken, // Add CSRF token
        }),
      });

      if (response.ok) {
        showToast(
          language === 'ar' ? 'تم إضافة رأيك عن المنتج بنجاح!' : 'Your product review has been added successfully!',
          'success',
          3000
        );
        setReviewFormData({ rating: 5, comment: '', commentAr: '' });
        setShowReviewForm(false);

        // Clear cache and refresh product reviews after a short delay to ensure database is updated
        const productId = product?._id?.toString() || product?.id;
        if (productId && reviewsCacheRef.current[productId]) {
          delete reviewsCacheRef.current[productId];
        }

        setTimeout(async () => {
          await fetchProductReviews(true); // Force refresh to get new review
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 401) {
          showToast(
            language === 'ar'
              ? 'يجب تسجيل الدخول لإضافة رأي. يرجى تسجيل الدخول أولاً.'
              : 'You must be logged in to add a review. Please log in first.',
            'error',
            5000
          );
        } else {
          showToast(errorData.error || (language === 'ar' ? 'فشل إضافة الرأي' : 'Failed to add review'), 'error');
        }
      }
    } catch (error) {
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء إضافة الرأي' : 'Error occurred while adding review',
        'error'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const addToCartHandler = async () => {
    if (!product) return;

    // Check if stock is available using the combination
    const availableStock = getAvailableStock();

    // Validate quantity doesn't exceed stock
    if (quantity > availableStock) {
      showToast(
        language === 'ar'
          ? `المخزون المتاح: ${availableStock} فقط`
          : `Only ${availableStock} items available`,
        'error',
        4000
      );
      setQuantity(availableStock);
      return;
    }

    setIsAddingToCart(true);

    try {
      const productId = product._id?.toString() || product.id || '';
      const firstImage = Array.isArray(product.images) && product.images.length > 0
        ? getImageSrc(product.images[0] as any, '')
        : '';

      const result = addToCart({
        productId: productId,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        salePrice: product.salePrice || null,
        image: firstImage || '',
        quantity: quantity,
        selectedSize: selectedCombination?.size || selectedSize || undefined,
        selectedColor: selectedCombination?.color || selectedColor || undefined,
        stockQuantity: product.stockQuantity,
        variantStock: availableStock,
      });

      if (!result.success) {
        // Stock check failed
        showToast(
          language === 'ar' ? result.message || 'المخزون غير متوفر' : result.message || 'Stock unavailable',
          'error',
          4000
        );
        return;
      }

      // Track analytics (debounced to prevent rate limiting)
      setTimeout(() => {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ADD_TO_CART',
            entityId: product._id?.toString() || product.id || '',
            entityType: 'product',
          }),
        }).catch(() => {
          // Silently fail analytics requests to prevent console spam
        });
      }, 500); // 500ms delay

      // Show success message
      showToast(
        language === 'ar' ? 'تم إضافة المنتج للسلة!' : 'Product added to cart!',
        'success',
        3000
      );

    } catch (error) {
      // Error adding to cart
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء إضافة المنتج للسلة' : 'Error adding product to cart',
        'error',
        4000
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const nextImage = () => {
    if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (isLoading) {
    const dirValue = mounted ? (language === 'ar' ? 'rtl' : 'ltr') : 'rtl';
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center ${dirValue}`} dir={dirValue} suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DAA520] mx-auto"></div>
          <p className="mt-4 text-gray-600" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'جاري تحميل المنتج...' : 'Loading product...') : 'جاري تحميل المنتج...'}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    const dirValue = mounted ? (language === 'ar' ? 'rtl' : 'ltr') : 'rtl';
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center ${dirValue}`} dir={dirValue} suppressHydrationWarning>
        <div className="text-center">
          <Package className="mx-auto h-24 w-24 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'المنتج غير موجود' : 'Product not found') : 'المنتج غير موجود'}
          </h2>
          <p className="mt-2 text-gray-600" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'المنتج الذي تبحث عنه غير موجود' : 'The product you are looking for does not exist') : 'المنتج الذي تبحث عنه غير موجود'}
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#DAA520] hover:bg-[#B8860B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = product.discountPercent ||
    (hasDiscount ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0);

  const sizes = (product.variants || []).filter(v => v.type === 'SIZE');
  const colors = (product.variants || []).filter(v => v.type === 'COLOR');

  // Filter colors based on variant combinations (if using new system)
  const availableColors = (() => {
    if (product.variantCombinations && product.variantCombinations.length > 0) {
      if (selectedSize) {
        // Only show colors that are available for the selected size (regardless of stock)
        const availableCombos = product.variantCombinations.filter(
          combo => combo.size === selectedSize && combo.color
        );
        const colorValues = availableCombos.map(combo => combo.color!);
        return colors.filter(c => colorValues.includes(c.value));
      }
      // If no size selected, show all unique colors from all combinations
      const uniqueColorsSet = new Set(product.variantCombinations.map(c => c.color).filter((c): c is string => !!c));
      const uniqueColors = Array.from(uniqueColorsSet);
      return colors.filter(c => uniqueColors.includes(c.value));
    }
    // Fallback to all colors for legacy products
    return colors;
  })();

  // Calculate available stock based on selected combination
  const getAvailableStock = (): number => {
    // Check if product has variants that require selection
    const sizes = (product.variants || []).filter(v => v.type === 'SIZE');
    const colors = (product.variants || []).filter(v => v.type === 'COLOR');
    const hasVariants = sizes.length > 0 || colors.length > 0;

    // If product has variants but none selected, return product stock (not 0)
    if (hasVariants && !selectedSize && !selectedColor && !selectedCombination) {
      return product.stockQuantity;
    }

    // Priority 1: Use variantCombinations (new system) if available
    if (product.variantCombinations && product.variantCombinations.length > 0) {
      // If we have a specific combination selected
      if (selectedCombination) {
        const matchingCombo = product.variantCombinations.find(combo => {
          const sizeMatch = !selectedCombination.size || combo.size === selectedCombination.size;
          const colorMatch = !selectedCombination.color || combo.color === selectedCombination.color;
          return sizeMatch && colorMatch;
        });

        if (matchingCombo) {
          return matchingCombo.stock;
        }
      }

      // Fallback to selected size or color individually
      if (selectedSize || selectedColor) {
        const matchingCombo = product.variantCombinations.find(combo => {
          const sizeMatch = selectedSize ? combo.size === selectedSize : true;
          const colorMatch = selectedColor ? combo.color === selectedColor : true;
          return sizeMatch && colorMatch;
        });

        if (matchingCombo) {
          return matchingCombo.stock;
        }
        // If variant selected but no matching combo found, return 0 (specific combination doesn't exist)
        return 0;
      }

      // If no variants selected, return product stock
      return product.stockQuantity;
    }

    // Priority 2: Fallback to old variants system (legacy products)
    let availableStock = product.stockQuantity;

    if (selectedCombination) {
      let sizeVariant = null;
      let colorVariant = null;

      if (selectedCombination.size) {
        sizeVariant = (product.variants || []).find(v =>
          v.type === 'SIZE' && v.value === selectedCombination.size
        );
      }

      if (selectedCombination.color) {
        colorVariant = (product.variants || []).find(v =>
          v.type === 'COLOR' && v.value === selectedCombination.color
        );
      }

      if (sizeVariant && sizeVariant.stock !== undefined) {
        availableStock = sizeVariant.stock;
      } else if (colorVariant && colorVariant.stock !== undefined) {
        availableStock = colorVariant.stock;
      }
    } else if (selectedSize || selectedColor) {
      const selectedVariant = (product.variants || []).find(v =>
        (selectedSize && v.type === 'SIZE' && v.value === selectedSize) ||
        (selectedColor && v.type === 'COLOR' && v.value === selectedColor)
      );

      if (selectedVariant && selectedVariant.stock !== undefined) {
        availableStock = selectedVariant.stock;
      }
    }

    return availableStock;
  };

  // Check if a variant combination has stock
  const hasStockForCombination = (size?: string, color?: string): boolean => {
    if (!size && !color) return product.stockQuantity > 0;

    // Use variantCombinations if available (new system)
    if (product.variantCombinations && product.variantCombinations.length > 0) {
      // If both size and color are provided, find exact match
      if (size && color) {
        const matchingCombo = product.variantCombinations.find(combo => {
          return combo.size === size && combo.color === color;
        });
        if (matchingCombo) {
          return matchingCombo.stock > 0;
        }
      }
      // If only size is provided, check if any combination with this size has stock
      else if (size) {
        const matchingCombos = product.variantCombinations.filter(combo => combo.size === size);
        return matchingCombos.some(combo => combo.stock > 0);
      }
      // If only color is provided, check if any combination with this color has stock
      else if (color) {
        const matchingCombos = product.variantCombinations.filter(combo => combo.color === color);
        return matchingCombos.some(combo => combo.stock > 0);
      }
    }

    // Fallback: Use old variants system (for legacy products)
    if (size && color) {
      const sizeVariant = (product.variants || []).find(v => v.type === 'SIZE' && v.value === size);
      const colorVariant = (product.variants || []).find(v => v.type === 'COLOR' && v.value === color);

      // Check if both variants have stock defined
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    } else if (size) {
      const sizeVariant = (product.variants || []).find(v => v.type === 'SIZE' && v.value === size);
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
    } else if (color) {
      const colorVariant = (product.variants || []).find(v => v.type === 'COLOR' && v.value === color);
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    }

    return product.stockQuantity > 0;
  };

  // Color mapping function for professional color display
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      // Basic Colors
      'white': '#FFFFFF',
      'black': '#000000',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080',

      // Fashion Colors
      'navy': '#000080',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      'burgundy': '#800020',
      'maroon': '#800000',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'ivory': '#FFFFF0',
      'khaki': '#F0E68C',
      'olive': '#808000',
      'tan': '#D2B48C',
      'lavender': '#E6E6FA',
      'mint': '#F5FFFA',
      'peach': '#FFE5B4',
      'salmon': '#FA8072',
      'wine': '#722F37',
      'cognac': '#9F4636',
      'taupe': '#483C32',
      'charcoal': '#36454F',
      'ash': '#B2BEB5',
      'stone': '#928E85',

      // Arabic Color Names
      'أبيض': '#FFFFFF',
      'أسود': '#000000',
      'أحمر': '#FF0000',
      'أزرق': '#0000FF',
      'أخضر': '#008000',
      'أصفر': '#FFFF00',
      'برتقالي': '#FFA500',
      'بنفسجي': '#800080',
      'وردي': '#FFC0CB',
      'بني': '#A52A2A',
      'رمادي': '#808080',
      'كحلي': '#000080',
      'بيج': '#F5F5DC',
      'كريمي': '#FFFDD0',
      'ذهبي': '#FFD700',
      'فضي': '#C0C0C0',
      'كستنائي': '#800020',
      'مرجاني': '#FF7F50',
      'طرطوزي': '#40E0D0',
      'عاجي': '#FFFFF0',
      'خاكي': '#F0E68C',
      'زيتوني': '#808000',
      'كموني': '#D2B48C',
    };

    const normalizedColor = colorName.toLowerCase().trim();
    // Check if it's a hex code (e.g., #FF0000 or #F00)
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorName)) {
      return colorName;
    }
    return colorMap[normalizedColor] || '#808080';
  };

  return (
    <div className={`min-h-screen bg-primary ${mounted ? (language === 'ar' ? 'rtl' : 'ltr') : 'rtl'}`} dir={mounted ? (language === 'ar' ? 'rtl' : 'ltr') : 'rtl'} suppressHydrationWarning>
      {/* Local back-to-products header (non-sticky so it doesn't cover main header/account toggle) */}
      <header className="bg-card shadow-sm border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Link href="/products" className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-[#DAA520] transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-lg font-medium">
                  {language === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => {
                  if (navigator.share && product) {
                    navigator.share({
                      title: language === 'ar' ? product.nameAr : product.name,
                      text: language === 'ar' ? product.shortDescriptionAr || product.descriptionAr : product.shortDescription || product.description,
                      url: window.location.href,
                    }).catch(() => { });
                  } else {
                    // Fallback: Copy to clipboard
                    navigator.clipboard.writeText(window.location.href).then(() => {
                      showToast(
                        language === 'ar' ? 'تم نسخ رابط المنتج' : 'Product link copied',
                        'success',
                        2000
                      );
                    }).catch(() => { });
                  }
                }}
                className="p-2 text-gray-600 hover:text-[#DAA520] transition-colors"
                title={language === 'ar' ? 'مشاركة المنتج' : 'Share Product'}
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!product) return;
                  const productId = (product._id?.toString() || product.id || '').toString();
                  if (isInWishlist(productId)) {
                    removeFromWishlist(productId);
                    showToast(
                      language === 'ar' ? 'تم إزالة المنتج من المفضلة' : 'Product removed from wishlist',
                      'info',
                      2000
                    );
                  } else {
                    addToWishlist({
                      productId: productId,
                      name: product.name,
                      nameAr: product.nameAr || product.name,
                      price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
                      image: (Array.isArray(product.images) && product.images.length > 0)
                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url || '')
                        : '',
                      slug: product.slug,
                    });
                    showToast(
                      language === 'ar' ? 'تم إضافة المنتج للمفضلة' : 'Product added to wishlist',
                      'success',
                      2000
                    );
                  }
                }}
                className={`p-2 transition-colors ${product && isInWishlist((product._id?.toString() || product.id || '').toString())
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-600 hover:text-[#DAA520]'
                  }`}
                title={language === 'ar' ? (product && isInWishlist((product._id?.toString() || product.id || '').toString()) ? 'إزالة من المفضلة' : 'إضافة للمفضلة') : (product && isInWishlist((product._id?.toString() || product.id || '').toString()) ? 'Remove from Wishlist' : 'Add to Wishlist')}
              >
                <Heart className={`w-5 h-5 ${product && isInWishlist((product._id?.toString() || product.id || '').toString()) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-gray-50 rounded-xl shadow-lg overflow-hidden group">
              {product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[selectedImageIndex] ? (
                <img
                  src={typeof product.images[selectedImageIndex] === 'string'
                    ? product.images[selectedImageIndex]
                    : (product.images[selectedImageIndex]?.url || '/uploads/good.png')}
                  alt={language === 'ar'
                    ? (typeof product.images[selectedImageIndex] === 'object'
                      ? (product.images[selectedImageIndex]?.altAr || product.images[selectedImageIndex]?.alt || product.nameAr)
                      : product.nameAr)
                    : (typeof product.images[selectedImageIndex] === 'object'
                      ? (product.images[selectedImageIndex]?.alt || product.name)
                      : product.name)}
                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onClick={() => handleImageClick(selectedImageIndex)}
                  onLoad={() => {
                    // Image loaded successfully - no sensitive data logged
                  }}
                  onError={(e) => {
                    // Fallback to placeholder on error
                    const target = e.target as HTMLImageElement;
                    // Image failed to load - no sensitive data logged
                    if (target.src !== '/uploads/good.png' && !target.src.includes('good.png')) {
                      target.src = '/uploads/good.png';
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-8xl opacity-40">👘</div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && Array.isArray(product.images) && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => {
                  const imageUrl = typeof image === 'string' ? image : (image?.url || '');
                  const imageAlt = typeof image === 'object'
                    ? (language === 'ar' ? (image?.altAr || image?.alt || product.nameAr) : (image?.alt || product.name))
                    : (language === 'ar' ? product.nameAr : product.name);

                  return (
                    <button
                      key={typeof image === 'object'
                        ? (image.id || image._id || `image-${index}`)
                        : `image-string-${index}`}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all group ${index === selectedImageIndex
                        ? 'border-[#DAA520] ring-2 ring-[#DAA520]/20'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={imageUrl || '/uploads/good.png'}
                        alt={imageAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/uploads/good.png') {
                            target.src = '/uploads/good.png';
                          }
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && typeof product.category === 'object' && (
              <Link
                href={`/categories/${product.category.slug || ''}`}
                className="inline-block text-sm text-[#DAA520] hover:text-[#B8860B] font-medium transition-colors"
              >
                {language === 'ar' ? (product.category.nameAr || product.category.name) : product.category.name}
              </Link>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isFeatured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#DAA520] to-[#FFD700] text-white shadow-md">
                  ✨ {language === 'ar' ? 'مميز' : 'Featured'}
                </span>
              )}
              {product.isBestseller && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                  🔥 {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller'}
                </span>
              )}
              {product.isNew && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                  🆕 {language === 'ar' ? 'جديد' : 'New'}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              {language === 'ar' ? product.nameAr : product.name}
            </h1>

            {/* SKU */}
            <p className="text-sm text-gray-500">
              {language === 'ar' ? 'كود المنتج:' : 'SKU:'} {product.sku}
            </p>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-[#DAA520]">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-2xl text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
                    🔥 -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            {(product.shortDescription || product.shortDescriptionAr) && (
              <p className="text-gray-600 text-lg leading-relaxed">
                {language === 'ar' ? product.shortDescriptionAr : product.shortDescription}
              </p>
            )}

            {/* Variants */}
            <div className="space-y-6">
              {/* Sizes */}
              {sizes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {language === 'ar' ? 'المقاس:' : 'Size:'}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size, sizeIndex) => {
                      // Check if size has stock in general (without color)
                      const hasStockGeneral = hasStockForCombination(size.value, undefined);
                      // Check if size has stock for selected color (if color is selected)
                      const hasStockForColor = selectedColor
                        ? hasStockForCombination(size.value, selectedColor)
                        : true;

                      // Size is available if it has stock in general
                      // But if color is selected and size doesn't have stock for that color,
                      // we'll reset the color when size is selected
                      const isAvailable = hasStockGeneral;

                      return (
                        <button
                          key={size.id || size._id || `size-${size.value}-${sizeIndex}`}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedSize(size.value);
                              setSelectedCombination(prev => prev ? { ...prev, size: size.value } : { size: size.value });

                              // Always reset color when changing size - user needs to select color for new size
                              if (selectedColor) {
                                // Check if this color exists for the new size
                                const colorExistsForNewSize = product.variantCombinations?.some(
                                  combo => combo.size === size.value && combo.color === selectedColor
                                );

                                // If color doesn't exist for new size, reset it
                                if (!colorExistsForNewSize) {
                                  setSelectedColor('');
                                  setSelectedCombination({ size: size.value });
                                }
                              }

                              setQuantity(1); // Reset quantity when size changes
                            }
                          }}
                          className={`px-6 py-3 border-2 rounded-lg text-sm font-medium transition-all relative ${!isAvailable
                            ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                            : selectedSize === size.value
                              ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#DAA520]'
                              : 'border-gray-300 hover:border-gray-400 text-gray-700'
                            }`}
                          disabled={!isAvailable}
                          title={selectedColor && !hasStockForColor && isAvailable
                            ? (language === 'ar' ? `المقاس متوفر ولكن غير متوفر للون ${selectedColor}` : `Size available but not for color ${selectedColor}`)
                            : undefined}
                        >
                          {!isAvailable && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</span>
                          )}
                          {selectedColor && !hasStockForColor && isAvailable && (
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" title={language === 'ar' ? 'غير متوفر للون المحدد' : 'Not available for selected color'}>!</span>
                          )}
                          {size.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {language === 'ar' ? 'اللون:' : 'Color:'}
                    {sizes.length > 0 && !selectedSize && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color, colorIndex) => {
                      // Check stock based on selected size or just color
                      const hasStock = selectedSize
                        ? hasStockForCombination(selectedSize, color.value)
                        : hasStockForCombination(undefined, color.value);

                      // Check if color is available for ANY size (not just selected size)
                      const hasStockForAnySize = hasStockForCombination(undefined, color.value);

                      // Determine the state of this color
                      const isCompletelyOutOfStock = !hasStockForAnySize; // No stock at all
                      const isAvailableForOtherSizes = hasStockForAnySize && !hasStock && selectedSize; // Has stock, but not for selected size

                      return (
                        <div key={color.id || color._id || `color-${color.value}-${colorIndex}`} className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              if (hasStock) {
                                setSelectedColor(color.value);
                                setSelectedCombination(prev => prev ? { ...prev, color: color.value } : { color: color.value });
                                setQuantity(1); // Reset quantity when color changes
                              }
                            }}
                            className={`relative w-14 h-14 rounded-full border-2 transition-all shadow-md hover:shadow-lg transform ${isCompletelyOutOfStock
                              ? 'opacity-20 cursor-not-allowed grayscale'
                              : isAvailableForOtherSizes
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:scale-110'
                              } ${selectedColor === color.value && hasStock
                                ? 'border-[#DAA520] ring-4 ring-[#DAA520]/30 scale-110'
                                : 'border-gray-300 hover:border-gray-400'
                              }`}
                            style={{
                              backgroundColor: getColorHex(color.value)
                            }}
                            title={
                              isCompletelyOutOfStock
                                ? (language === 'ar' ? `${color.valueAr} - نفد المخزون` : `${color.value} - Out of Stock`)
                                : isAvailableForOtherSizes
                                  ? (language === 'ar' ? `${color.valueAr} - متوفر لمقاسات أخرى` : `${color.value} - Available for other sizes`)
                                  : (language === 'ar' ? color.valueAr : color.value)
                            }
                            disabled={!hasStock}
                          >
                            {isCompletelyOutOfStock && (
                              <>
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-10">✕</span>
                                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 font-bold text-xs">0</span>
                                </div>
                              </>
                            )}
                            {isAvailableForOtherSizes && (
                              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-10">⚠</span>
                            )}
                            {selectedColor === color.value && hasStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                  <div className="w-3 h-3 bg-[#DAA520] rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </button>
                          <span className={`text-xs mt-1.5 font-medium ${selectedColor === color.value && hasStock
                            ? 'text-[#DAA520]'
                            : isCompletelyOutOfStock
                              ? 'text-gray-300 line-through'
                              : isAvailableForOtherSizes
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}>
                            {language === 'ar' ? color.valueAr : color.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {language === 'ar' ? 'الكمية:' : 'Quantity:'}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({language === 'ar' ? 'المتاح:' : 'Available:'} {getAvailableStock()})
                </span>
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#DAA520] hover:bg-[#DAA520]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-20 text-center font-semibold text-xl">
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    const available = getAvailableStock();
                    if (quantity < available) {
                      setQuantity(quantity + 1);
                    } else {
                      showToast(
                        language === 'ar' ? `المخزون المتاح: ${available} فقط` : `Only ${available} items available`,
                        'error',
                        3000
                      );
                    }
                  }}
                  disabled={quantity >= getAvailableStock()}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#DAA520] hover:bg-[#DAA520]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={(() => {
                const sizes = product.variants.filter(v => v.type === 'SIZE');
                const colors = product.variants.filter(v => v.type === 'COLOR');
                const needsSelection = (sizes.length > 0 && !selectedSize) ||
                  (colors.length > 0 && !selectedColor) ||
                  (sizes.length > 0 && colors.length > 0 && (!selectedSize || !selectedColor));
                const availableStock = getAvailableStock();
                // Only disable if stock is 0 AND variant is selected (or product has no variants)
                const hasVariantsSelected = Boolean(selectedSize || selectedColor);
                const hasNoVariants = sizes.length === 0 && colors.length === 0;
                const isOutOfStock = availableStock === 0 && (hasVariantsSelected || hasNoVariants);
                return Boolean(isOutOfStock || isAddingToCart || needsSelection);
              })()}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${(() => {
                const sizes = product.variants.filter(v => v.type === 'SIZE');
                const colors = product.variants.filter(v => v.type === 'COLOR');
                const needsSelection = (sizes.length > 0 && !selectedSize) ||
                  (colors.length > 0 && !selectedColor) ||
                  (sizes.length > 0 && colors.length > 0 && (!selectedSize || !selectedColor));
                const availableStock = getAvailableStock();
                const isOutOfStock = availableStock === 0 && (selectedSize || selectedColor || (!sizes.length && !colors.length));
                return isOutOfStock || needsSelection;
              })()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isInCart((product._id?.toString() || product.id || ''))
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  : 'bg-[#DAA520] text-white hover:bg-[#B8860B] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
            >
              {isAddingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                </>
              ) : isInCart((product._id?.toString() || product.id || '')) ? (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {language === 'ar' ? 'في السلة' : 'In Cart'}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {(() => {
                    const sizes = product.variants.filter(v => v.type === 'SIZE');
                    const colors = product.variants.filter(v => v.type === 'COLOR');
                    const availableStock = getAvailableStock();

                    // Check if selection is needed first
                    if (sizes.length > 0 && colors.length > 0 && (!selectedSize || !selectedColor)) {
                      return language === 'ar' ? 'اختر اللون والمقاس' : 'Select Color & Size';
                    }
                    if (sizes.length > 0 && !selectedSize) {
                      return language === 'ar' ? 'اختر المقاس' : 'Select Size';
                    }
                    if (colors.length > 0 && !selectedColor) {
                      return language === 'ar' ? 'اختر اللون' : 'Select Color';
                    }

                    // Only check stock if ALL required variants are selected or product has no variants
                    const allVariantsSelected = (sizes.length === 0 || selectedSize) && (colors.length === 0 || selectedColor);
                    if (availableStock === 0 && allVariantsSelected) {
                      return language === 'ar' ? 'نفد المخزون' : 'Out of Stock';
                    }

                    return language === 'ar' ? 'أضف للسلة' : 'Add to Cart';
                  })()}
                </>
              )}
            </button>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'ضمان الجودة' : 'Quality Guarantee'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'منتج مميز' : 'Premium Product'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-16 bg-gray-50 rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {language === 'ar' ? 'وصف المنتج' : 'Product Description'}
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
              {language === 'ar' ? product.descriptionAr : product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[selectedImageIndex] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-6xl max-h-full bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button and image counter */}
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {selectedImageIndex + 1} / {product.images && Array.isArray(product.images) ? product.images.length : 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm hidden sm:block">
                  {language === 'ar' ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}
                </span>
                <button
                  onClick={closeImageModal}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title={language === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation arrows */}
            {product.images && Array.isArray(product.images) && product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                  title={language === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                  title={language === 'ar' ? 'الصورة التالية' : 'Next image'}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main image */}
            <div className="flex items-center justify-center min-h-[70vh] bg-gray-100">
              <img
                src={typeof product.images[selectedImageIndex] === 'string'
                  ? product.images[selectedImageIndex]
                  : (product.images[selectedImageIndex]?.url || '/uploads/good.png')}
                alt={language === 'ar'
                  ? (typeof product.images[selectedImageIndex] === 'object'
                    ? (product.images[selectedImageIndex]?.altAr || product.images[selectedImageIndex]?.alt || product.nameAr)
                    : product.nameAr)
                  : (typeof product.images[selectedImageIndex] === 'object'
                    ? (product.images[selectedImageIndex]?.alt || product.name)
                    : product.name)}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  // Fallback to placeholder on error
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/uploads/good.png') {
                    target.src = '/uploads/good.png';
                  }
                }}
              />
            </div>

            {/* Thumbnail navigation */}
            {product.images && Array.isArray(product.images) && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-full p-2">
                <div className="flex gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${index === selectedImageIndex
                        ? 'bg-white scale-125'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                        }`}
                      title={`${language === 'ar' ? 'صورة' : 'Image'} ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Close instruction for mobile */}
            <div className="absolute bottom-4 left-4 right-4 sm:hidden">
              <div className="bg-black bg-opacity-50 text-white text-center py-2 px-4 rounded-lg">
                <span className="text-sm">
                  {language === 'ar' ? 'اضغط خارج الصورة للإغلاق' : 'Tap outside to close'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {showVariantModal && product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={() => setShowVariantModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'اختر اللون والمقاس' : 'Select Color & Size'}
                </h2>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Variant Selection */}
              <div className="space-y-6">
                {/* Sizes */}
                {sizes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'ar' ? 'المقاس:' : 'Size:'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {sizes.map((size, sizeIndex) => {
                        // Check if size has stock in general (without color)
                        const hasStockGeneral = hasStockForCombination(size.value, undefined);
                        // Check if size has stock for selected color (if color is selected)
                        const hasStockForColor = selectedColor
                          ? hasStockForCombination(size.value, selectedColor)
                          : true;

                        // Size is available if it has stock in general
                        // But if color is selected and size doesn't have stock for that color,
                        // we'll reset the color when size is selected
                        const isAvailable = hasStockGeneral;

                        return (
                          <button
                            key={size.id || size._id || `size-modal-${size.value}-${sizeIndex}`}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedSize(size.value);
                                setSelectedCombination(prev => prev ? { ...prev, size: size.value } : { size: size.value });

                                // Always reset color when changing size - user needs to select color for new size
                                if (selectedColor) {
                                  // Check if this color exists for the new size
                                  const colorExistsForNewSize = product.variantCombinations?.some(
                                    combo => combo.size === size.value && combo.color === selectedColor
                                  );

                                  // If color doesn't exist for new size, reset it
                                  if (!colorExistsForNewSize) {
                                    setSelectedColor('');
                                    setSelectedCombination({ size: size.value });
                                  }
                                }

                                setQuantity(1);
                              }
                            }}
                            className={`px-6 py-3 border-2 rounded-lg text-sm font-medium transition-all relative ${!isAvailable
                              ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              : selectedSize === size.value
                                ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#DAA520]'
                                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                              }`}
                            disabled={!isAvailable}
                            title={selectedColor && !hasStockForColor && isAvailable
                              ? (language === 'ar' ? `المقاس متوفر ولكن غير متوفر للون ${selectedColor}` : `Size available but not for color ${selectedColor}`)
                              : undefined}
                          >
                            {!isAvailable && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</span>
                            )}
                            {selectedColor && !hasStockForColor && isAvailable && (
                              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" title={language === 'ar' ? 'غير متوفر للون المحدد' : 'Not available for selected color'}>!</span>
                            )}
                            {size.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {availableColors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'ar' ? 'اللون:' : 'Color:'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map((color, colorIndex) => {
                        const hasStock = selectedSize
                          ? hasStockForCombination(selectedSize, color.value)
                          : hasStockForCombination(undefined, color.value);

                        // Check if color is available for ANY size (not just selected size)
                        const hasStockForAnySize = hasStockForCombination(undefined, color.value);

                        // Determine the state of this color
                        const isCompletelyOutOfStock = !hasStockForAnySize; // No stock at all
                        const isAvailableForOtherSizes = hasStockForAnySize && !hasStock && selectedSize; // Has stock, but not for selected size

                        const colorVariant = (product.variants || []).find(v => v.type === 'COLOR' && v.value === color.value);
                        const displayStock = colorVariant?.stock ?? product.stockQuantity;

                        return (
                          <div key={color.id || color._id || `color-modal-${color.value}-${colorIndex}`} className="flex flex-col items-center">
                            <button
                              onClick={() => {
                                if (hasStock) {
                                  setSelectedColor(color.value);
                                  setSelectedCombination(prev => prev ? { ...prev, color: color.value } : { color: color.value });
                                  setQuantity(1);
                                }
                              }}
                              className={`relative w-14 h-14 rounded-full border-2 transition-all shadow-md hover:shadow-lg transform ${isCompletelyOutOfStock
                                ? 'opacity-20 cursor-not-allowed grayscale'
                                : isAvailableForOtherSizes
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'hover:scale-110'
                                } ${selectedColor === color.value && hasStock
                                  ? 'border-[#DAA520] ring-4 ring-[#DAA520]/30 scale-110'
                                  : 'border-gray-300 hover:border-gray-400'
                                }`}
                              style={{
                                backgroundColor: getColorHex(color.value)
                              }}
                              title={
                                isCompletelyOutOfStock
                                  ? (language === 'ar' ? `${color.valueAr} - نفد المخزون` : `${color.value} - Out of Stock`)
                                  : isAvailableForOtherSizes
                                    ? (language === 'ar' ? `${color.valueAr} - متوفر لمقاسات أخرى` : `${color.value} - Available for other sizes`)
                                    : (language === 'ar' ? color.valueAr : color.value)
                              }
                              disabled={!hasStock}
                            >
                              {isCompletelyOutOfStock && (
                                <>
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-10">✕</span>
                                  <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-xs">0</span>
                                  </div>
                                </>
                              )}
                              {isAvailableForOtherSizes && (
                                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-10">⚠</span>
                              )}
                              {selectedColor === color.value && hasStock && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-[#DAA520] rounded-full"></div>
                                  </div>
                                </div>
                              )}
                            </button>
                            <span className={`text-xs mt-1.5 font-medium ${selectedColor === color.value && hasStock
                              ? 'text-[#DAA520]'
                              : isCompletelyOutOfStock
                                ? 'text-gray-300 line-through'
                                : isAvailableForOtherSizes
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                              }`}>
                              {language === 'ar' ? color.valueAr : color.value}
                            </span>
                            {selectedColor === color.value && hasStock && (
                              <span className="text-xs mt-0.5 text-green-600 font-semibold">
                                {displayStock} {language === 'ar' ? 'متاح' : 'in stock'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {language === 'ar' ? 'الكمية:' : 'Quantity:'}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({language === 'ar' ? 'المتاح:' : 'Available:'} {getAvailableStock()})
                    </span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#DAA520] hover:bg-[#DAA520]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-20 text-center font-semibold text-xl">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        const available = getAvailableStock();
                        if (quantity < available) {
                          setQuantity(quantity + 1);
                        } else {
                          showToast(
                            language === 'ar' ? `المخزون المتاح: ${available} فقط` : `Only ${available} items available`,
                            'error',
                            3000
                          );
                        }
                      }}
                      disabled={quantity >= getAvailableStock()}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#DAA520] hover:bg-[#DAA520]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  addToCartHandler();
                }}
                disabled={(() => {
                  const needsSize = sizes.length > 0 && !selectedSize;
                  const needsColor = colors.length > 0 && !selectedColor;
                  return needsSize || needsColor || getAvailableStock() === 0 || isAddingToCart;
                })()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 mt-6 ${(() => {
                  const needsSize = sizes.length > 0 && !selectedSize;
                  const needsColor = colors.length > 0 && !selectedColor;
                  return getAvailableStock() === 0 || needsSize || needsColor
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#DAA520] text-white hover:bg-[#B8860B] shadow-lg hover:shadow-xl transform hover:scale-105'
                })()
                  }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isAddingToCart
                  ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                  : (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Review Section */}
      {product && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
          <ScrollReveal direction="up" delay={0}>
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {language === 'ar' ? 'آراء العملاء' : 'Customer Reviews'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                {language === 'ar'
                  ? 'شاركنا رأيك عن هذا المنتج'
                  : 'Share your opinion about this product'
                }
              </p>

              {/* Add Review Button */}
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="inline-flex items-center gap-2 bg-[#DAA520] text-white px-6 py-3 rounded-lg hover:bg-[#B8860B] transition-colors font-semibold"
              >
                <Send className="w-5 h-5" />
                {language === 'ar' ? 'أضف رأيك عن المنتج' : 'Add Your Review'}
              </button>
            </div>
          </ScrollReveal>

          {/* Review Form */}
          {showReviewForm && (
            <div className="max-w-2xl mx-auto mb-16 bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {language === 'ar' ? 'شاركنا رأيك' : 'Share Your Opinion'}
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {language === 'ar' ? 'التقييم' : 'Rating'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        id={`rating-star-${star}`}
                        name={`ratingStar${star}`}
                        onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${star <= reviewFormData.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'تعليقك' : 'Your Comment'}
                  </label>
                  <textarea
                    id="review-comment"
                    name="reviewComment"
                    value={language === 'ar' ? reviewFormData.commentAr : reviewFormData.comment}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove HTML tags and allow only Arabic, English, numbers, spaces, and safe punctuation
                      value = value.replace(/<[^>]*>/g, ''); // Remove HTML tags
                      value = value.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,!?؛،\-_()]/g, '');
                      // Limit length to 300 characters
                      if (value.length > 300) {
                        value = value.substring(0, 300);
                      }
                      setReviewFormData(prev => ({
                        ...prev,
                        [language === 'ar' ? 'commentAr' : 'comment']: value
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DAA520] resize-none"
                    rows={4}
                    placeholder={language === 'ar' ? 'أضف تعليقك هنا...' : 'Add your comment here...'}
                    maxLength={300}
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#DAA520] text-white px-6 py-3 rounded-lg hover:bg-[#B8860B] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {language === 'ar' ? 'إرسال الرأي' : 'Submit Review'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Display Product Reviews */}
          <div className="max-w-4xl mx-auto mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {language === 'ar' ? 'آراء العملاء عن هذا المنتج' : 'Customer Reviews for This Product'}
            </h3>

            {isLoadingReviews ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAA520] mx-auto"></div>
                <p className="mt-2 text-gray-600">
                  {language === 'ar' ? 'جاري تحميل التعليقات...' : 'Loading reviews...'}
                </p>
              </div>
            ) : productReviews && productReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productReviews.map((review, reviewIndex) => (
                  <div key={review.id || review._id || `review-${reviewIndex}`} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 overflow-hidden" style={{ wordBreak: 'break-word' }}>
                    <div className="flex items-center mb-4">
                      {review.user?.avatar ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0 border-2 border-gray-200 shadow-sm">
                          <img
                            src={getImageSrc(review.user.avatar, '')}
                            alt={`${review.user.firstName} ${review.user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#B8860B] flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 shadow-sm">
                          {review.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                          {review.user?.lastName?.charAt(0)?.toUpperCase() || ''}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 text-base antialiased">
                          {review.user?.firstName} {review.user?.lastName}
                        </h4>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic break-words overflow-hidden">
                      "{language === 'ar' && review.commentAr ? review.commentAr : review.comment}"
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {review.createdAt && !isNaN(new Date(review.createdAt).getTime())
                        ? new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {language === 'ar'
                  ? 'لا توجد تعليقات على هذا المنتج بعد. كن أول من يشارك رأيه!'
                  : 'No reviews for this product yet. Be the first to share your opinion!'
                }
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
