'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function NotFound() {
  const router = useRouter();
  const { language } = useLanguage();
  const [countdown, setCountdown] = useState(10);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/');
    }
  }, [countdown, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#DAA520] via-[#B8860B] to-[#DAA520] animate-pulse">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <AlertTriangle className="w-24 h-24 text-[#DAA520] animate-bounce" />
            <div className="absolute inset-0 bg-[#DAA520]/20 rounded-full blur-2xl animate-ping"></div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found') : 'الصفحة غير موجودة'}
          </h2>
          <p className="text-lg text-gray-600 mb-2" suppressHydrationWarning>
            {mounted
              ? (language === 'ar'
                ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
                : 'Sorry, the page you are looking for does not exist or has been moved.')
              : 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'}
          </p>
          <p className="text-sm text-gray-500" suppressHydrationWarning>
            {mounted
              ? (language === 'ar'
                ? `سيتم إعادة توجيهك تلقائياً خلال ${countdown} ثانية...`
                : `You will be redirected automatically in ${countdown} seconds...`)
              : `سيتم إعادة توجيهك تلقائياً خلال ${countdown} ثانية...`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-white rounded-lg font-semibold hover:from-[#B8860B] hover:to-[#DAA520] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            suppressHydrationWarning
          >
            <Home className="w-5 h-5" />
            <span suppressHydrationWarning>
              {mounted ? (language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Homepage') : 'العودة للصفحة الرئيسية'}
            </span>
          </button>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-300 hover:border-[#DAA520] hover:text-[#DAA520] transition-all duration-300 shadow-md hover:shadow-lg"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-5 h-5" />
            <span suppressHydrationWarning>
              {mounted ? (language === 'ar' ? 'رجوع' : 'Go Back') : 'رجوع'}
            </span>
          </button>
        </div>

        {/* Search suggestion */}
        <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 justify-center mb-3">
            <Search className="w-5 h-5 text-[#DAA520]" />
            <h3 className="text-lg font-semibold text-gray-900" suppressHydrationWarning>
              {mounted ? (language === 'ar' ? 'ربما تبحث عن:' : 'You might be looking for:') : 'ربما تبحث عن:'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 bg-gray-100 hover:bg-[#DAA520] hover:text-white rounded-lg text-sm font-medium transition-colors"
              suppressHydrationWarning
            >
              {mounted ? (language === 'ar' ? 'المنتجات' : 'Products') : 'المنتجات'}
            </button>
            <button
              onClick={() => router.push('/categories')}
              className="px-4 py-2 bg-gray-100 hover:bg-[#DAA520] hover:text-white rounded-lg text-sm font-medium transition-colors"
              suppressHydrationWarning
            >
              {mounted ? (language === 'ar' ? 'الأقسام' : 'Categories') : 'الأقسام'}
            </button>
            <button
              onClick={() => router.push('/about')}
              className="px-4 py-2 bg-gray-100 hover:bg-[#DAA520] hover:text-white rounded-lg text-sm font-medium transition-colors"
              suppressHydrationWarning
            >
              {mounted ? (language === 'ar' ? 'من نحن' : 'About Us') : 'من نحن'}
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="px-4 py-2 bg-gray-100 hover:bg-[#DAA520] hover:text-white rounded-lg text-sm font-medium transition-colors"
              suppressHydrationWarning
            >
              {mounted ? (language === 'ar' ? 'اتصل بنا' : 'Contact Us') : 'اتصل بنا'}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#DAA520]/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#B8860B]/10 rounded-full blur-3xl -z-10"></div>
      </div>
    </div>
  );
}

