'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Eye,
  Star,
  Package,
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

interface WishlistItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  salePrice?: number;
  image: string;
  slug: string;
  category: {
    name: string;
    nameAr: string;
  };
  stockQuantity: number;
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

export default function WishlistPage() {
  const { language } = useLanguage();
  const { items: wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Variant modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<WishlistItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);

  const formatPrice = (price: number) => {
    return language === 'ar'
      ? `ج.م ${price.toLocaleString('en-US')}`
      : `EGP ${price.toLocaleString('en-US')}`;
  };

  // Fetch full product data with variants
  const fetchProductWithVariants = async (slug: string): Promise<WishlistItem | null> => {
    try {
      const response = await fetch(`/api/products/${slug}`);
      if (response.ok) {
        const data = await response.json();
        const product = data.product || data;
        return {
          id: product._id || product.id || '',
          name: product.name || '',
          nameAr: product.nameAr || product.name || '',
          price: product.price || 0,
          salePrice: product.salePrice || undefined,
          image: Array.isArray(product.images) && product.images.length > 0
            ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url || '')
            : '',
          slug: product.slug || '',
          category: product.category
            ? (typeof product.category === 'object'
              ? { name: product.category.name || '', nameAr: product.category.nameAr || product.category.name || '' }
              : { name: '', nameAr: '' })
            : { name: '', nameAr: '' },
          stockQuantity: product.stockQuantity || 0,
          variants: product.variants || [],
          variantCombinations: product.variantCombinations || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const handleAddToCart = async (item: any) => {
    try {
      // Check if product has variants - first check if variants exist in item
      let productWithVariants = item;

      // If item doesn't have variants data, fetch it
      if (!item.variants || item.variants.length === 0) {
        setIsFetchingProduct(true);
        const fullProduct = await fetchProductWithVariants(item.slug);
        if (fullProduct) {
          productWithVariants = fullProduct;
        }
        setIsFetchingProduct(false);
      }

      const sizes = (productWithVariants.variants || []).filter((v: any) => v.type === 'SIZE');
      const colors = (productWithVariants.variants || []).filter((v: any) => v.type === 'COLOR');

      // If product has variants, show modal to select them
      if (sizes.length > 0 || colors.length > 0) {
        setSelectedProductForModal(productWithVariants);
        setShowVariantModal(true);
        setSelectedSize('');
        setSelectedColor('');
        setQuantity(1);
        return;
      }

      // No variants, add directly to cart
      addToCart({
        productId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        price: item.price,
        salePrice: item.salePrice,
        image: item.image,
        quantity: 1
      });

      showToast(
        language === 'ar' ? 'تم إضافة المنتج للسلة!' : 'Product added to cart!',
        'success',
        3000
      );
    } catch (error) {
      // Error adding to cart - no sensitive data logged
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء إضافة المنتج' : 'Error adding product to cart',
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
      const sizeVariant = selectedProductForModal.variants?.find((v: any) => v.type === 'SIZE' && v.value === size);
      const colorVariant = selectedProductForModal.variants?.find((v: any) => v.type === 'COLOR' && v.value === color);

      // Check if both variants have stock defined
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
      if (colorVariant?.stock !== undefined) {
        return colorVariant.stock > 0;
      }
    } else if (size) {
      const sizeVariant = selectedProductForModal.variants?.find((v: any) => v.type === 'SIZE' && v.value === size);
      if (sizeVariant?.stock !== undefined) {
        return sizeVariant.stock > 0;
      }
    } else if (color) {
      const colorVariant = selectedProductForModal.variants?.find((v: any) => v.type === 'COLOR' && v.value === color);
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
      const selectedVariant = selectedProductForModal.variants?.find((v: any) =>
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
      return;
    }

    const displayPrice = (selectedProductForModal.salePrice && selectedProductForModal.salePrice > 0)
      ? selectedProductForModal.salePrice
      : selectedProductForModal.price;

    addToCart({
      productId: selectedProductForModal.id,
      name: selectedProductForModal.name,
      nameAr: selectedProductForModal.nameAr,
      price: displayPrice,
      salePrice: selectedProductForModal.salePrice,
      image: selectedProductForModal.image,
      quantity: quantity,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
    });

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
  };

  const handleAddAllToCart = async () => {
    setIsLoading(true);
    try {
      const availableItems = wishlistItems.filter((item: any) => (item as any).stockQuantity > 0);

      if (availableItems.length === 0) {
        showToast(
          language === 'ar' ? 'لا توجد منتجات متوفرة في المخزون' : 'No products available in stock',
          'info',
          3000
        );
        return;
      }

      let addedCount = 0;
      // Add all items sequentially to avoid race conditions
      for (const item of availableItems) {
        await handleAddToCart(item);
        addedCount++;
        // Small delay to prevent overwhelming the cart
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      showToast(
        language === 'ar'
          ? `تم إضافة ${addedCount} منتج للسلة بنجاح!`
          : `Successfully added ${addedCount} items to cart!`,
        'success',
        3000
      );
    } catch (error) {
      // Error adding all to cart - no sensitive data logged
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء إضافة المنتجات' : 'Error adding products to cart',
        'error',
        3000
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = (itemId: string) => {
    removeFromWishlist(itemId);
  };

  const handleClearWishlist = () => {
    setShowClearModal(true);
  };

  const confirmClearWishlist = () => {
    clearWishlist();
    setShowClearModal(false);
  };

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'المفضلة' : 'Wishlist'}
            </h1>
            {wishlistItems.length > 0 && (
              <button
                onClick={handleClearWishlist}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-24 w-24 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              {language === 'ar' ? 'المفضلة فارغة' : 'Your wishlist is empty'}
            </h3>
            <p className="mt-2 text-gray-600">
              {language === 'ar'
                ? 'لم تقم بإضافة أي منتجات للمفضلة بعد. ابدأ التسوق الآن!'
                : 'You haven\'t added any products to your wishlist yet. Start shopping now!'
              }
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
              >
                <Package className="w-5 h-5" />
                {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Wishlist Stats */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {language === 'ar' ? 'منتجاتك المفضلة' : 'Your Favorite Products'}
                    </h2>
                    <p className="text-[#DAA520]/90 mt-1">
                      {language === 'ar'
                        ? `${wishlistItems.length} منتج في المفضلة`
                        : `${wishlistItems.length} items in wishlist`
                      }
                    </p>
                  </div>
                  <Heart className="w-12 h-12 text-white/20" />
                </div>
              </div>
            </div>

            {/* Wishlist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                  style={index === 0 ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#FFFFFF' }}
                >
                  {/* Product Image */}
                  <div className="relative">
                    <Link href={`/products/${item.slug}`}>
                      <img
                        src={item.image}
                        alt={language === 'ar' ? item.nameAr : item.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>

                    {/* Sale Badge */}
                    {(item as any).salePrice && (item as any).salePrice < item.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {Math.round(((item.price - (item as any).salePrice) / item.price) * 100)}%
                      </div>
                    )}

                    {/* Stock Status */}
                    {(item as any).stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {language === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Category */}
                    <p className="text-sm text-gray-500 mb-1">
                      {(item as any).category?.name || 'Category'}
                    </p>

                    {/* Product Name */}
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-[#DAA520] transition-colors">
                        {language === 'ar' ? item.nameAr : item.name}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold text-[#DAA520]">
                        {formatPrice((item as any).salePrice || item.price)}
                      </span>
                      {(item as any).salePrice && (item as any).salePrice < item.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={(item as any).stockQuantity === 0 || isLoading}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${(item as any).stockQuantity === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#DAA520] text-white hover:bg-[#B8860B]'
                          }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {(item as any).stockQuantity === 0
                          ? (language === 'ar' ? 'نفد المخزون' : 'Out of Stock')
                          : (language === 'ar' ? 'أضف للسلة' : 'Add to Cart')
                        }
                      </button>
                      <Link
                        href={`/products/${item.slug}`}
                        className="flex items-center justify-center w-10 h-10 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleAddAllToCart}
                  disabled={isLoading || wishlistItems.filter((item: any) => (item as any).stockQuantity > 0).length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {isLoading
                    ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                    : (language === 'ar' ? 'أضف الكل للسلة' : 'Add All to Cart')
                  }
                </button>
                <Link
                  href="/products"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  {language === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Clear Wishlist Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowClearModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'ar' ? 'حذف جميع المنتجات' : 'Clear All Items'}
                  </h3>
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  {language === 'ar'
                    ? 'هل أنت متأكد من حذف جميع المنتجات من المفضلة؟ لا يمكن التراجع عن هذا الإجراء.'
                    : 'Are you sure you want to remove all items from your wishlist? This action cannot be undone.'
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={confirmClearWishlist}
                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {language === 'ar' ? 'حذف الكل' : 'Clear All'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {selectedProductForModal.image && (
                <div className="mb-6">
                  <img
                    src={selectedProductForModal.image}
                    alt={language === 'ar' ? selectedProductForModal.nameAr : selectedProductForModal.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/eeeeee/999999?text=No+Image';
                    }}
                  />
                </div>
              )}

              {/* Product Name */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {language === 'ar' ? selectedProductForModal.nameAr : selectedProductForModal.name}
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
                        const hasStockGeneral = hasStockForCombination(size.value, undefined);
                        const hasStockForColor = selectedColor
                          ? hasStockForCombination(size.value, selectedColor)
                          : true;
                        const isAvailable = hasStockGeneral;

                        return (
                          <button
                            key={size.value}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedSize(size.value);
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
                          >
                            {!isAvailable && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</span>
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
                              title={language === 'ar' ? (color.valueAr || color.value) : color.value}
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
                              {language === 'ar' ? (color.valueAr || color.value) : color.value}
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
    </div>
  );
}
