'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/components/providers/CartProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function CartToggle() {
  const { items, removeFromCart, updateQuantity } = useCart();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use default language value for server-side rendering
  const displayText = mounted ? (language === 'ar' ? 'السلة' : 'Cart') : 'السلة';

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return language === 'ar'
      ? `ج.م ${price.toLocaleString('en-US')}`
      : `EGP ${price.toLocaleString('en-US')}`;
  };

  return (
    <div className="relative">
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 text-white hover:text-[#DAA520] transition-colors cursor-pointer"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="hidden sm:block" suppressHydrationWarning>
          {displayText}
        </span>
        {totalItems > 0 && (
          <div className="absolute -top-2 -right-2 bg-[#DAA520] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </div>
        )}
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-transparent z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Cart Panel */}
          <div
            className="fixed md:absolute top-20 md:top-full right-4 md:right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] max-h-[80vh] overflow-hidden flex flex-col"
            style={{
              width: 'min(380px, calc(100vw - 2rem))',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/30">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#DAA520]" />
                <h3 className="font-bold text-gray-900">
                  {language === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-2 px-3">
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {language === 'ar' ? 'سلة المشتريات فارغة' : 'Your cart is empty'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      {/* Product Image */}
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">👘</div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {language === 'ar' ? item.nameAr : item.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-[#DAA520] font-bold">
                            {formatPrice(item.price)}
                          </p>
                          <div className="flex items-center gap-2 bg-gray-100 rounded-md px-1.5 py-0.5">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="text-gray-500 hover:text-gray-900"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
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
              <div className="p-4 border-t border-gray-100 bg-gray-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'المجموع' : 'Total'}
                  </span>
                  <span className="text-lg font-bold text-[#DAA520]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="py-2 px-3 rounded-lg border border-gray-200 text-gray-700 font-bold text-center text-xs hover:bg-white transition-all"
                  >
                    {language === 'ar' ? 'عرض السلة' : 'View Cart'}
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="py-2 px-3 rounded-lg bg-[#DAA520] text-white font-bold text-center text-xs hover:bg-[#B8860B] transition-all shadow-md shadow-[#DAA520]/10 flex items-center justify-center gap-1"
                  >
                    {language === 'ar' ? 'إتمام الشراء' : 'Checkout'}
                    {language === 'ar' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
