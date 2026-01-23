'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Heart, X, ShoppingCart, ChevronRight, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';

// Helper function to decode HTML entities in URLs
function decodeHtmlEntities(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = url;
    return tempDiv.textContent || tempDiv.innerText || url;
  }
  // Server-side: use simple replace
  return url
    .replace(/&#x2F;/g, '/')
    .replace(/&#47;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

export function WishlistToggle() {
  const { language } = useLanguage();
  const { items, removeFromWishlist, clearWishlist, getWishlistCount } = useWishlist();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
  };

  const handleClearWishlist = () => {
    setShowClearModal(true);
  };

  const confirmClearWishlist = () => {
    clearWishlist();
    setShowClearModal(false);
    setIsOpen(false);
    showToast(
      language === 'ar' ? 'تم حذف جميع المنتجات من المفضلة' : 'All items removed from wishlist',
      'success',
      3000
    );
  };

  const formatPrice = (price: number) => {
    return `ج.م ${price.toLocaleString('en-US')}`;
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative flex items-center gap-2 text-gray-300 hover:text-[#DAA520] transition-colors cursor-pointer"
      >
        <Heart className="w-5 h-5" />
        <span className="hidden sm:block" suppressHydrationWarning>
          {mounted ? (language === 'ar' ? 'المفضلة' : 'Wishlist') : 'المفضلة'}
        </span>
        {getWishlistCount() > 0 && (
          <div className="absolute -top-2 -right-2 bg-[#DAA520] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getWishlistCount()}
          </div>
        )}
      </button>

      {/* Wishlist Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-transparent z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Wishlist Panel */}
          <div
            className="fixed md:absolute top-20 md:top-full right-4 md:right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] max-h-[80vh] overflow-hidden flex flex-col"
            style={{
              width: 'min(380px, calc(100vw - 2rem))',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-50 bg-gray-50/30">
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#DAA520]" />
                  <h3 className="text-gray-900 text-sm">
                    {language === 'ar' ? 'المفضلة' : 'Wishlist'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2 px-3">
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {language === 'ar' ? 'المفضلة فارغة' : 'Your wishlist is empty'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                      {/* Product Image */}
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={decodeHtmlEntities(item.image || '')}
                          alt={language === 'ar' ? item.nameAr : item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop&crop=center';
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {language === 'ar' ? item.nameAr : item.name}
                        </h4>
                        <p className="text-xs text-[#DAA520] font-bold mt-0.5">
                          {formatPrice(item.price)}
                        </p>
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] text-gray-400 hover:text-[#DAA520] font-medium"
                        >
                          {language === 'ar' ? 'عرض المنتج' : 'View Product'}
                        </Link>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleRemoveFromWishlist(item.productId)}
                        className="text-gray-200 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleClearWishlist}
                    className="py-2 px-3 rounded-lg border border-red-50 text-red-500 font-bold text-center text-xs hover:bg-red-50 transition-all"
                  >
                    {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                  </button>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="py-2 px-3 rounded-lg bg-[#DAA520] text-white font-bold text-center text-xs hover:bg-[#B8860B] transition-all shadow-md shadow-[#DAA520]/10 flex items-center justify-center gap-1"
                  >
                    {language === 'ar' ? 'عرض المفضلة' : 'View Wishlist'}
                    {language === 'ar' ? <ArrowLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Clear Wishlist Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4" onClick={() => setShowClearModal(false)}>
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
    </div>
  );
}
