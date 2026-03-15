'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ProductCard } from '@/components/products/ProductCard';
import { ShoppingCart, Heart, Eye, Star, ChevronLeft, ChevronRight, Grid, List, Plus } from 'lucide-react';
import { getImageSrc } from '@/lib/image-utils';

interface Product {
  id: string | number;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  images: { url: string; alt?: string; altAr?: string }[];
  category: {
    id: string | number;
    name: string;
    nameAr?: string;
    slug?: string
  };
  stockQuantity: number;
  slug: string;
  sku?: string;
  variants?: any[];
  variantCombinations?: Array<{
    id: string;
    size?: string | null;
    color?: string | null;
    stock: number;
    sortOrder: number;
  }>;
  createdAt?: string;
  views?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
}

export default function ProductsPage() {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // All categories from API
  const [categories, setCategories] = useState<Category[]>([]); // Filtered categories with products
  const [isLoading, setIsLoading] = useState(true);

  // Calculate max price from products (use display price which is sale price if available)
  const maxPrice = products.length > 0
    ? Math.ceil(Math.max(...products.map(p => {
      const displayPrice = (p.salePrice && p.salePrice > 0) ? p.salePrice : p.price;
      return displayPrice;
    }), 500) / 50) * 50 // Round up to nearest 50
    : 500;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: maxPrice });
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: 0, max: maxPrice });
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showBestsellerOnly, setShowBestsellerOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [productsPerPage, setProductsPerPage] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  // Variant modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      // Fetch all products without limit to show all products
      const response = await fetch('/api/products?limit=1000', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both formats: {success: true, data: [...]} and {products: [...]}
        const productsArray = data.data && Array.isArray(data.data)
          ? data.data
          : data.products && Array.isArray(data.products)
            ? data.products
            : [];
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
          // Handle images - can be array of strings or array of objects
          let imageArray: Array<{ url: string; alt?: string; altAr?: string }> = [];

          if (product.images && Array.isArray(product.images)) {
            imageArray = product.images.map((img: any) => {
              // Handle Base64 format (data + contentType)
              if (typeof img === 'object' && img !== null && img.data && img.contentType) {
                return {
                  url: img.url || '', // Keep url if exists
                  data: img.data, // Preserve Base64 data
                  contentType: img.contentType, // Preserve content type
                  alt: img.alt || product.name,
                  altAr: img.altAr || product.nameAr || product.name,
                };
              }
              // If it's already an object with url property
              if (typeof img === 'object' && img !== null && img.url) {
                return {
                  url: img.url,
                  alt: img.alt || product.name,
                  altAr: img.altAr || product.nameAr || product.name,
                };
              }
              // If it's a string
              if (typeof img === 'string') {
                return {
                  url: img,
                  alt: product.name,
                  altAr: product.nameAr || product.name,
                };
              }
              return null;
            }).filter((img: any) => img !== null);
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

          return {
            ...product,
            id: productId,
            images: imageArray,
            variants: product.variants || [],
            variantCombinations: product.variantCombinations || [],
            category: normalizedCategory
          };
        }) || [];
        setProducts(transformedProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      // Silent error handling
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedCategories = data.categories || data.data?.categories || [];
        setAllCategories(fetchedCategories);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Filter categories to only show those with products (dynamically)
  useEffect(() => {
    if (products.length > 0 && allCategories.length > 0) {
      // Get unique category IDs from products
      const categoryIdsWithProducts = new Set(
        products
          .map(p => p.category?.id)
          .filter(id => id && id !== 'unknown')
      );

      // Filter categories to only include those with products
      const categoriesWithProducts = allCategories.filter(cat =>
        categoryIdsWithProducts.has(cat.id)
      );

      setCategories(categoriesWithProducts);
    } else if (allCategories.length > 0 && products.length === 0) {
      // If no products yet, show all categories
      setCategories(allCategories);
    }
  }, [products, allCategories]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Read category from URL parameter and set selected category
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      if (categoryParam) {
        // Try to match by ID (string or number)
        const matchingCategory = categories.find(c =>
          String(c.id) === String(categoryParam) || c.slug === categoryParam
        );
        if (matchingCategory) {
          setSelectedCategory(matchingCategory.id);
        }
      }
    }
  }, [categories]);

  // Update price range when products load
  useEffect(() => {
    if (products.length > 0) {
      const newMaxPrice = Math.ceil(Math.max(...products.map(p => {
        const displayPrice = (p.salePrice && p.salePrice > 0) ? p.salePrice : p.price;
        return displayPrice;
      }), 500) / 50) * 50;
      setPriceRange(prev => ({ ...prev, max: Math.max(prev.max, newMaxPrice) }));
      setAppliedPriceRange(prev => ({ ...prev, max: Math.max(prev.max, newMaxPrice) }));
    }
  }, [products]);

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory !== 'All' && product.category.id !== selectedCategory) {
      return false;
    }

    // Price range filter - use display price (sale price if available, otherwise regular price)
    const displayPrice = (product.salePrice && product.salePrice > 0) ? product.salePrice : product.price;
    if (appliedPriceRange.min && displayPrice < appliedPriceRange.min) {
      return false;
    }
    if (appliedPriceRange.max && displayPrice > appliedPriceRange.max) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const productName = (language === 'ar' ? (product.nameAr || product.name) : product.name);
      const productDesc = language === 'ar' ? (product.descriptionAr || '') : (product.description || '');
      if (!productName.toLowerCase().includes(searchLower) && !productDesc.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Stock filter
    if (inStockOnly && product.stockQuantity <= 0) {
      return false;
    }

    // New products filter
    if (showNewOnly && !product.isNew) {
      return false;
    }

    // Bestseller filter
    if (showBestsellerOnly && !product.isBestseller) {
      return false;
    }

    // Featured filter
    if (showFeaturedOnly && !product.isFeatured) {
      return false;
    }

    // On sale filter
    if (showOnSaleOnly && (!product.salePrice || product.salePrice <= 0)) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const getDisplayPrice = (product: Product) => {
      return (product.salePrice && product.salePrice > 0) ? product.salePrice : product.price;
    };

    switch (sortBy) {
      case 'price-low':
        return getDisplayPrice(a) - getDisplayPrice(b);
      case 'price-high':
        return getDisplayPrice(b) - getDisplayPrice(a);
      case 'name':
        const nameA = language === 'ar' ? (a.nameAr || a.name) : a.name;
        const nameB = language === 'ar' ? (b.nameAr || b.name) : b.name;
        return nameA.localeCompare(nameB);
      case 'newest':
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      case 'rating':
        return (b.views || 0) - (a.views || 0);
      default:
        return 0;
    }
  });

  // Pagination - Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, appliedPriceRange, searchTerm, inStockOnly, showNewOnly, showBestsellerOnly, showFeaturedOnly, showOnSaleOnly, sortBy, productsPerPage]);

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

  const handleOpenVariantModal = (product: Product) => {
    setSelectedProductForModal(product);
    setShowVariantModal(true);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
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
      const sizeVariant = (selectedProductForModal?.variants || []).find((v: any) => v.type === 'SIZE' && v.value === size);
      const colorVariant = (selectedProductForModal?.variants || []).find((v: any) => v.type === 'COLOR' && v.value === color);

      // Check if both variants have stock defined
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    } else if (size) {
      const sizeVariant = (selectedProductForModal?.variants || []).find((v: any) => v.type === 'SIZE' && v.value === size);
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
    } else if (color) {
      const colorVariant = (selectedProductForModal?.variants || []).find((v: any) => v.type === 'COLOR' && v.value === color);
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    }

    return selectedProductForModal.stockQuantity > 0;
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
      const selectedVariant = (selectedProductForModal?.variants || []).find((v: any) =>
        (selectedSize && v.type === 'SIZE' && v.value === selectedSize) ||
        (selectedColor && v.type === 'COLOR' && v.value === selectedColor)
      );

      if (selectedVariant && selectedVariant.stock !== undefined) {
        availableStock = selectedVariant.stock;
      }
    }

    return availableStock;
  };

  const handleAddToCartFromModal = () => {
    if (!selectedProductForModal) return;

    const sizes = (selectedProductForModal?.variants || []).filter((v: any) => v.type === 'SIZE');
    const colors = (selectedProductForModal?.variants || []).filter((v: any) => v.type === 'COLOR');

    // Validate selection
    if ((sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor)) {
      return;
    }

    // Validate stock before adding to cart
    if (!hasStockForCombination(selectedSize || undefined, selectedColor || undefined)) {
      return;
    }

    const displayPrice = (selectedProductForModal.salePrice && selectedProductForModal.salePrice > 0)
      ? selectedProductForModal.salePrice
      : selectedProductForModal.price;

    const firstImage = selectedProductForModal.images[0];
    const imageUrl = getImageSrc(firstImage as any, 'https://placehold.co/600x400/eeeeee/999999?text=No+Image');

    addToCart({
      name: language === 'ar' ? (selectedProductForModal.nameAr || selectedProductForModal.name) : selectedProductForModal.name,
      nameAr: selectedProductForModal.nameAr || selectedProductForModal.name,
      productId: selectedProductForModal.id.toString(),
      price: displayPrice,
      image: imageUrl,
      quantity: quantity,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
    });

    setShowVariantModal(false);
    setSelectedProductForModal(null);
  };

  return (
    <div className="min-h-screen bg-primary">
      <style jsx>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .product-card-animate {
          animation: slideUpFade 0.5s ease-out forwards;
          animation-fill-mode: both;
        }
        
        .product-card-animate:nth-child(1) { animation-delay: 0.05s; }
        .product-card-animate:nth-child(2) { animation-delay: 0.1s; }
        .product-card-animate:nth-child(3) { animation-delay: 0.15s; }
        .product-card-animate:nth-child(4) { animation-delay: 0.2s; }
        .product-card-animate:nth-child(5) { animation-delay: 0.25s; }
        .product-card-animate:nth-child(6) { animation-delay: 0.3s; }
        .product-card-animate:nth-child(7) { animation-delay: 0.35s; }
        .product-card-animate:nth-child(8) { animation-delay: 0.4s; }
        .product-card-animate:nth-child(9) { animation-delay: 0.45s; }
        .product-card-animate:nth-child(10) { animation-delay: 0.5s; }
        .product-card-animate:nth-child(11) { animation-delay: 0.55s; }
        .product-card-animate:nth-child(12) { animation-delay: 0.6s; }
        .product-card-animate:nth-child(n+13) { animation-delay: 0.65s; }
      `}</style>

      {/* Breadcrumb */}
      <div className="bg-card border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-gray-900 hover:text-gray-700" suppressHydrationWarning>
              <span suppressHydrationWarning>{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium" suppressHydrationWarning>
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </span>
          </nav>
        </div>
      </div>

      {/* Page Title */}
      <div className="bg-card border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif" }} suppressHydrationWarning>
            {language === 'ar' ? 'المنتجات' : 'Products'}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              {/* Categories */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif" }} suppressHydrationWarning>
                  {language === 'ar' ? 'الفئات' : 'Categories'}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedCategory === 'All'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                    suppressHydrationWarning
                  >
                    <span suppressHydrationWarning>{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                      suppressHydrationWarning
                    >
                      <span suppressHydrationWarning>{language === 'ar' ? category.nameAr : category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-[#DAA520] rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif" }} suppressHydrationWarning>
                    <span suppressHydrationWarning>{language === 'ar' ? 'فلاتر سريعة' : 'Quick Filters'}</span>
                  </h3>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="filter-new"
                      name="filterNew"
                      checked={showNewOnly}
                      onChange={(e) => setShowNewOnly(e.target.checked)}
                      className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#DAA520] transition-colors" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }} suppressHydrationWarning>
                      {language === 'ar' ? '🆕 منتجات جديدة' : '🆕 New Arrivals'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="filter-bestseller"
                      name="filterBestseller"
                      checked={showBestsellerOnly}
                      onChange={(e) => setShowBestsellerOnly(e.target.checked)}
                      className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#DAA520] transition-colors" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }} suppressHydrationWarning>
                      {language === 'ar' ? '⭐ الأكثر مبيعاً' : '⭐ Bestsellers'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="filter-featured"
                      name="filterFeatured"
                      checked={showFeaturedOnly}
                      onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                      className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#DAA520] transition-colors" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }} suppressHydrationWarning>
                      {language === 'ar' ? '✨ مميز' : '✨ Featured'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="filter-sale"
                      name="filterSale"
                      checked={showOnSaleOnly}
                      onChange={(e) => setShowOnSaleOnly(e.target.checked)}
                      className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#DAA520] transition-colors" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }} suppressHydrationWarning>
                      {language === 'ar' ? '🏷️ في الخصم' : '🏷️ On Sale'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="filter-stock"
                      name="filterStock"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#DAA520] transition-colors" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }} suppressHydrationWarning>
                      {language === 'ar' ? '✅ متوفر في المخزون' : '✅ In Stock Only'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-[#DAA520] rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif" }} suppressHydrationWarning>
                    <span suppressHydrationWarning>{language === 'ar' ? 'نطاق السعر' : 'Price Range'}</span>
                  </h3>
                </div>

                {/* Price Labels */}
                <div className="flex justify-between text-sm text-gray-600 mb-2" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '13px' }}>
                  <span suppressHydrationWarning>{language === 'ar' ? 'ج.م' : '$'}{priceRange.min}</span>
                  <span suppressHydrationWarning>{language === 'ar' ? 'ج.م' : '$'}{priceRange.max}</span>
                </div>

                {/* Range Slider */}
                <div className="mb-4">
                  <div className="relative h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="absolute h-1.5 bg-[#DAA520] rounded-full"
                      style={{
                        left: `${(priceRange.min / maxPrice) * 100}%`,
                        width: `${((priceRange.max - priceRange.min) / maxPrice) * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      id="price-range-min"
                      name="price-range-min"
                      min="0"
                      max={maxPrice}
                      value={priceRange.min}
                      onChange={(e) => {
                        const newMin = Math.min(Number(e.target.value), priceRange.max - 1);
                        setPriceRange(prev => ({ ...prev, min: newMin }));
                      }}
                      className="absolute w-full h-1.5 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#DAA520] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#DAA520] [&::-moz-range-thumb]:cursor-pointer"
                      style={{ zIndex: priceRange.min > priceRange.max - (maxPrice * 0.04) ? 5 : 3 }}
                    />
                    <input
                      type="range"
                      id="price-range-max"
                      name="price-range-max"
                      min="0"
                      max={maxPrice}
                      value={priceRange.max}
                      onChange={(e) => {
                        const newMax = Math.max(Number(e.target.value), priceRange.min + 1);
                        setPriceRange(prev => ({ ...prev, max: newMax }));
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#10B981] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#10B981] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      style={{ zIndex: priceRange.max <= priceRange.min + (maxPrice * 0.04) ? 5 : 4 }}
                    />
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium" suppressHydrationWarning>
                      {language === 'ar' ? 'ج.م' : '$'}
                    </span>
                    <input
                      type="number"
                      id="price-min"
                      name="price-min"
                      min="0"
                      max={maxPrice}
                      value={priceRange.min}
                      onChange={(e) => {
                        const val = Math.min(Math.max(0, Number(e.target.value) || 0), maxPrice);
                        setPriceRange(prev => ({ ...prev, min: Math.min(val, prev.max - 1) }));
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#DAA520] focus:border-[#DAA520] text-sm transition-all"
                      style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium" suppressHydrationWarning>
                      {language === 'ar' ? 'ج.م' : '$'}
                    </span>
                    <input
                      type="number"
                      id="price-max"
                      name="price-max"
                      min="0"
                      max={maxPrice}
                      value={priceRange.max}
                      onChange={(e) => {
                        const val = Math.min(Math.max(0, Number(e.target.value) || 0), maxPrice);
                        setPriceRange(prev => ({ ...prev, max: Math.max(val, prev.min + 1) }));
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#DAA520] focus:border-[#DAA520] text-sm transition-all"
                      style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Apply Filter Button */}
                <button
                  onClick={() => setAppliedPriceRange({ ...priceRange })}
                  className="w-full bg-[#DAA520] text-white py-2.5 px-4 rounded-lg hover:bg-[#B8860B] transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md"
                  style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                  suppressHydrationWarning
                >
                  <span suppressHydrationWarning>{language === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Controls */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    id="products-search"
                    name="productsSearch"
                    type="search"
                    autoComplete="off"
                    placeholder={language === 'ar' ? 'البحث في المنتجات...' : 'Search Products...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                    style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                    suppressHydrationWarning
                  />
                </div>

                {/* Sort and View Controls */}
                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <select
                    id="sort-by"
                    name="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '14px' }}
                    suppressHydrationWarning
                  >
                    <option value="featured" suppressHydrationWarning>{language === 'ar' ? 'مميز' : 'Featured'}</option>
                    <option value="price-low" suppressHydrationWarning>{language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                    <option value="price-high" suppressHydrationWarning>{language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                    <option value="name" suppressHydrationWarning>{language === 'ar' ? 'الاسم' : 'Name'}</option>
                    <option value="newest" suppressHydrationWarning>{language === 'ar' ? 'الأحدث' : 'Newest Arrivals'}</option>
                    <option value="rating" suppressHydrationWarning>{language === 'ar' ? 'تقييم العملاء' : 'Customer Rating'}</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Products per page */}
                  <select
                    value={productsPerPage}
                    onChange={(e) => {
                      setProductsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    suppressHydrationWarning
                  >
                    <option value={12} suppressHydrationWarning>12 {language === 'ar' ? 'لكل صفحة' : 'per page'}</option>
                    <option value={24} suppressHydrationWarning>24 {language === 'ar' ? 'لكل صفحة' : 'per page'}</option>
                    <option value={48} suppressHydrationWarning>48 {language === 'ar' ? 'لكل صفحة' : 'per page'}</option>
                    <option value={96} suppressHydrationWarning>96 {language === 'ar' ? 'لكل صفحة' : 'per page'}</option>
                    {sortedProducts.length > 0 && sortedProducts.length > 96 && (
                      <option value={sortedProducts.length} suppressHydrationWarning>{language === 'ar' ? 'الكل' : 'All'} ({sortedProducts.length})</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Active Filters & Results Count */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm" style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif" }}>
                  <span className="text-gray-600 font-medium" style={{ fontSize: '14px' }} suppressHydrationWarning>
                    {language === 'ar' ? 'النتائج:' : 'Results:'}
                  </span>
                  <span className="text-[#9333EA] font-semibold" style={{ fontSize: '14px' }}>
                    {sortedProducts.length} <span suppressHydrationWarning>{language === 'ar' ? 'منتج' : 'products'}</span>
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                      <span suppressHydrationWarning>{categories.find(c => c.id === selectedCategory)?.[language === 'ar' ? 'nameAr' : 'name'] || selectedCategory}</span>
                      <button
                        onClick={() => setSelectedCategory('All')}
                        className="ml-0.5 hover:bg-blue-700 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {(appliedPriceRange.min > 0 || appliedPriceRange.max < maxPrice) && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#10B981] to-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200" style={{ fontSize: '12px' }}>
                      <span suppressHydrationWarning>{language === 'ar' ? 'ج.م' : '$'}{appliedPriceRange.min} - {language === 'ar' ? 'ج.م' : '$'}{appliedPriceRange.max}</span>
                      <button
                        onClick={() => {
                          setPriceRange({ min: 0, max: maxPrice });
                          setAppliedPriceRange({ min: 0, max: maxPrice });
                        }}
                        className="ml-0.5 hover:bg-emerald-700 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {showNewOnly && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                      <span suppressHydrationWarning>🆕 {language === 'ar' ? 'جديد' : 'New'}</span>
                      <button
                        onClick={() => setShowNewOnly(false)}
                        className="ml-0.5 hover:bg-blue-600 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {showBestsellerOnly && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200" style={{ fontSize: '12px' }}>
                      <span suppressHydrationWarning>⭐ {language === 'ar' ? 'الأكثر مبيعاً' : 'Bestseller'}</span>
                      <button
                        onClick={() => setShowBestsellerOnly(false)}
                        className="ml-0.5 hover:bg-amber-600 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {showFeaturedOnly && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200" style={{ fontSize: '12px' }}>
                      <span suppressHydrationWarning>✨ {language === 'ar' ? 'مميز' : 'Featured'}</span>
                      <button
                        onClick={() => setShowFeaturedOnly(false)}
                        className="ml-0.5 hover:bg-purple-600 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {showOnSaleOnly && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200" style={{ fontSize: '12px' }}>
                      <span suppressHydrationWarning>🏷️ {language === 'ar' ? 'خصم' : 'On Sale'}</span>
                      <button
                        onClick={() => setShowOnSaleOnly(false)}
                        className="ml-0.5 hover:bg-red-600 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200" style={{ fontSize: '12px' }}>
                      <span suppressHydrationWarning>✅ {language === 'ar' ? 'متوفر' : 'In Stock'}</span>
                      <button
                        onClick={() => setInStockOnly(false)}
                        className="ml-0.5 hover:bg-green-600 rounded-full p-0.5 transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إزالة الفلتر' : 'Remove filter'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {(selectedCategory !== 'All' || appliedPriceRange.min > 0 || appliedPriceRange.max < maxPrice || showNewOnly || showBestsellerOnly || showFeaturedOnly || showOnSaleOnly || inStockOnly || searchTerm) && (
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchTerm('');
                        setPriceRange({ min: 0, max: maxPrice });
                        setAppliedPriceRange({ min: 0, max: maxPrice });
                        setShowNewOnly(false);
                        setShowBestsellerOnly(false);
                        setShowFeaturedOnly(false);
                        setShowOnSaleOnly(false);
                        setInStockOnly(false);
                      }}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ fontFamily: "'Open Sans', 'Noto Sans Arabic', sans-serif", fontSize: '12px' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span suppressHydrationWarning>{language === 'ar' ? 'مسح الكل' : 'Clear All'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#DAA520]/20 border-t-[#DAA520] mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-[#DAA520] rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-[#DAA520]" suppressHydrationWarning>
                    {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading Products...'}
                  </p>
                </div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-24 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200">
                <div className="text-8xl mb-6 animate-bounce">🛍️</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4" suppressHydrationWarning>
                  {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto" suppressHydrationWarning>
                  {language === 'ar'
                    ? 'لا توجد منتجات تطابق معايير البحث الخاصة بك'
                    : 'No products match your search criteria'
                  }
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchTerm('');
                    setPriceRange({ min: 0, max: maxPrice });
                    setAppliedPriceRange({ min: 0, max: maxPrice });
                  }}
                  className="bg-gradient-to-r from-[#DAA520] to-[#B8860B] hover:from-[#B8860B] hover:to-[#DAA520] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  suppressHydrationWarning
                >
                  <span suppressHydrationWarning>{language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}</span>
                </button>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
                }`}>
                {paginatedProducts.map((product, index) => (
                  <div key={product.id} className="product-card-animate">
                    <ProductCard
                      product={product}
                      viewMode={viewMode}
                      onOpenVariantModal={handleOpenVariantModal}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Smart pagination - show current page and nearby pages */}
                  {(() => {
                    const pages: (number | string)[] = [];
                    const maxVisible = 7;

                    if (totalPages <= maxVisible) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first page
                      pages.push(1);

                      if (currentPage > 3) {
                        pages.push('...');
                      }

                      // Show pages around current
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);

                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      if (currentPage < totalPages - 2) {
                        pages.push('...');
                      }

                      // Show last page
                      pages.push(totalPages);
                    }

                    return pages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === page
                            ? 'bg-[#9333EA] text-white shadow-md scale-105'
                            : 'text-gray-500 hover:text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-[#9333EA]'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-600">
                  {language === 'ar'
                    ? `صفحة ${currentPage} من ${totalPages}`
                    : `Page ${currentPage} of ${totalPages}`
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  <span className="text-xl">×</span>
                </button>
              </div>

              {/* Product Image */}
              {selectedProductForModal.images.length > 0 && (() => {
                const firstImage = selectedProductForModal.images[0];
                const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || 'https://placehold.co/600x400/eeeeee/999999?text=No+Image');
                return (
                  <div className="mb-6">
                    <img
                      src={imageUrl}
                      alt={language === 'ar' ? selectedProductForModal.nameAr : selectedProductForModal.name}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/eeeeee/999999?text=No+Image';
                      }}
                    />
                  </div>
                );
              })()}

              {/* Product Name */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {language === 'ar' ? selectedProductForModal.nameAr : selectedProductForModal.name}
              </h3>

              {/* Variant Selection */}
              <div className="space-y-6">
                {/* Sizes */}
                {(selectedProductForModal?.variants || []).filter((v: any) => v.type === 'SIZE').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'ar' ? 'المقاس:' : 'Size:'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(selectedProductForModal?.variants || []).filter((v: any) => v.type === 'SIZE').map((size: any) => {
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
                {(selectedProductForModal?.variants || []).filter((v: any) => v.type === 'COLOR').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'ar' ? 'اللون:' : 'Color:'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(selectedProductForModal?.variants || []).filter((v: any) => v.type === 'COLOR').map((color: any) => {
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
                  const sizes = (selectedProductForModal?.variants || []).filter((v: any) => v.type === 'SIZE');
                  const colors = (selectedProductForModal?.variants || []).filter((v: any) => v.type === 'COLOR');
                  const needsSelection = (sizes.length > 0 && !selectedSize) ||
                    (colors.length > 0 && !selectedColor) ||
                    (sizes.length > 0 && colors.length > 0 && (!selectedSize || !selectedColor));
                  const availableStock = getAvailableStock();
                  // Only disable if stock is 0 AND variant is selected (or product has no variants)
                  const hasVariantsSelected = Boolean(selectedSize || selectedColor);
                  const hasNoVariants = sizes.length === 0 && colors.length === 0;
                  const isOutOfStock = availableStock === 0 && (hasVariantsSelected || hasNoVariants);
                  return needsSelection || isOutOfStock;
                })()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 mt-6 ${(() => {
                  const sizes = (selectedProductForModal?.variants || []).filter((v: any) => v.type === 'SIZE');
                  const colors = (selectedProductForModal?.variants || []).filter((v: any) => v.type === 'COLOR');
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
    </div>
  );
}
