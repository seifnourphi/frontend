import './globals.css';
import type { Metadata } from 'next';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { WishlistProvider } from '@/components/providers/WishlistProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SecurityShield } from '@/components/providers/SecurityShield';
import { Header } from '@/components/layout/Header';
import { ScrollRestoration } from '@/components/ui/ScrollRestoration';
import { BackToTop } from '@/components/ui/BackToTop';
import { seoConfig } from '@/lib/seo';

// Fetch SEO settings from database
async function getSeoSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings/seo`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.seoSettings) {
        return data.seoSettings;
      }
    }
  } catch (error) {
    // Silent error handling
  }

  // Return defaults if fetch fails
  return {
    metaDescriptionAr: seoConfig.descriptionAr,
    metaDescriptionEn: seoConfig.descriptionEn,
    keywords: seoConfig.keywords.join(', ')
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSeoSettings();

  return {
    metadataBase: new URL(seoConfig.siteUrl),
    title: `${seoConfig.brandNameAr} | ${seoConfig.brandNameEn}`,
    description: seoSettings.metaDescriptionAr || seoConfig.descriptionAr,
    keywords: seoSettings.keywords || seoConfig.keywords.join(', '),
    authors: [{ name: `${seoConfig.brandNameAr} - ${seoConfig.brandNameEn}` }],
    creator: seoConfig.brandNameAr,
    publisher: seoConfig.brandNameAr,
    robots: 'index, follow',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/uploads/logos/logo.png', type: 'image/png', sizes: '32x32' },
        { url: '/uploads/logos/logo.png', type: 'image/png', sizes: '16x16' },
      ],
      apple: [
        { url: '/uploads/logos/logo.png', type: 'image/png', sizes: '180x180' },
      ],
      shortcut: '/favicon.svg',
    },
    openGraph: {
      type: 'website',
      locale: 'ar_EG',
      alternateLocale: 'en_US',
      title: `${seoConfig.brandNameAr} | ${seoConfig.brandNameEn}`,
      description: seoSettings.metaDescriptionAr || seoConfig.descriptionAr,
      siteName: seoConfig.brandNameAr,
      url: seoConfig.siteUrl,
      images: [
        {
          url: '/uploads/logos/logo.png',
          width: 1200,
          height: 630,
          alt: `${seoConfig.brandNameAr} - ${seoConfig.brandNameEn}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoConfig.brandNameAr} | ${seoConfig.brandNameEn}`,
      description: seoSettings.metaDescriptionEn || seoConfig.descriptionEn,
      images: ['/uploads/logos/logo.png'],
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="ltr" className="font-dubai">
      <head>
        {/* Critical: Polyfills for Burp Suite compatibility - must load FIRST */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var s = typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
  
  // Initialize webpackChunk_N_E
  if (!s.webpackChunk_N_E || !Array.isArray(s.webpackChunk_N_E)) {
    s.webpackChunk_N_E = [];
  }
  if (typeof s.webpackChunk_N_E.push !== 'function') {
    s.webpackChunk_N_E.push = Array.prototype.push;
  }
  
  // Initialize __next_f
  if (!s.__next_f || !Array.isArray(s.__next_f)) {
    s.__next_f = [];
  }
  if (typeof s.__next_f.push !== 'function') {
    s.__next_f.push = Array.prototype.push;
  }
  
  // Set on window and self
  if (typeof window !== 'undefined') {
    window.webpackChunk_N_E = s.webpackChunk_N_E;
    window.__next_f = s.__next_f;
  }
  if (typeof self !== 'undefined' && self !== s) {
    self.webpackChunk_N_E = s.webpackChunk_N_E;
    self.__next_f = s.__next_f;
  }
  
  // Fix chunkLoadingGlobal
  if (s.chunkLoadingGlobal && !Array.isArray(s.chunkLoadingGlobal)) {
    s.chunkLoadingGlobal = [];
  }
  if (s.chunkLoadingGlobal && typeof s.chunkLoadingGlobal.forEach !== 'function') {
    s.chunkLoadingGlobal.forEach = Array.prototype.forEach;
  }
  
  // Monitor and fix (Burp Suite defense) - optimized frequency
  setInterval(function() {
    if (s.webpackChunk_N_E && typeof s.webpackChunk_N_E.push !== 'function') {
      s.webpackChunk_N_E = [];
      if (typeof window !== 'undefined') window.webpackChunk_N_E = s.webpackChunk_N_E;
      if (typeof self !== 'undefined') self.webpackChunk_N_E = s.webpackChunk_N_E;
    }
    if (s.__next_f && typeof s.__next_f.push !== 'function') {
      s.__next_f = [];
      if (typeof window !== 'undefined') window.__next_f = s.__next_f;
      if (typeof self !== 'undefined') self.__next_f = s.__next_f;
    }
  }, 5000); // Reduced from 50ms to 5000ms (5 seconds) for better performance
})();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/dubai" rel="stylesheet" />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900 font-dubai transition-colors duration-300">
        <SecurityShield>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastProvider>
                    <ScrollRestoration />
                    <Header />
                    {children}
                    <BackToTop />
                  </ToastProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </SecurityShield>
      </body>
    </html>
  );
}
