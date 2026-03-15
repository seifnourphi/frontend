'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useRouter } from 'next/navigation';
import { getFirstImageSrc } from '@/lib/image-utils';

interface Product {
  id: string | number;
  name: string;
  nameAr?: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  originalPrice?: number;
  description?: string;
  images: any[];
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  stockQuantity: number;
  category: {
    id: string | number;
    name: string;
    nameAr?: string;
    slug?: string;
  };
  rating?: number;
  reviewCount?: number;
  sku?: string;
  variants?: any[];
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onOpenVariantModal?: (product: Product) => void;
}

export function ProductCard({ product, viewMode = 'grid', onOpenVariantModal }: ProductCardProps) {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();

  // Mobile Safe Touch Logic
  const [isMobileActive, setIsMobileActive] = useState(false);

  const handleCardTouch = (e: React.MouseEvent) => {
    // Check if it's likely a touch event (mobile)
    const isTouch = window.matchMedia('(max-width: 768px)').matches;

    if (isTouch && !isMobileActive) {
      e.preventDefault();
      e.stopPropagation();
      setIsMobileActive(true);
      return;
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    const isTouch = window.matchMedia('(max-width: 768px)').matches;
    if (isTouch && !isMobileActive) {
      handleCardTouch(e);
      return;
    }

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
      const imageUrl = getFirstImageSrc(product.images, '');
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

  const handleAddToCart = (e: React.MouseEvent) => {
    const isTouch = window.matchMedia('(max-width: 768px)').matches;
    if (isTouch && !isMobileActive) {
      handleCardTouch(e);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // If product has variants, navigate to product page to select them
    if (product.variants && product.variants.length > 0) {
      router.push(`/products/${product.slug}`);
      return;
    }

    if (product.stockQuantity > 0) {
      const imageUrl = getFirstImageSrc(product.images, '');
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
          language === 'ar' ? 'تم إضافة المنتج للسلة!' : 'Added to cart!',
          'success'
        );
      } else if (result.message) {
        showToast(result.message, 'error');
      }
    } else {
      showToast(
        language === 'ar' ? 'المنتج غير متوفر' : 'Product out of stock',
        'error'
      );
    }
  };

  const handleViewProduct = (e: React.MouseEvent) => {
    const isTouch = window.matchMedia('(max-width: 768px)').matches;
    if (isTouch && !isMobileActive) {
      handleCardTouch(e);
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.slug}`);
  };

  // Determine original price and display price
  const originalPriceValue = product.originalPrice || (product.salePrice && product.salePrice > 0 ? product.price : undefined);
  const displayPrice = (product.salePrice && product.salePrice > 0) ? product.salePrice : product.price;
  const hasDiscount = (product.salePrice && product.salePrice > 0) || (product.originalPrice && product.originalPrice > product.price);

  const getDefaultImage = (name: string) => {
    return 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop';
  };

  const imageUrl = getFirstImageSrc(product.images, getDefaultImage(product.name));

  return (
    <div
      className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100 ${isMobileActive ? 'ring-2 ring-[#DAA520]' : ''
        }`}
      onClick={handleViewProduct}
      onMouseLeave={() => setIsMobileActive(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
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
          {hasDiscount && (
            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap text-center inline-flex items-center justify-center shadow-lg">
              {product.discountPercent
                ? `-${product.discountPercent}%`
                : (originalPriceValue ? `-${Math.round(((originalPriceValue - displayPrice) / originalPriceValue) * 100)}%` : '')
              }
            </span>
          )}
        </div>

        {/* Action Icons - Right side of Image */}
        <div className={`absolute top-2 right-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 z-20 origin-top-right ${isMobileActive ? 'scale-100 opacity-100' : 'scale-0 group-hover:scale-100'
          }`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewProduct(e);
            }}
            className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#DAA520] hover:text-white transition-all duration-300 shadow-md"
            title={language === 'ar' ? 'عرض المنتج' : 'View Product'}
          >
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlistClick(e);
            }}
            className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 shadow-md"
            title={language === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${isInWishlist(product.id.toString())
                ? 'fill-red-500 text-red-500'
                : 'text-gray-900'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3
          className="text-base font-medium text-gray-900 mb-2 line-clamp-2 hover:text-[#DAA520] transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProduct(e);
          }}
        >
          {language === 'ar' ? product.nameAr : product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">(4.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-semibold text-[#DAA520]">
            {language === 'ar'
              ? `ج.م ${displayPrice.toLocaleString('en-US')}`
              : `EGP ${displayPrice.toLocaleString('en-US')}`
            }
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {language === 'ar'
                ? `ج.م ${product.price.toLocaleString('en-US')}`
                : `EGP ${product.price.toLocaleString('en-US')}`
              }
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            handleAddToCart(e);
          }}
          type="button"
          disabled={product.stockQuantity === 0}
          className={`w-full py-1.5 md:py-2 flex items-center justify-center gap-1.5 transition-all text-xs md:text-sm font-medium ${product.stockQuantity === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#DAA520] text-white hover:bg-[#B8860B]'
            }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>
            {product.stockQuantity === 0
              ? (language === 'ar' ? 'نفد المخزون' : 'Out of Stock')
              : (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
            }
          </span>
        </button>
      </div>
    </div>
  );
}