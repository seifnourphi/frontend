'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { User, LogIn, UserPlus, Settings, LogOut, ChevronDown, Mail, Shield, ShoppingBag, UserCircle, Truck } from 'lucide-react';
import { getImageSrc } from '@/lib/image-utils';

export function AccountToggle() {
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-[#DAA520] transition-colors cursor-pointer"
      >
        {user ? (
          <div className="flex items-center gap-2">
            {/* User Avatar */}
            <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-gray-300 text-xs font-bold shadow-sm overflow-hidden">
              {user.avatar ? (
                <img
                  src={getImageSrc(user.avatar, '')}
                  alt={getUserDisplayName()}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    // Hide image on error, show initials instead
                    const img = e.currentTarget;
                    img.style.display = 'none';
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.avatar-fallback')) {
                      const fallback = document.createElement('span');
                      fallback.className = 'avatar-fallback text-gray-300 text-xs font-bold';
                      fallback.textContent = getUserInitials();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                getUserInitials()
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium">
              {getUserDisplayName()}
            </span>
          </div>
        ) : (
          <>
            <User className="w-5 h-5" />
            <span className="hidden sm:block text-sm font-medium" suppressHydrationWarning>
              {mounted ? (language === 'ar' ? 'حسابي' : 'Account') : 'حسابي'}
            </span>
          </>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed md:absolute right-4 md:right-0 top-20 md:top-full mt-3 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 transition-none"
          style={{ width: 'min(288px, calc(100vw - 2rem))' }}>

          {user ? (
            // Logged in menu
            <>
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#DAA520] to-[#B8860B] rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {user.avatar ? (
                      <img
                        src={getImageSrc(user.avatar, '')}
                        alt={getUserDisplayName()}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          // Hide image on error, show initials instead
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent && !parent.querySelector('.avatar-fallback-large')) {
                            const fallback = document.createElement('span');
                            fallback.className = 'avatar-fallback-large text-white text-lg font-bold';
                            fallback.textContent = getUserInitials();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {getUserDisplayName()}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    {user.emailVerified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        ✓ {language === 'ar' ? 'متحقق' : 'Verified'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Actions */}
              <div className="py-2">
                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#DAA520]/5 hover:text-[#DAA520] transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? 'ملفي الشخصي' : 'My Profile'}</span>
                </Link>

                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#DAA520]/5 hover:text-[#DAA520] transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
                </Link>

                <Link
                  href="/account/wishlist"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#DAA520]/5 hover:text-[#DAA520] transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? 'المفضلة' : 'Wishlist'}</span>
                </Link>

                <Link
                  href="/account/track-order"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#DAA520]/5 hover:text-[#DAA520] transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Truck className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? 'تتبع الطلب' : 'Track Order'}</span>
                </Link>
              </div>

              {/* Settings */}
              <div className="py-2 border-t border-gray-100">
                <Link
                  href="/account/settings"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#DAA520]/5 hover:text-[#DAA520] transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                </Link>

                <Link
                  href="/account/security"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#DAA520]/5 hover:text-[#DAA520] transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? 'الأمان' : 'Security'}</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-lg mx-2 w-full text-left font-medium"
              >
                <LogOut className="w-5 h-5" />
                {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </>
          ) : (
            // Not logged in menu
            <>
              <div className="px-4 py-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                  {language === 'ar' ? 'مرحباً بك!' : 'Welcome!'}
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  {language === 'ar' ? 'سجل دخولك أو أنشئ حساباً جديداً' : 'Sign in or create a new account'}
                </p>
              </div>

              <div className="px-4 space-y-2">
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white bg-[#DAA520] hover:bg-[#B8860B] transition-all duration-200 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn className="w-5 h-5" />
                  {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Link>

                <Link
                  href="/auth/register"
                  className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-[#DAA520] bg-[#DAA520]/10 hover:bg-[#DAA520]/20 border border-[#DAA520]/30 transition-all duration-200 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <UserPlus className="w-5 h-5" />
                  {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                </Link>

                <Link
                  href="/account/track-order"
                  className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-[#DAA520] bg-[#DAA520]/10 hover:bg-[#DAA520]/20 border border-[#DAA520]/30 transition-all duration-200 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <Truck className="w-5 h-5" />
                  {language === 'ar' ? 'تتبع الطلب' : 'Track Order'}
                </Link>
              </div>

              <div className="border-t border-gray-100 my-3"></div>

              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 mb-3 text-center">
                  {language === 'ar' ? 'مزايا الحساب:' : 'Account Benefits:'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></div>
                    {language === 'ar' ? 'تتبع الطلبات' : 'Track Orders'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></div>
                    {language === 'ar' ? 'قائمة الأمنيات' : 'Wishlist'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></div>
                    {language === 'ar' ? 'عروض حصرية' : 'Exclusive Offers'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></div>
                    {language === 'ar' ? 'تسوق أسرع' : 'Faster Checkout'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
