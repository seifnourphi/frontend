'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Search, Menu, X, Globe, ChevronDown } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { CartToggle } from '@/components/ui/CartToggle';
import { SearchBar } from '@/components/ui/SearchBar';
import { AccountToggle } from '@/components/ui/AccountToggle';
import { WishlistToggle } from '@/components/ui/WishlistToggle';
import { AnnouncementBar } from '@/components/ui/AnnouncementBar';


export function Header() {
  const pathname = usePathname();
  const { language, t, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [pagesVisibility, setPagesVisibility] = useState({
    about: true,
    contact: true,
    terms: true
  });

  // Hide header in admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<{
    phone: string;
    email: string;
    name: string;
    nameAr: string;
    announcement?: any;
  } | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always use 'ar' for server-side rendering to avoid hydration mismatch
  // The actual language will be applied on client-side after hydration
  const navigation = useMemo(() => {
    // During SSR, always use 'ar' to match server output
    // After hydration, use the actual language
    const currentLanguage = (typeof window !== 'undefined' && mounted) ? language : 'ar';
    const links = [
      { name: currentLanguage === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
      { id: 'about', name: currentLanguage === 'ar' ? 'من نحن' : 'About', href: '/about' },
      { name: currentLanguage === 'ar' ? 'المنتجات' : 'Products', href: '/products' },
      { name: currentLanguage === 'ar' ? 'السلة' : 'Cart', href: '/cart' },
      { name: currentLanguage === 'ar' ? 'الدفع' : 'Checkout', href: '/checkout' },
      { id: 'contact', name: currentLanguage === 'ar' ? 'اتصل بنا' : 'Contact', href: '/contact' },
    ];

    return links.filter(link => {
      if (link.id === 'about') return pagesVisibility.about;
      if (link.id === 'contact') return pagesVisibility.contact;
      return true;
    });
  }, [language, mounted, pagesVisibility]);

  // Cache for store settings to prevent excessive requests
  const settingsCacheRef = useRef<{ data: any; timestamp: number } | null>(null);
  const isFetchingRef = useRef(false);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const fetchStoreSettings = async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && settingsCacheRef.current) {
      const cacheAge = Date.now() - settingsCacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setStoreSettings(settingsCacheRef.current.data.store);
        setPagesVisibility(settingsCacheRef.current.data.visibility);
        setIsLoadingSettings(false);
        return;
      }
    }

    // Prevent concurrent requests
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      // Fetch both store and pages content
      const [storeRes, pagesRes] = await Promise.all([
        fetch(`/api/settings/store?t=${Date.now()}`),
        fetch(`/api/settings/pages-content?t=${Date.now()}`)
      ]);

      let storeData = null;
      let visibilityData = { about: true, contact: true, terms: true };

      if (storeRes.ok) {
        const data = await storeRes.json();
        storeData = data.storeSettings || data.data?.storeSettings || {
          name: 'RIDAA Fashion',
          nameAr: 'رِداء للأزياء',
          phone: '+20 100 000 0000',
          email: 'ridaa.store.team@gmail.com',
          address: '',
          showAdvertisements: true,
          socialMedia: {
            facebook: { enabled: false, url: '' },
            instagram: { enabled: false, url: '' },
            twitter: { enabled: false, url: '' },
            youtube: { enabled: false, url: '' }
          }
        };
      }

      if (pagesRes.ok) {
        const data = await pagesRes.json();
        const pages = data.pagesContent || data.data?.pagesContent;
        if (pages) {
          visibilityData = {
            about: pages.about?.enabled !== false,
            contact: pages.contact?.enabled !== false,
            terms: pages.terms?.enabled !== false
          };
        }
      }

      // Update cache and state
      settingsCacheRef.current = {
        data: { store: storeData, visibility: visibilityData },
        timestamp: Date.now()
      };
      setStoreSettings(storeData);
      setPagesVisibility(visibilityData);

    } catch (error) {
      console.error('Error fetching header settings:', error);
      // Fallback to cache or defaults
      if (settingsCacheRef.current) {
        setStoreSettings(settingsCacheRef.current.data.store);
        setPagesVisibility(settingsCacheRef.current.data.visibility);
      }
    } finally {
      setIsLoadingSettings(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStoreSettings();

    // Refresh settings periodically (every 5 minutes instead of 30 seconds)
    const interval = setInterval(() => {
      fetchStoreSettings(true); // Force refresh
    }, 5 * 60 * 1000);

    // Debounced focus handler to prevent excessive requests
    let focusTimeout: NodeJS.Timeout;
    const handleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        fetchStoreSettings(true); // Force refresh on focus
      }, 2000); // Wait 2 seconds after focus
    };
    window.addEventListener('focus', handleFocus);

    // Refresh on storage event (if settings are saved via localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'storeSettingsUpdated') {
        // Clear cache and refresh
        settingsCacheRef.current = null;
        fetchStoreSettings(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom event when settings are saved
    const handleSettingsUpdate = () => {
      fetchStoreSettings();
    };
    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
    };
  }, []);


  return (
    <>
      {/* Main Header */}
      <div className="bg-[#111827] border-b border-gray-600 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-center no-underline">
              <div className="flex flex-col items-center mb-1">
                <span className="text-3xl font-bold text-[#DAA520] tracking-wide" style={{ fontFamily: 'serif', width: '100%', textAlign: 'center' }}>
                  R<span className="text-2xl">i</span>DAA
                </span>
                <div
                  className="mt-1 header-logo-line"
                  style={{
                    width: '115%',
                    height: '2.5px',
                    minHeight: '2.5px',
                    maxHeight: '2.5px',
                    background: 'linear-gradient(90deg, transparent 0%, transparent 15%, #DAA520 35%, #DAA520 65%, transparent 85%, transparent 100%)',
                    boxShadow: '0 0 4px #DAA520, 0 0 8px rgba(218, 165, 32, 0.5)',
                    display: 'block',
                    opacity: 1,
                    visibility: 'visible',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1
                  }}
                ></div>
              </div>
              <div className="text-sm font-medium text-[#DAA520] tracking-wider text-center mt-1">
                WEAR YOUR IDENTITY
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <input
                  id="header-search"
                  name="search"
                  type="search"
                  autoComplete="off"
                  placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search for products...'}
                  className="w-full px-4 py-3 border border-gray-300 bg-white  text-gray-900 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                  onFocus={() => setIsSearchOpen(true)}
                  suppressHydrationWarning
                />
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#DAA520] text-white p-2 rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Side - User Actions */}
            <div className="flex items-center gap-4">

              {/* Language Toggle */}
              <LanguageToggle />

              {/* Account */}
              <AccountToggle />

              {/* Wishlist */}
              <WishlistToggle />

              {/* Cart Toggle */}
              <CartToggle />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-300  hover:text-[#DAA520] transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-[#111827] border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden md:flex items-center space-x-8 py-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-300  hover:text-[#DAA520] font-medium transition-colors relative group"
                suppressHydrationWarning
              >
                <span suppressHydrationWarning>{item.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#DAA520] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 ">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-300  hover:text-[#DAA520] font-medium transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                    suppressHydrationWarning
                  >
                    <span suppressHydrationWarning>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Animated Announcement Bar - show from md and centered - only after settings are loaded */}
      {!isLoadingSettings && storeSettings && (
        <div className="hidden md:block">
          {storeSettings.announcement?.enabled !== false && (
            <AnnouncementBar
              key={`announcement-${language}-${storeSettings.announcement?.variant || 'marquee'}-${storeSettings.announcement?.speed || 160}-${JSON.stringify(storeSettings.announcement?.messagesAr || [])}-${JSON.stringify(storeSettings.announcement?.messagesEn || [])}`}
              variant={storeSettings.announcement?.variant || 'marquee'}
              speed={storeSettings.announcement?.speed || 160}
              messages={(() => {
                // Fix: When language is 'ar', show messagesAr; when 'en', show messagesEn
                let msgs: string[] = [];
                if (language === 'ar') {
                  msgs = storeSettings.announcement?.messagesAr || [];
                } else {
                  msgs = storeSettings.announcement?.messagesEn || [];
                }
                return msgs;
              })()}
            />
          )}
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchBar onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
}