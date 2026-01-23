'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Heart, Eye, Star, ChevronRight, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useRouter } from 'next/navigation';
import { getFirstImageSrc } from '@/lib/image-utils';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  originalPrice?: number;
  description: string;
  images: string[];
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  stockQuantity: number;
  category: {
    id: number;
    name: string;
    nameAr?: string;
  };
  variants?: {
    type: 'SIZE' | 'COLOR';
    value: string;
    valueAr?: string;
  }[];
  nameAr?: string;
  rating?: number;
  reviewCount?: number;
}

interface AnimatedProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}

export function AnimatedProductGrid({
  products,
  title = "Featured Products",
  subtitle = "Discover our carefully selected products",
  showFilters = true
}: AnimatedProductGridProps) {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();
  const [visibleProducts, setVisibleProducts] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  // Filter products
  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'All') return true;
    return product.category.name.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // Intersection Observer for staggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleProducts(prev => new Set([...Array.from(prev), index]));
            }, index * 200); // 200ms delay between each card
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const productCards = gridRef.current?.querySelectorAll('.product-card');
    productCards?.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [filteredProducts]);

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

  const handleWishlistClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const idStr = product.id.toString();

    if (isInWishlist(idStr)) {
      removeFromWishlist(idStr);
      showToast(
        language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist',
        'info'
      );
    } else {
      const imageUrl = getFirstImageSrc(product.images as any, '');
      addToWishlist({
        productId: idStr,
        name: product.name,
        nameAr: product.nameAr || product.name,
        price: product.price,
        image: imageUrl,
        slug: product.slug
      });
      showToast(
        language === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to wishlist',
        'success'
      );
    }
  };

  const getDefaultImage = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('shirt') || name.includes('t-shirt')) {
      return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('jeans')) {
      return 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('dress')) {
      return 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('suit')) {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('jacket')) {
      return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
  };

  const categories = ['All', 'Clothing', 'Accessories', 'Electronics'];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {language === 'ar' ? title : title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'ar' ? subtitle : subtitle}
          </p>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="flex justify-center mb-12">
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`product-card group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-700 ease-out ${visibleProducts.has(index)
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform translate-y-8'
                }`}
              style={{
                transitionDelay: `${index * 100}ms`
              }}
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.images[0] || getDefaultImage(product.name)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Second Image (on hover) - fade effect */}
                {product.images && product.images.length > 1 && (() => {
                  const secondImageObj = product.images[1] as any;
                  const secondImage = typeof secondImageObj === 'string'
                    ? secondImageObj
                    : (secondImageObj?.url || product.images[0] || getDefaultImage(product.name));
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

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                {/* Product Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center">
                      {language === 'ar' ? 'جديد' : 'New'}
                    </span>
                  )}
                  {product.isBestseller && (
                    <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center">
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
                      <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-lg">
                        -{discountPercent}%
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={() => {
                      // Check if product has variants
                      const sizes = (product.variants || []).filter((v: any) => v.type === 'SIZE');
                      const colors = (product.variants || []).filter((v: any) => v.type === 'COLOR');

                      // If product has variants, navigate to product page to select them
                      if (sizes.length > 0 || colors.length > 0) {
                        router.push(`/products/${product.slug}`);
                        return;
                      }

                      if (product.stockQuantity > 0) {
                        const imageUrl = getFirstImageSrc(product.images as any, '');
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
                    }}
                    disabled={product.stockQuantity === 0}
                    className={`bg-white text-gray-900 p-1.5 md:p-2 rounded-full transition-all duration-300 shadow-lg ${product.stockQuantity === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#DAA520] hover:text-white'
                      }`}
                    title={product.stockQuantity === 0
                      ? (language === 'ar' ? 'نفد المخزون' : 'Out of Stock')
                      : (language === 'ar' ? 'أضف للسلة' : 'Add to Cart')
                    }
                  >
                    <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={(e) => handleWishlistClick(e, product)}
                    className="bg-white text-gray-900 p-1.5 md:p-2 rounded-full hover:bg-gray-50 transition-all duration-300 shadow-lg"
                    title={language === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${isInWishlist(product.id.toString())
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-900'
                        }`}
                    />
                  </button>
                  <button
                    onClick={() => router.push(`/products/${product.slug}`)}
                    className="bg-white text-gray-900 p-1.5 md:p-2 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-lg"
                    title={language === 'ar' ? 'عرض المنتج' : 'View Product'}
                  >
                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="pb-6 pt-8 flex flex-col">
                <div className="mb-2">
                  <span className="text-sm text-gray-500">
                    {language === 'ar' ? ((product.category as any).nameAr || product.category.name) : product.category.name}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {language === 'ar' ? ((product as any).nameAr || product.name) : product.name}
                </h3>

                {/* Price and Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      // Check if product has discount
                      const hasDiscountFromSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0;
                      const hasDiscountFromOriginal = product.originalPrice && product.originalPrice > product.price;

                      // Determine original price (for display with line-through)
                      const originalPriceValue = product.originalPrice || (hasDiscountFromSale ? product.price : undefined);

                      // Determine display price (what customer pays)
                      const displayPrice = hasDiscountFromSale ? product.salePrice! : product.price;

                      // Calculate discount percent
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
                        <div className="flex flex-col items-start gap-0.5">
                          {hasDiscount && originalPriceValue && originalPriceValue > displayPrice && (
                            <span className="text-sm text-gray-500 line-through font-medium">
                              {language === 'ar'
                                ? `ج.م ${originalPriceValue.toLocaleString('en-US')}`
                                : `EGP ${originalPriceValue.toLocaleString('en-US')}`
                              }
                            </span>
                          )}
                          <span className="text-lg font-bold text-[#DAA520]">
                            {language === 'ar'
                              ? `ج.م ${displayPrice.toLocaleString('en-US')}`
                              : `EGP ${displayPrice.toLocaleString('en-US')}`
                            }
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <span className="text-base text-gray-600">({product.reviewCount || 0})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
