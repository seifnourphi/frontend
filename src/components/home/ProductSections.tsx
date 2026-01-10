'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Heart, Eye, Star, ChevronRight, ArrowDown, Plus, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useRouter } from 'next/navigation';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

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
    id: number;
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

interface ProductSectionsProps {
  products: Product[];
}

interface SectionSettings {
  id: string;
  name: string;
  nameAr: string;
  isEnabled: boolean;
  sortOrder: number;
  maxProducts: number;
  showTitle: boolean;
  showViewAll: boolean;
  selectedProductIds?: string[]; // For latest section - selected products to display
}

export function ProductSections({ products }: ProductSectionsProps) {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();
  const [visibleProducts, setVisibleProducts] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<Array<{ id: string, name: string, nameAr: string }>>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  // Removed bestSellerVisible state - now using ScrollReveal component
  const [sectionsSettings, setSectionsSettings] = useState<SectionSettings[]>([]);
  const [selectedProductsCache, setSelectedProductsCache] = useState<Map<string, Product>>(new Map());
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Variant modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Helper function to get section settings by ID
  const getSectionSettings = (sectionId: string): SectionSettings => {
    const section = sectionsSettings.find(s => s.id === sectionId);
    // Default values if section not found
    const defaultSettings = {
      id: sectionId,
      name: '',
      nameAr: '',
      isEnabled: true,
      sortOrder: 0,
      maxProducts: 8,
      showTitle: true,
      showViewAll: true
    };

    if (!section) {
      return defaultSettings;
    }

    // Ensure maxProducts and sortOrder are numbers
    const maxProducts = typeof section.maxProducts === 'string'
      ? parseInt(section.maxProducts, 10)
      : typeof section.maxProducts === 'number'
        ? section.maxProducts
        : 8;

    const sortOrder = typeof section.sortOrder === 'string'
      ? parseInt(section.sortOrder, 10)
      : typeof section.sortOrder === 'number'
        ? section.sortOrder
        : 0;

    const settings = {
      ...defaultSettings,
      ...section,
      maxProducts: maxProducts || 8,
      sortOrder: sortOrder || 0,
      selectedProductIds: section.selectedProductIds && Array.isArray(section.selectedProductIds)
        ? section.selectedProductIds
          .map((id: any) => {
            if (typeof id === 'string' && id.trim().length > 0) {
              return id.trim();
            }
            if (typeof id === 'number' && !isNaN(id)) {
              // Convert number to string for consistency
              return String(id);
            }
            return null;
          })
          .filter((id: any): id is string => id != null && typeof id === 'string' && id.length > 0)
        : undefined
    };

    return settings;
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    fetchCategories();
  }, []);

  // Fetch sections settings from API
  useEffect(() => {
    const fetchSectionsSettings = async () => {
      try {
        // Add cache busting to ensure fresh data
        const response = await fetch(`/api/sections?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          const sections = data.success && data.data?.sections
            ? data.data.sections
            : data.sections || [];
          const normalizedSections = Array.isArray(sections) ? sections : [];

          // Normalize maxProducts, sortOrder to numbers and preserve selectedProductIds
          const finalSections = normalizedSections.map((s: any) => ({
            ...s,
            maxProducts: typeof s.maxProducts === 'number'
              ? s.maxProducts
              : typeof s.maxProducts === 'string'
                ? parseInt(s.maxProducts, 10) || 8
                : Number(s.maxProducts) || 8,
            sortOrder: typeof s.sortOrder === 'number'
              ? s.sortOrder
              : typeof s.sortOrder === 'string'
                ? parseInt(s.sortOrder, 10) || 0
                : Number(s.sortOrder) || 0,
            selectedProductIds: s.selectedProductIds && Array.isArray(s.selectedProductIds)
              ? s.selectedProductIds
                .map((id: any) => {
                  if (typeof id === 'string' && id.trim().length > 0) {
                    return id.trim();
                  }
                  if (typeof id === 'number' && !isNaN(id)) {
                    // Convert number to string for consistency
                    return String(id);
                  }
                  return null;
                })
                .filter((id: any): id is string => id != null && typeof id === 'string' && id.length > 0)
              : undefined
          }));

          setSectionsSettings(finalSections);
        } else {
          // Silently handle error
        }
      } catch (error) {
        // Silently handle error
      }
    };

    fetchSectionsSettings();

    // Listen for storage events (when settings are updated in admin panel)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sectionsSettingsUpdated') {
        fetchSectionsSettings();
      }
    };

    // Listen for custom events
    const handleSettingsUpdate = () => {
      fetchSectionsSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sectionsSettingsUpdated', handleSettingsUpdate);

    // Poll for changes every 5 minutes (optimized to reduce CPU usage)
    const pollInterval = setInterval(() => {
      fetchSectionsSettings();
    }, 300000); // 5 minutes instead of 30 seconds for better performance

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sectionsSettingsUpdated', handleSettingsUpdate);
      clearInterval(pollInterval);
    };
  }, []);

  // Intersection Observer for scroll-based animations - sections appear only when scrolled into view
  useEffect(() => {
    if (products.length === 0 || sectionsSettings.length === 0) {
      // Reset visibility when data is not ready
      setVisibleSections(new Set());
      return;
    }

    // Reset visibility first - all sections start hidden
    setVisibleSections(new Set());

    const observers: IntersectionObserver[] = [];

    const setupObserver = () => {
      const sectionIds = ['new', 'latest', 'bestsellers', 'featured'];

      sectionIds.forEach((sectionId) => {
        const element = sectionRefs.current.get(sectionId);
        if (element) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  // Only show section when it enters viewport
                  setVisibleSections((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(sectionId);
                    return newSet;
                  });
                  observer.unobserve(entry.target);
                }
              });
            },
            {
              threshold: 0.05, // Trigger when 5% of section is visible
              rootMargin: '50px 0px' // Start animation 50px before section enters viewport (smooth but not too early)
            }
          );

          observer.observe(element);
          observers.push(observer);
        }
      });
    };

    // Wait for DOM to be ready before setting up observers
    const timeout = setTimeout(setupObserver, 100);

    return () => {
      clearTimeout(timeout);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [products.length, sectionsSettings.length]);

  // Fetch selected products that are not in the main products list
  useEffect(() => {
    const fetchSelectedProducts = async () => {
      const latestSection = sectionsSettings.find(s => s.id === 'latest');
      if (!latestSection?.selectedProductIds || latestSection.selectedProductIds.length === 0) {
        return;
      }

      // Find missing products - normalize IDs for comparison
      const missingIds = latestSection.selectedProductIds.filter(id => {
        const searchId = String(id).trim();
        const productExists = products.find(p => String(p.id).trim() === searchId);
        const cachedExists = selectedProductsCache.has(searchId);
        return !productExists && !cachedExists;
      });

      if (missingIds.length === 0) {
        return;
      }

      // Fetch missing products individually from admin API (includes inactive products)
      try {
        // Try to fetch from admin API first (includes inactive products)
        const adminResponse = await fetch(`/api/admin/products?limit=1000`, {
          credentials: 'include',
          cache: 'no-store',
        });

        let productsList: any[] = [];
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          // Handle structured response format
          if (adminData.success && adminData.data?.products) {
            productsList = adminData.data.products;
          } else if (Array.isArray(adminData.products)) {
            productsList = adminData.products;
          }
        } else {
          // Fallback to public API
          const response = await fetch(`/api/products?limit=200`, {
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            productsList = data.products || data.data?.products || [];
          }
        }

        const fetchedProducts = new Map<string, Product>();

        for (const productId of missingIds) {
          // Normalize productId for comparison
          const searchId = String(productId).trim();
          const product = productsList.find((p: any) => {
            const pId = String(p.id || p._id || '').trim();
            return pId === searchId;
          });
          if (product) {
            // Normalize product data
            const normalizedProduct: Product = {
              id: product.id || product._id,
              name: product.name || 'Unknown',
              nameAr: product.nameAr || product.name,
              slug: product.slug || '',
              price: product.price || 0,
              salePrice: product.salePrice || null,
              discountPercent: product.discountPercent || null,
              originalPrice: product.originalPrice,
              description: product.description || '',
              images: product.images || [],
              isFeatured: product.isFeatured || false,
              isNew: product.isNew || false,
              isBestseller: product.isBestseller || false,
              stockQuantity: product.stockQuantity || 0,
              category: product.category || { id: product.categoryId || '', name: product.categoryName || '' },
              rating: product.rating,
              reviewCount: product.reviewCount,
              variants: product.variants || [],
              variantCombinations: product.variantCombinations || [],
            };
            // Use normalized searchId as cache key
            fetchedProducts.set(searchId, normalizedProduct);
          }
        }

        if (fetchedProducts.size > 0) {
          setSelectedProductsCache(prev => {
            const newCache = new Map(prev);
            fetchedProducts.forEach((product, id) => {
              newCache.set(id, product);
            });
            return newCache;
          });
        }
      } catch (error) {
        // Silently fail - products will not be shown
      }
    };

    if (sectionsSettings.length > 0) {
      fetchSelectedProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsSettings, products]); // Removed selectedProductsCache to prevent infinite loop

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

  // Note: Best Sellers section now uses ScrollReveal component for animations
  // No need for IntersectionObserver here anymore


  const handleAddToCart = (product: Product) => {
    // Check if product has variants
    const sizes = (product.variants || []).filter((v: any) => v.type === 'SIZE');
    const colors = (product.variants || []).filter((v: any) => v.type === 'COLOR');

    // If product has variants, show modal to select them
    if (sizes.length > 0 || colors.length > 0) {
      setSelectedProductForModal(product);
      setShowVariantModal(true);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      return;
    }

    // No variants, add directly to cart
    if (product.stockQuantity > 0) {
      const imageUrl = Array.isArray(product.images) && product.images.length > 0
        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
        : '';
      const displayPrice = (product.salePrice && product.salePrice > 0) ? product.salePrice : product.price;

      const result = addToCart({
        name: language === 'ar' ? product.nameAr || product.name : product.name,
        nameAr: product.nameAr || product.name,
        productId: product.id.toString(),
        price: displayPrice,
        image: imageUrl,
        quantity: 1,
        stockQuantity: product.stockQuantity,
      });

      if (result.success) {
        showToast(
          language === 'ar' ? 'تم إضافة المنتج للسلة!' : 'Product added to cart!',
          'success',
          3000
        );
      } else if (result.message) {
        showToast(
          result.message,
          'error',
          3000
        );
      }
    } else {
      showToast(
        language === 'ar' ? 'المنتج غير متوفر في المخزون' : 'Product is out of stock',
        'error',
        3000
      );
    }
  };

  // Check if a variant combination has stock
  const hasStockForCombination = (size?: string, color?: string): boolean => {
    if (!selectedProductForModal) return false;
    if (!size && !color) return selectedProductForModal.stockQuantity > 0;

    // Use variantCombinations if available (new system)
    if (selectedProductForModal.variantCombinations && selectedProductForModal.variantCombinations.length > 0) {
      // If both size and color are provided, find exact match
      if (size && color) {
        const matchingCombo = selectedProductForModal.variantCombinations.find(combo => {
          return combo.size === size && combo.color === color;
        });
        if (matchingCombo) {
          return matchingCombo.stock > 0;
        }
      }
      // If only size is provided, check if any combination with this size has stock
      else if (size) {
        const matchingCombos = selectedProductForModal.variantCombinations.filter(combo => combo.size === size);
        return matchingCombos.some(combo => combo.stock > 0);
      }
      // If only color is provided, check if any combination with this color has stock
      else if (color) {
        const matchingCombos = selectedProductForModal.variantCombinations.filter(combo => combo.color === color);
        return matchingCombos.some(combo => combo.stock > 0);
      }
    }

    // Fallback: Use old variants system (for legacy products)
    if (size && color) {
      const sizeVariant = (selectedProductForModal.variants || []).find((v: any) => v.type === 'SIZE' && v.value === size);
      const colorVariant = (selectedProductForModal.variants || []).find((v: any) => v.type === 'COLOR' && v.value === color);

      // Check if both variants have stock defined
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    } else if (size) {
      const sizeVariant = (selectedProductForModal.variants || []).find((v: any) => v.type === 'SIZE' && v.value === size);
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
    } else if (color) {
      const colorVariant = (selectedProductForModal.variants || []).find((v: any) => v.type === 'COLOR' && v.value === color);
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    }

    return selectedProductForModal.stockQuantity > 0;
  };

  // Get available stock for selected combination
  const getAvailableStock = (): number => {
    if (!selectedProductForModal) return 0;

    // Priority 1: Use variantCombinations (new system) if available
    if (selectedProductForModal.variantCombinations && selectedProductForModal.variantCombinations.length > 0) {
      // If we have both size and color selected, find exact match
      if (selectedSize && selectedColor) {
        const matchingCombo = selectedProductForModal.variantCombinations.find(combo => {
          const sizeMatch = combo.size === selectedSize;
          const colorMatch = combo.color === selectedColor;
          return sizeMatch && colorMatch;
        });

        if (matchingCombo) {
          return matchingCombo.stock;
        }
      } else if (selectedSize) {
        // Only size selected, find matching combos and sum stock
        const matchingCombos = selectedProductForModal.variantCombinations.filter(combo =>
          combo.size === selectedSize
        );
        if (matchingCombos.length > 0) {
          return matchingCombos.reduce((sum, combo) => sum + combo.stock, 0);
        }
      } else if (selectedColor) {
        // Only color selected, find matching combos and sum stock
        const matchingCombos = selectedProductForModal.variantCombinations.filter(combo =>
          combo.color === selectedColor
        );
        if (matchingCombos.length > 0) {
          return matchingCombos.reduce((sum, combo) => sum + combo.stock, 0);
        }
      }

      // If no match, return 0 (this specific combination doesn't exist)
      return 0;
    }

    // Priority 2: Fallback to old variants system (legacy products)
    let availableStock = selectedProductForModal.stockQuantity;

    if (selectedSize || selectedColor) {
      const selectedVariant = (selectedProductForModal.variants || []).find((v: any) =>
        (selectedSize && v.type === 'SIZE' && v.value === selectedSize) ||
        (selectedColor && v.type === 'COLOR' && v.value === selectedColor)
      );

      if (selectedVariant && selectedVariant.stock !== undefined) {
        availableStock = selectedVariant.stock;
      }
    }

    return availableStock;
  };

  // Color mapping function
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
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
      'navy': '#000080',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      'burgundy': '#800020',
      'maroon': '#800000',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'mint': '#98FF98',
      'lavender': '#E6E6FA',
    };

    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || colorName;
  };

  const handleAddToCartFromModal = () => {
    if (!selectedProductForModal) return;

    const sizes = (selectedProductForModal.variants || []).filter((v: any) => v.type === 'SIZE');
    const colors = (selectedProductForModal.variants || []).filter((v: any) => v.type === 'COLOR');

    // Validate selection
    if ((sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor)) {
      return;
    }

    // Validate stock before adding to cart
    if (!hasStockForCombination(selectedSize || undefined, selectedColor || undefined)) {
      showToast(
        language === 'ar' ? 'المخزون غير متوفر' : 'Stock unavailable',
        'error',
        3000
      );
      return;
    }

    const imageUrl = Array.isArray(selectedProductForModal.images) && selectedProductForModal.images.length > 0
      ? (typeof selectedProductForModal.images[0] === 'string' ? selectedProductForModal.images[0] : selectedProductForModal.images[0].url)
      : '';
    const displayPrice = (selectedProductForModal.salePrice && selectedProductForModal.salePrice > 0)
      ? selectedProductForModal.salePrice
      : selectedProductForModal.price;

    const availableStock = getAvailableStock();
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

    const result = addToCart({
      name: language === 'ar' ? selectedProductForModal.nameAr || selectedProductForModal.name : selectedProductForModal.name,
      nameAr: selectedProductForModal.nameAr || selectedProductForModal.name,
      productId: selectedProductForModal.id.toString(),
      price: displayPrice,
      image: imageUrl,
      quantity: quantity,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
      stockQuantity: selectedProductForModal.stockQuantity,
      variantStock: availableStock,
    });

    if (result.success) {
      showToast(
        language === 'ar' ? 'تم إضافة المنتج للسلة!' : 'Product added to cart!',
        'success',
        3000
      );

      setShowVariantModal(false);
      setSelectedProductForModal(null);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
    } else if (result.message) {
      showToast(
        result.message,
        'error',
        3000
      );
    }
  };

  // Helper function to get image URL
  const getImageUrl = (images: string[] | Array<{ url: string; alt?: string; altAr?: string }>, productName: string): string => {
    if (!images || images.length === 0) {
      return getDefaultImage(productName);
    }
    const firstImage = images[0];

    // Handle string format
    if (typeof firstImage === 'string') {
      const trimmedUrl = firstImage.trim();
      if (trimmedUrl && trimmedUrl !== '' && trimmedUrl !== 'null' && trimmedUrl !== 'undefined') {
        return trimmedUrl;
      }
      return getDefaultImage(productName);
    }

    // Handle object format
    if (firstImage && typeof firstImage === 'object' && firstImage !== null && 'url' in firstImage) {
      const urlValue = firstImage.url;
      if (urlValue && typeof urlValue === 'string') {
        const trimmedUrl = urlValue.trim();
        if (trimmedUrl && trimmedUrl !== '' && trimmedUrl !== 'null' && trimmedUrl !== 'undefined') {
          return trimmedUrl;
        }
      }
    }

    // Fallback to default image
    return getDefaultImage(productName);
  };

  const getDefaultImage = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('shirt') || name.includes('t-shirt')) {
      return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center';
    } else if (name.includes('jeans')) {
      return 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center';
    } else if (name.includes('dress')) {
      return 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center';
    } else if (name.includes('suit')) {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center';
    } else if (name.includes('jacket')) {
      return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&crop=center';
    }
    return 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center';
  };

  const getDefaultImages = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('shirt') || name.includes('t-shirt')) {
      return [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
      ];
    } else if (name.includes('jeans')) {
      return [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
      ];
    } else if (name.includes('dress')) {
      return [
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
      ];
    } else if (name.includes('suit')) {
      return [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
      ];
    } else if (name.includes('jacket')) {
      return [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
      ];
    }
    return [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
    ];
  };

  // Filter products (for featured section)
  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'All') return true;
    return product.category.id.toString() === selectedCategory;
  });

  // Get section settings
  const newSectionSettings = getSectionSettings('new');
  const latestSectionSettings = getSectionSettings('latest');
  const bestsellersSectionSettings = getSectionSettings('bestsellers');
  const featuredSectionSettings = getSectionSettings('featured');

  // Prepare products for each section
  // Only show products marked as new, don't fallback to all products
  const newProductsFiltered = products.filter(p => p.isNew);
  // Always use only the filtered products (marked as new), even if less than maxProducts
  const newMaxProductsRaw = newSectionSettings?.maxProducts ?? 8;
  const newMaxProductsRequested = typeof newMaxProductsRaw === 'number' ? newMaxProductsRaw : parseInt(String(newMaxProductsRaw), 10) || 8;
  // Use only products marked as new, don't fallback to all products
  const newProducts = newProductsFiltered.length > 0
    ? newProductsFiltered
    : []; // Show empty if no products marked as new


  // Ensure maxProducts is a valid number - use the value directly from settings
  let newMaxProducts = 8;

  if (newMaxProductsRaw !== undefined && newMaxProductsRaw !== null) {
    if (typeof newMaxProductsRaw === 'number' && !isNaN(newMaxProductsRaw)) {
      newMaxProducts = newMaxProductsRaw;
    } else if (typeof newMaxProductsRaw === 'string') {
      const parsed = parseInt(newMaxProductsRaw, 10);
      if (!isNaN(parsed)) {
        newMaxProducts = parsed;
      }
    } else {
      const converted = Number(newMaxProductsRaw);
      if (!isNaN(converted)) {
        newMaxProducts = converted;
      }
    }
  }

  // Ensure it's a positive number between 1 and 100
  newMaxProducts = Math.max(1, Math.min(100, Math.floor(newMaxProducts)));

  const newDisplayProducts = newProducts.slice(0, newMaxProducts);

  // Prepare latest products - show most recently added products
  // For latest, we'll use all products sorted by ID (newest first) or use products as-is
  const latestMaxProductsRaw = latestSectionSettings?.maxProducts ?? 8;
  const latestMaxProductsRequested = typeof latestMaxProductsRaw === 'number' ? latestMaxProductsRaw : parseInt(String(latestMaxProductsRaw), 10) || 8;

  // Ensure maxProducts is a valid number for latest section
  let latestMaxProducts = 8;

  if (latestMaxProductsRaw !== undefined && latestMaxProductsRaw !== null) {
    if (typeof latestMaxProductsRaw === 'number' && !isNaN(latestMaxProductsRaw)) {
      latestMaxProducts = latestMaxProductsRaw;
    } else if (typeof latestMaxProductsRaw === 'string') {
      const parsed = parseInt(latestMaxProductsRaw, 10);
      if (!isNaN(parsed)) {
        latestMaxProducts = parsed;
      }
    } else {
      const converted = Number(latestMaxProductsRaw);
      if (!isNaN(converted)) {
        latestMaxProducts = converted;
      }
    }
  }

  // Ensure it's a positive number between 1 and 100
  latestMaxProducts = Math.max(1, Math.min(100, Math.floor(latestMaxProducts)));

  // For latest, use selected products if available, otherwise use products sorted by ID (newest first)
  let latestDisplayProducts: Product[] = [];
  if (latestSectionSettings?.selectedProductIds && latestSectionSettings.selectedProductIds.length > 0) {
    // Use selected products in the order they were selected
    // Normalize IDs to ensure they're strings
    const normalizedIds = latestSectionSettings.selectedProductIds
      .map((id: any) => {
        if (typeof id === 'string' && id.trim().length > 0) {
          return id.trim();
        }
        if (typeof id === 'number' && !isNaN(id)) {
          // Convert number to string for consistency
          return String(id);
        }
        return null;
      })
      .filter((id: any): id is string => id != null && typeof id === 'string' && id.length > 0);

    // When using selectedProductIds, show all selected products (up to 5)
    // Don't limit by maxProducts when products are explicitly selected
    const foundProducts = normalizedIds
      .map(id => {
        // Normalize the search ID
        const searchId = String(id).trim();

        // First, try to find in main products list - normalize both IDs for comparison
        const foundInProducts = products.find(p => {
          const productId = String(p.id).trim();
          return productId === searchId;
        });
        if (foundInProducts) {
          return foundInProducts;
        }

        // Then, try to find in cache - normalize cache key
        const foundInCache = selectedProductsCache.get(searchId);
        if (foundInCache) {
          return foundInCache;
        }

        // Product not found - will be filtered out
        return null;
      })
      .filter((p): p is Product => p !== undefined && p !== null);

    latestDisplayProducts = foundProducts;

    // Note: Some products may not exist or may be inactive
    // This is expected behavior when products are deleted or deactivated
    // No slice here - show all selected products that were found (should be all 3, 4, or 5)
  } else {
    // Fallback: use products sorted by ID (newest first)
    // Handle both string and number IDs
    latestDisplayProducts = [...products].sort((a, b) => {
      const aId = typeof a.id === 'string' ? a.id : String(a.id);
      const bId = typeof b.id === 'string' ? b.id : String(b.id);
      return bId.localeCompare(aId); // Sort strings descending
    }).slice(0, latestMaxProducts);
  }

  // Prepare bestseller products - only show products marked as bestseller
  const bestsellerProductsFiltered = products.filter(p => p.isBestseller);
  // Always use only the filtered products (marked as bestseller), even if less than maxProducts
  const bestsellersMaxProductsRaw = bestsellersSectionSettings?.maxProducts ?? 8;
  const bestsellersMaxProductsRequested = typeof bestsellersMaxProductsRaw === 'number' ? bestsellersMaxProductsRaw : parseInt(String(bestsellersMaxProductsRaw), 10) || 8;
  // Use only products marked as bestseller, don't fallback to all products
  const bestsellerProducts = bestsellerProductsFiltered.length > 0
    ? bestsellerProductsFiltered
    : []; // Show empty if no products marked as bestseller


  // Ensure maxProducts is a valid number - use the value directly from settings
  let bestsellersMaxProducts = 8;

  if (bestsellersMaxProductsRaw !== undefined && bestsellersMaxProductsRaw !== null) {
    if (typeof bestsellersMaxProductsRaw === 'number' && !isNaN(bestsellersMaxProductsRaw)) {
      bestsellersMaxProducts = bestsellersMaxProductsRaw;
    } else if (typeof bestsellersMaxProductsRaw === 'string') {
      const parsed = parseInt(bestsellersMaxProductsRaw, 10);
      if (!isNaN(parsed)) {
        bestsellersMaxProducts = parsed;
      }
    } else {
      const converted = Number(bestsellersMaxProductsRaw);
      if (!isNaN(converted)) {
        bestsellersMaxProducts = converted;
      }
    }
  }

  // Ensure it's a positive number between 1 and 100
  bestsellersMaxProducts = Math.max(1, Math.min(100, Math.floor(bestsellersMaxProducts)));

  const bestsellersDisplayProducts = bestsellerProducts.slice(0, bestsellersMaxProducts);

  // Prepare featured products - check if any are marked as featured, otherwise use all
  const featuredProductsFiltered = products.filter(p => p.isFeatured);
  // Get maxProducts first to check if we have enough featured products
  const featuredMaxProductsRaw = featuredSectionSettings?.maxProducts ?? 8;
  const featuredMaxProductsRequested = typeof featuredMaxProductsRaw === 'number' ? featuredMaxProductsRaw : parseInt(String(featuredMaxProductsRaw), 10) || 8;
  const featuredProductsBase = (featuredProductsFiltered.length > 0 && featuredProductsFiltered.length >= featuredMaxProductsRequested)
    ? featuredProductsFiltered
    : products; // Use all products if not enough marked or none marked

  // Extract unique categories from featured products
  const featuredCategoriesMap = new Map<string, { id: string, name: string, nameAr: string }>();
  featuredProductsBase.forEach(product => {
    if (product.category && product.category.id) {
      const categoryId = product.category.id.toString();
      if (!featuredCategoriesMap.has(categoryId)) {
        featuredCategoriesMap.set(categoryId, {
          id: categoryId,
          name: product.category.name || '',
          nameAr: product.category.nameAr || product.category.name || ''
        });
      }
    }
  });
  const featuredCategories = Array.from(featuredCategoriesMap.values());

  // Apply category filter if needed
  const featuredProducts = selectedCategory === 'All'
    ? featuredProductsBase
    : featuredProductsBase.filter(product => product.category.id.toString() === selectedCategory);

  // Ensure maxProducts is a valid number
  let featuredMaxProducts = 8;

  if (featuredMaxProductsRaw !== undefined && featuredMaxProductsRaw !== null) {
    if (typeof featuredMaxProductsRaw === 'number' && !isNaN(featuredMaxProductsRaw)) {
      featuredMaxProducts = featuredMaxProductsRaw;
    } else if (typeof featuredMaxProductsRaw === 'string') {
      const parsed = parseInt(featuredMaxProductsRaw, 10);
      if (!isNaN(parsed)) {
        featuredMaxProducts = parsed;
      }
    } else {
      const converted = Number(featuredMaxProductsRaw);
      if (!isNaN(converted)) {
        featuredMaxProducts = converted;
      }
    }
  }

  // Ensure it's a positive number between 1 and 100
  featuredMaxProducts = Math.max(1, Math.min(100, Math.floor(featuredMaxProducts)));

  const featuredDisplayProducts = featuredProducts.slice(0, featuredMaxProducts);


  // Prepare sections with their data and sort by sortOrder
  const sectionsToRender = [
    {
      id: 'new',
      settings: newSectionSettings,
      products: newDisplayProducts,
      sectionType: 'new' as const
    },
    {
      id: 'latest',
      settings: latestSectionSettings,
      products: latestDisplayProducts,
      sectionType: 'latest' as const
    },
    {
      id: 'bestsellers',
      settings: bestsellersSectionSettings,
      products: bestsellersDisplayProducts,
      sectionType: 'bestsellers' as const
    },
    {
      id: 'featured',
      settings: featuredSectionSettings,
      products: featuredDisplayProducts,
      sectionType: 'featured' as const
    }
  ].filter(section => section.settings.isEnabled)
    .sort((a, b) => (a.settings.sortOrder || 0) - (b.settings.sortOrder || 0));

  return (
    <>
      {sectionsToRender.map((section) => {
        if (section.sectionType === 'new') {
          const sectionId = 'new';
          const isVisible = visibleSections.has(sectionId);
          return (
            <section
              key="new"
              ref={(el) => {
                if (el) sectionRefs.current.set(sectionId, el);
              }}
              className={`py-8 sm:py-12 md:py-16 lg:py-20 bg-white transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              style={{
                visibility: isVisible ? 'visible' : 'hidden'
              }}
            >
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {section.settings.showTitle && (
                  <ScrollReveal direction="up" delay={0}>
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                        {language === 'ar' ? (section.settings.nameAr || 'أحدث المنتجات') : (section.settings.name || 'Latest Products')}
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                        {language === 'ar'
                          ? 'اكتشف أحدث منتجاتنا المضافة حديثاً'
                          : 'Discover our newest products just added'
                        }
                      </p>
                    </div>
                  </ScrollReveal>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                  {section.products.map((product, index) => (
                    <ScrollReveal
                      key={product.id}
                      direction="up"
                      delay={Math.min(index * 50, 1000)}
                      className="group bg-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-700 ease-out hover:-translate-y-2 h-[240px] sm:h-[280px] md:h-[340px] lg:h-[400px] flex flex-col relative"
                      style={{
                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 15px -6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(0, 0, 0, 0.2), 0 15px 25px -6px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 15px -6px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      {/* Product Image */}
                      <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[280px] overflow-hidden">
                        {/* Main Image */}
                        <img
                          src={getImageUrl(product.images || [], product.name)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getDefaultImage(product.name);
                          }}
                        />

                        {/* Second Image (on hover) - fade effect */}
                        {product.images && product.images.length > 1 && (() => {
                          const secondImage = typeof product.images[1] === 'string'
                            ? product.images[1]
                            : product.images[1]?.url || getImageUrl(product.images || [], product.name);
                          return (
                            <img
                              src={secondImage}
                              alt={`${product.name} - View 2`}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                              onError={(e) => {
                                // If second image fails, hide it
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          );
                        })()}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 flex flex-col gap-1 sm:gap-2">
                          <span className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white px-1.5 py-0.5 rounded-full text-[8px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-md">
                            {language === 'ar' ? 'جديد' : 'New'}
                          </span>
                          {(() => {
                            const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                            const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;
                            const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);
                            const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                            const discountPercent = hasDiscountFromSale
                              ? (product.discountPercent && product.discountPercent > 0
                                ? product.discountPercent
                                : originalPriceValue ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                  : Math.round(((product.price - displayPrice) / product.price) * 100))
                              : hasDiscountFromOriginal && originalPriceValue
                                ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                : null;

                            const hasDiscount = (hasDiscountFromSale && displayPrice < (originalPriceValue || product.price)) || hasDiscountFromOriginal;

                            return hasDiscount && discountPercent && discountPercent > 0 ? (
                              <span className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white px-1.5 py-0.5 sm:px-2 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-lg">
                                -{discountPercent}%
                              </span>
                            ) : null;
                          })()}
                        </div>

                        {/* Bottom gradient shadow with buttons overlay - Same as bestsellers */}
                        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:pointer-events-auto pointer-events-none"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                            height: '35%',
                            paddingBottom: '16px'
                          }}
                        >
                          <div className="flex flex-col items-center gap-3 w-full px-4 h-full justify-end">
                            {/* Add to Cart Button - Same as bestsellers section */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                product.stockQuantity > 0 && handleAddToCart(product);
                              }}
                              disabled={product.stockQuantity === 0}
                              className={`w-full bg-[#DAA520] text-white py-2.5 px-4 rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${product.stockQuantity === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-[#B8860B]'
                                }`}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span className="text-sm">
                                {product.stockQuantity === 0
                                  ? (language === 'ar' ? 'نفد المخزون' : 'Out of Stock')
                                  : (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
                                }
                              </span>
                            </button>

                            {/* Action Icons - Same as bestsellers */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (isInWishlist(product.id.toString())) {
                                    removeFromWishlist(product.id.toString());
                                  } else {
                                    addToWishlist({
                                      productId: product.id.toString(),
                                      name: product.name,
                                      nameAr: product.nameAr || product.name,
                                      price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
                                      image: getImageUrl(product.images || [], product.name),
                                      slug: product.slug,
                                    });
                                  }
                                }}
                                className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                                title={language === 'ar' ? 'أضف للمفضلة' : 'Add to Favorites'}
                              >
                                <Heart className={`w-4 h-4 ${isInWishlist(product.id.toString()) ? 'fill-current text-red-500' : 'text-white'}`} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`/products/${product.slug}`, '_blank');
                                }}
                                className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                                title={language === 'ar' ? 'عرض المنتج' : 'View Product'}
                              >
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Product Info */}
                      <div className="pb-2 pt-1.5 sm:pb-3 sm:pt-2 md:pb-4 md:pt-3 px-2 sm:px-3 md:px-4 flex flex-col flex-1">
                        {/* Product Name */}
                        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 line-clamp-2 leading-tight">
                          {language === 'ar' ? (product.nameAr || product.name) : product.name}
                        </h3>

                        {/* Price */}
                        <div className="mb-1 sm:mb-1.5 md:mb-2 flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                          {(() => {
                            const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                            const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;
                            const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);
                            const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                            const discountPercent = hasDiscountFromSale
                              ? (product.discountPercent && product.discountPercent > 0
                                ? product.discountPercent
                                : originalPriceValue ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                  : Math.round(((product.price - displayPrice) / product.price) * 100))
                              : hasDiscountFromOriginal && originalPriceValue
                                ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                : null;

                            const hasDiscount = (hasDiscountFromSale && displayPrice < (originalPriceValue || product.price)) || hasDiscountFromOriginal;

                            return (
                              <>
                                <span className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-[#DAA520]">
                                  {language === 'ar'
                                    ? `ج.م ${displayPrice.toLocaleString('en-US')}`
                                    : `EGP ${displayPrice.toLocaleString('en-US')}`
                                  }
                                </span>
                                {hasDiscount && originalPriceValue && originalPriceValue > displayPrice && (
                                  <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through">
                                    {language === 'ar'
                                      ? `ج.م ${originalPriceValue.toLocaleString('en-US')}`
                                      : `EGP ${originalPriceValue.toLocaleString('en-US')}`
                                    }
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Rating - Hidden on very small screens */}
                        <div className="hidden sm:flex items-center gap-0.5 sm:gap-1">
                          {(() => {
                            const rating = product.rating || 4.8;
                            const reviewCount = product.reviewCount || 42;
                            const fullStars = Math.floor(rating);
                            const hasHalfStar = rating % 1 >= 0.5;

                            return (
                              <>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${star <= fullStars
                                        ? 'text-yellow-400 fill-current'
                                        : star === fullStars + 1 && hasHalfStar
                                          ? 'text-yellow-400 fill-current opacity-50'
                                          : 'text-gray-300'
                                        }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] sm:text-xs md:text-sm text-gray-600">({reviewCount})</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>
          );
        } else if (section.sectionType === 'latest') {
          const sectionId = 'latest';
          const isVisible = visibleSections.has(sectionId);
          return (
            // Latest products section - compact height with highly interactive button
            <section
              key="latest"
              ref={(el) => {
                if (el) sectionRefs.current.set(sectionId, el);
              }}
              className={`py-4 bg-gray-100 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              style={{
                visibility: isVisible ? 'visible' : 'hidden'
              }}
            >
              <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
                {/* Category Cards - Large cards that adapt to number of products */}
                <div className={`grid gap-1.5 md:gap-2 ${section.products.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                  section.products.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                    section.products.length === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' :
                      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                  {section.products.map((product, index) => {
                    // Get category name or use product name
                    const categoryName = language === 'ar'
                      ? (product.category?.nameAr || product.category?.name || product.name)
                      : (product.category?.name || product.name);
                    // Extract first word or use category name
                    const displayName = categoryName.split(' ')[0].toUpperCase() || categoryName.toUpperCase();

                    return (
                      <ScrollReveal
                        key={product.id}
                        direction="up"
                        delay={index * 100}
                        className="group relative bg-white rounded-lg overflow-hidden cursor-pointer shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5"
                      >
                        {/* Product Image - Large card style */}
                        <div
                          className="relative w-full aspect-[4/5] md:aspect-[5/6] bg-gray-100 overflow-hidden max-h-[280px] md:max-h-[340px]"
                          onClick={() => router.push(`/products/${product.slug}`)}
                        >
                          <img
                            src={getImageUrl(product.images || [], product.name)}
                            alt={product.name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 ease-in-out group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getDefaultImage(product.name);
                            }}
                          />

                          {/* Category Button - larger, pill-shaped with brand gradient */}
                          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const categoryId = product.category?.id;
                                if (categoryId) {
                                  router.push(`/products?category=${categoryId}`);
                                } else {
                                  router.push(`/products/${product.slug}`);
                                }
                              }}
                              className="group/btn relative px-6 py-2 rounded-full font-semibold text-xs md:text-sm
                                       bg-gradient-to-r from-[#DAA520] to-[#FACC15]
                                       text-white shadow-xl hover:shadow-2xl
                                       active:scale-95 transition-all duration-200
                                       flex items-center justify-center gap-1.5
                                       transform group-hover:-translate-y-1 group-hover:scale-110"
                            >
                              <span className="relative z-10 font-semibold tracking-wide whitespace-nowrap transition-colors duration-200">
                                {displayName}
                              </span>
                              <ChevronRight className="w-4 h-4 relative z-10 transition-all duration-200 group-hover/btn:translate-x-1.5" />
                            </button>
                          </div>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        } else if (section.sectionType === 'bestsellers') {
          const sectionId = 'bestsellers';
          const isVisible = visibleSections.has(sectionId);
          return (
            <section
              key="bestsellers"
              ref={(el) => {
                if (el) sectionRefs.current.set(sectionId, el);
              }}
              className={`py-8 sm:py-12 md:py-16 lg:py-20 bg-white transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              style={{
                visibility: isVisible ? 'visible' : 'hidden'
              }}
            >
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {section.settings.showTitle && (
                  <ScrollReveal direction="up" delay={0}>
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                        {language === 'ar' ? (section.settings.nameAr || 'الأكثر مبيعاً') : (section.settings.name || 'Best Sellers')}
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                        {language === 'ar'
                          ? 'منتجاتنا الأكثر شعبية وطلباً من العملاء'
                          : 'Our most popular and customer-favorite products'
                        }
                      </p>
                    </div>
                  </ScrollReveal>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5 relative">
                  {section.products.map((product, index) => {
                    const totalProducts = section.products.length;
                    const zIndex = totalProducts - index;

                    return (
                      <ScrollReveal
                        key={product.id}
                        direction="up"
                        delay={index * 100}
                        duration={600}
                        distance={40}
                        popup={true}
                        scale={0.8}
                        className="best-seller-card group bg-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-700 ease-out hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-105 hover:z-50 h-[240px] sm:h-[280px] md:h-[340px] lg:h-[400px] flex flex-col relative shadow-md hover:shadow-xl"
                        style={{
                          transformOrigin: 'center bottom',
                          zIndex: zIndex,
                          position: 'relative'
                        }}
                      >
                        {/* Product Image */}
                        <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[280px] overflow-hidden">
                          {/* Main Image */}
                          <img
                            src={getImageUrl(product.images || [], product.name)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getDefaultImage(product.name);
                            }}
                          />

                          {/* Second Image (on hover) - fade effect */}
                          {product.images && product.images.length > 1 && (() => {
                            const secondImage = typeof product.images[1] === 'string'
                              ? product.images[1]
                              : product.images[1]?.url || getImageUrl(product.images || [], product.name);
                            return (
                              <img
                                src={secondImage}
                                alt={`${product.name} - View 2`}
                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                                onError={(e) => {
                                  // If second image fails, hide it
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            );
                          })()}

                          {/* Badges */}
                          <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                            {product.isBestseller && (
                              <span className="bg-gradient-to-br from-amber-500 to-orange-500 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-md">
                                {language === 'ar' ? 'الأكثر مبيعاً' : 'Bestseller'}
                              </span>
                            )}
                            {(() => {
                              const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                              const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;
                              const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);
                              const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                              const discountPercent = hasDiscountFromSale
                                ? (product.discountPercent && product.discountPercent > 0
                                  ? product.discountPercent
                                  : originalPriceValue ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                    : Math.round(((product.price - displayPrice) / product.price) * 100))
                                : hasDiscountFromOriginal && originalPriceValue
                                  ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                  : null;

                              const hasDiscount = (hasDiscountFromSale && displayPrice < (originalPriceValue || product.price)) || hasDiscountFromOriginal;

                              return hasDiscount && discountPercent && discountPercent > 0 ? (
                                <span className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-lg">
                                  -{discountPercent}%
                                </span>
                              ) : null;
                            })()}
                          </div>

                          {/* Bottom gradient shadow with buttons overlay */}
                          <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:pointer-events-auto pointer-events-none"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                              height: '35%',
                              paddingBottom: '16px'
                            }}
                          >
                            <div className="flex flex-col items-center gap-3 w-full px-4 h-full justify-end">
                              {/* Add to Cart Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  product.stockQuantity > 0 && handleAddToCart(product);
                                }}
                                disabled={product.stockQuantity === 0}
                                className={`w-full bg-[#DAA520] text-white py-2.5 px-4 rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${product.stockQuantity === 0
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-[#B8860B]'
                                  }`}
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-sm">
                                  {product.stockQuantity === 0
                                    ? (language === 'ar' ? 'نفد المخزون' : 'Out of Stock')
                                    : (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
                                  }
                                </span>
                              </button>

                              {/* Action Icons */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isInWishlist(product.id.toString())) {
                                      removeFromWishlist(product.id.toString());
                                    } else {
                                      addToWishlist({
                                        productId: product.id.toString(),
                                        name: product.name,
                                        nameAr: product.nameAr || product.name,
                                        price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
                                        image: getImageUrl(product.images || [], product.name),
                                        slug: product.slug,
                                      });
                                    }
                                  }}
                                  className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                                  title={language === 'ar' ? 'أضف للمفضلة' : 'Add to Favorites'}
                                >
                                  <Heart className={`w-4 h-4 ${isInWishlist(product.id.toString()) ? 'fill-current text-red-500' : 'text-white'}`} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(`/products/${product.slug}`, '_blank');
                                  }}
                                  className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                                  title={language === 'ar' ? 'عرض المنتج' : 'View Product'}
                                >
                                  <Eye className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Product Info */}
                        <div className="pb-2 sm:pb-3 md:pb-4 pt-2 sm:pt-3 px-2 sm:px-3 md:px-4 flex flex-col flex-1">
                          {/* Product Name */}
                          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 leading-tight">
                            {language === 'ar' ? (product.nameAr || product.name) : product.name}
                          </h3>

                          {/* Price */}
                          <div className="mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2 flex-wrap">
                            {(() => {
                              const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                              const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;
                              const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);
                              const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                              const discountPercent = hasDiscountFromSale
                                ? (product.discountPercent && product.discountPercent > 0
                                  ? product.discountPercent
                                  : originalPriceValue ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                    : Math.round(((product.price - displayPrice) / product.price) * 100))
                                : hasDiscountFromOriginal && originalPriceValue
                                  ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                  : null;

                              const hasDiscount = (hasDiscountFromSale && displayPrice < (originalPriceValue || product.price)) || hasDiscountFromOriginal;

                              return (
                                <>
                                  <span className="text-sm sm:text-base md:text-lg font-semibold text-[#DAA520]">
                                    {language === 'ar'
                                      ? `ج.م ${displayPrice.toLocaleString('en-US')}`
                                      : `EGP ${displayPrice.toLocaleString('en-US')}`
                                    }
                                  </span>
                                  {hasDiscount && originalPriceValue && originalPriceValue > displayPrice && (
                                    <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through">
                                      {language === 'ar'
                                        ? `ج.م ${originalPriceValue.toLocaleString('en-US')}`
                                        : `EGP ${originalPriceValue.toLocaleString('en-US')}`
                                      }
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            {(() => {
                              const rating = product.rating || 4.8;
                              const reviewCount = product.reviewCount || 42;
                              const fullStars = Math.floor(rating);
                              const hasHalfStar = rating % 1 >= 0.5;

                              return (
                                <>
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 ${star <= fullStars
                                          ? 'text-yellow-400 fill-current'
                                          : star === fullStars + 1 && hasHalfStar
                                            ? 'text-yellow-400 fill-current opacity-50'
                                            : 'text-gray-300'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] sm:text-xs md:text-sm text-gray-600">({reviewCount})</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        } else if (section.sectionType === 'featured') {
          const sectionId = 'featured';
          const isVisible = visibleSections.has(sectionId);
          return (
            <section
              key="featured"
              ref={(el) => {
                if (el) sectionRefs.current.set(sectionId, el);
              }}
              className={`py-8 sm:py-12 md:py-16 lg:py-20 bg-white transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              style={{
                visibility: isVisible ? 'visible' : 'hidden'
              }}
            >
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {section.settings.showTitle && (
                  <ScrollReveal direction="up" delay={0}>
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                        {language === 'ar' ? (section.settings.nameAr || 'المنتجات المميزة') : (section.settings.name || 'Featured Products')}
                      </h2>
                    </div>
                  </ScrollReveal>
                )}

                {/* Category Filters - Show only categories that have products in featured section */}
                {featuredCategories.length > 0 && (
                  <div className="flex justify-center mb-8 sm:mb-10 md:mb-12">
                    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                      {/* All Categories Button */}
                      <ScrollReveal key="All" direction="up" delay={0}>
                        <button
                          onClick={() => setSelectedCategory('All')}
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105 ${selectedCategory === 'All'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-purple-100 hover:text-purple-700 shadow-md'
                            }`}
                        >
                          {language === 'ar' ? 'الكل' : 'All'}
                        </button>
                      </ScrollReveal>

                      {/* Dynamic Categories - Only show categories that have products */}
                      {featuredCategories.map((category, index) => (
                        <ScrollReveal key={category.id} direction="up" delay={(index + 1) * 100}>
                          <button
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105 ${selectedCategory === category.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-white text-gray-700 hover:bg-purple-100 hover:text-purple-700 shadow-md'
                              }`}
                          >
                            {language === 'ar' ? category.nameAr : category.name}
                          </button>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                  {section.products.map((product, index) => (
                    <ScrollReveal
                      key={product.id}
                      direction="up"
                      delay={Math.min(index * 50, 1000)}
                      className="group bg-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 h-[240px] sm:h-[280px] md:h-[340px] lg:h-[400px] flex flex-col shadow-md hover:shadow-xl hover:-translate-y-1"
                    >
                      {/* Product Image */}
                      <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[280px] overflow-hidden bg-gray-100">
                        {/* Main Image */}
                        <img
                          src={getImageUrl(product.images || [], product.name)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getDefaultImage(product.name);
                          }}
                        />

                        {/* Second Image (on hover) - fade effect */}
                        {product.images && product.images.length > 1 && (() => {
                          const secondImage = typeof product.images[1] === 'string'
                            ? product.images[1]
                            : product.images[1]?.url || getImageUrl(product.images || [], product.name);
                          return (
                            <img
                              src={secondImage}
                              alt={`${product.name} - View 2`}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                              onError={(e) => {
                                // If second image fails, hide it
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          );
                        })()}

                        {/* Product Badges */}
                        <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                          {product.isNew && (
                            <span className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-md">
                              {language === 'ar' ? 'جديد' : 'New'}
                            </span>
                          )}
                          {product.isBestseller && (
                            <span className="bg-gradient-to-br from-amber-500 to-orange-500 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-md">
                              {language === 'ar' ? 'الأكثر مبيعاً' : 'Bestseller'}
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-md">
                              {language === 'ar' ? 'مميز' : 'Featured'}
                            </span>
                          )}
                          {(() => {
                            const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                            const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;
                            const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);
                            const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                            const discountPercent = hasDiscountFromSale
                              ? (product.discountPercent && product.discountPercent > 0
                                ? product.discountPercent
                                : originalPriceValue ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                  : Math.round(((product.price - displayPrice) / product.price) * 100))
                              : hasDiscountFromOriginal && originalPriceValue
                                ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                : null;

                            const hasDiscount = (hasDiscountFromSale && displayPrice < (originalPriceValue || product.price)) || hasDiscountFromOriginal;

                            return hasDiscount && discountPercent && discountPercent > 0 ? (
                              <span className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-lg">
                                -{discountPercent}%
                              </span>
                            ) : null;
                          })()}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 flex flex-col gap-1 sm:gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={() => window.open(`/products/${product.slug}`, '_blank')}
                            className="bg-white text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-[#DAA520] hover:text-white transition-all duration-300 shadow-lg"
                            title={language === 'ar' ? 'عرض المنتج' : 'View Product'}
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => product.stockQuantity > 0 && handleAddToCart(product)}
                            disabled={product.stockQuantity === 0}
                            className={`bg-white text-gray-900 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg ${product.stockQuantity === 0
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-[#DAA520] hover:text-white'
                              }`}
                            title={product.stockQuantity === 0
                              ? (language === 'ar' ? 'نفد المخزون' : 'Out of Stock')
                              : (language === 'ar' ? 'أضف للسلة' : 'Add to Cart')
                            }
                          >
                            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isInWishlist(product.id.toString())) {
                                removeFromWishlist(product.id.toString());
                              } else {
                                addToWishlist({
                                  productId: product.id.toString(),
                                  name: product.name,
                                  nameAr: product.nameAr || product.name,
                                  price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
                                  image: getImageUrl(product.images || [], product.name),
                                  slug: product.slug,
                                });
                              }
                            }}
                            className="bg-white text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                            title={language === 'ar' ? 'أضف للمفضلة' : 'Add to Favorites'}
                          >
                            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInWishlist(product.id.toString()) ? 'fill-current text-red-500' : 'text-gray-900'}`} />
                          </button>
                        </div>

                      </div>

                      {/* Product Info */}
                      <div className="pb-2 sm:pb-3 md:pb-4 pt-2 sm:pt-3 px-2 sm:px-3 md:px-4 flex flex-col flex-1">
                        {/* Category */}
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mb-0.5 sm:mb-1">
                          {language === 'ar' ? (product.category.nameAr || product.category.name) : product.category.name}
                        </p>

                        {/* Product Name */}
                        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 leading-tight">
                          {language === 'ar' ? (product.nameAr || product.name) : product.name}
                        </h3>

                        {/* Price */}
                        <div className="mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2 flex-wrap">
                          {(() => {
                            const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                            const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;
                            const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);
                            const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                            const discountPercent = hasDiscountFromSale
                              ? (product.discountPercent && product.discountPercent > 0
                                ? product.discountPercent
                                : originalPriceValue ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                  : Math.round(((product.price - displayPrice) / product.price) * 100))
                              : hasDiscountFromOriginal && originalPriceValue
                                ? Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)
                                : null;

                            const hasDiscount = (hasDiscountFromSale && displayPrice < (originalPriceValue || product.price)) || hasDiscountFromOriginal;

                            return (
                              <>
                                <span className="text-sm sm:text-base md:text-lg font-semibold text-[#DAA520]">
                                  {language === 'ar'
                                    ? `ج.م ${displayPrice.toLocaleString('en-US')}`
                                    : `EGP ${displayPrice.toLocaleString('en-US')}`
                                  }
                                </span>
                                {hasDiscount && originalPriceValue && originalPriceValue > displayPrice && (
                                  <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through">
                                    {language === 'ar'
                                      ? `ج.م ${originalPriceValue.toLocaleString('en-US')}`
                                      : `EGP ${originalPriceValue.toLocaleString('en-US')}`
                                    }
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {(() => {
                            const rating = product.rating || 4.8;
                            const reviewCount = product.reviewCount || 42;
                            const fullStars = Math.floor(rating);
                            const hasHalfStar = rating % 1 >= 0.5;

                            return (
                              <>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 ${star <= fullStars
                                        ? 'text-yellow-400 fill-current'
                                        : star === fullStars + 1 && hasHalfStar
                                          ? 'text-yellow-400 fill-current opacity-50'
                                          : 'text-gray-300'
                                        }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] sm:text-xs md:text-sm text-gray-600">({reviewCount})</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>
          );
        }
        return null;
      })}

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProductForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={() => setShowVariantModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'اختر الخيارات' : 'Select Options'}
                </h2>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Image */}
              {(() => {
                const imageUrl = Array.isArray(selectedProductForModal.images) && selectedProductForModal.images.length > 0
                  ? (typeof selectedProductForModal.images[0] === 'string' ? selectedProductForModal.images[0] : selectedProductForModal.images[0].url)
                  : getDefaultImage(selectedProductForModal.name);
                return (
                  <div className="mb-6">
                    <img
                      src={imageUrl}
                      alt={selectedProductForModal.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                );
              })()}

              {/* Product Name */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {language === 'ar' ? selectedProductForModal.nameAr || selectedProductForModal.name : selectedProductForModal.name}
              </h3>

              {/* Variant Selection */}
              <div className="space-y-6">
                {/* Sizes */}
                {(selectedProductForModal.variants || []).filter((v: any) => v.type === 'SIZE').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'ar' ? 'المقاس:' : 'Size:'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(selectedProductForModal.variants || []).filter((v: any) => v.type === 'SIZE').map((size: any) => {
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
                            key={size.value}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedSize(size.value);
                                // If color is selected but size doesn't have stock for that color, reset color
                                if (selectedColor && !hasStockForColor) {
                                  setSelectedColor('');
                                }
                                setQuantity(1);
                              }
                            }}
                            disabled={!isAvailable}
                            className={`px-6 py-3 border-2 rounded-lg text-sm font-medium transition-all relative ${!isAvailable
                              ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              : selectedSize === size.value
                                ? 'border-[#DAA520] bg-[#DAA520]/10 text-[#DAA520]'
                                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                              }`}
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
                {(selectedProductForModal.variants || []).filter((v: any) => v.type === 'COLOR').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'ar' ? 'اللون:' : 'Color:'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(selectedProductForModal.variants || []).filter((v: any) => v.type === 'COLOR').map((color: any) => {
                        const hasStock = selectedSize
                          ? hasStockForCombination(selectedSize, color.value)
                          : hasStockForCombination(undefined, color.value);
                        return (
                          <div key={color.value} className="flex flex-col items-center">
                            <button
                              onClick={() => {
                                if (hasStock) {
                                  setSelectedColor(color.value);
                                  setQuantity(1);
                                }
                              }}
                              disabled={!hasStock}
                              className={`relative w-14 h-14 rounded-full border-2 transition-all shadow-md hover:shadow-lg transform ${!hasStock
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:scale-110'
                                } ${selectedColor === color.value && hasStock
                                  ? 'border-[#DAA520] ring-4 ring-[#DAA520]/30 scale-110'
                                  : 'border-gray-300 hover:border-gray-400'
                                }`}
                              style={{
                                backgroundColor: getColorHex(color.value)
                              }}
                              title={language === 'ar' ? color.valueAr : color.value}
                            >
                              {!hasStock && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-10">✕</span>
                              )}
                              {selectedColor === color.value && hasStock && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-[#DAA520] rounded-full"></div>
                                  </div>
                                </div>
                              )}
                            </button>
                            <span className={`text-xs mt-1.5 font-medium ${selectedColor === color.value && hasStock ? 'text-[#DAA520]' : !hasStock ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                              {language === 'ar' ? color.valueAr : color.value}
                            </span>
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
                    {(selectedSize || selectedColor) && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({language === 'ar' ? 'المتاح:' : 'Available:'} {getAvailableStock()})
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#DAA520] hover:bg-[#DAA520]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">−</span>
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
                onClick={handleAddToCartFromModal}
                disabled={(() => {
                  const sizes = (selectedProductForModal.variants || []).filter((v: any) => v.type === 'SIZE');
                  const colors = (selectedProductForModal.variants || []).filter((v: any) => v.type === 'COLOR');
                  const needsSize = sizes.length > 0 && !selectedSize;
                  const needsColor = colors.length > 0 && !selectedColor;
                  const hasNoStock = getAvailableStock() === 0;
                  return needsSize || needsColor || hasNoStock;
                })()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 mt-6 ${(() => {
                  const sizes = (selectedProductForModal.variants || []).filter((v: any) => v.type === 'SIZE');
                  const colors = (selectedProductForModal.variants || []).filter((v: any) => v.type === 'COLOR');
                  const needsSize = sizes.length > 0 && !selectedSize;
                  const needsColor = colors.length > 0 && !selectedColor;
                  const hasNoStock = getAvailableStock() === 0;
                  return hasNoStock || needsSize || needsColor
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#DAA520] text-white hover:bg-[#B8860B] shadow-lg hover:shadow-xl transform hover:scale-105'
                })()
                  }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {language === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
