'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '@/lib/client-validation';
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar';

import { Suspense } from 'react';

function ResetPasswordContent() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError(mounted ? (language === 'ar' ? 'رابط إعادة التعيين غير صحيح' : 'Invalid reset link') : 'رابط إعادة التعيين غير صحيح');
    }
  }, [searchParams, language, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password
    if (!password) {
      setError(mounted ? (language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required') : 'كلمة المرور مطلوبة');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || (mounted ? (language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password format') : 'كلمة المرور غير صحيحة'));
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setError(mounted ? (language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match') : 'كلمات المرور غير متطابقة');
      return;
    }

    if (!token) {
      setError(mounted ? (language === 'ar' ? 'رابط إعادة التعيين غير صحيح' : 'Invalid reset link') : 'رابط إعادة التعيين غير صحيح');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(mounted ? (language === 'ar' ? 'تم إعادة تعيين كلمة المرور بنجاح!' : 'Password has been reset successfully!') : 'تم إعادة تعيين كلمة المرور بنجاح!');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.error || (mounted ? (language === 'ar' ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password') : 'فشل إعادة تعيين كلمة المرور'));
      }
    } catch (err) {
      setError(mounted ? (language === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Failed to connect to server') : 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DAA520] mx-auto"></div>
          <p className="mt-4 text-gray-600" suppressHydrationWarning>
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* Breadcrumb */}
      <div className={`absolute top-4 ${language === 'ar' ? 'right-4' : 'left-4'}`}>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login') : 'العودة لتسجيل الدخول'}
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="text-3xl font-bold text-[#DAA520] tracking-wide" style={{ fontFamily: 'serif' }}>
              R<span className="text-2xl">i</span>DAA
            </div>
            <div className="w-full h-0.5 mt-1" style={{
              background: 'linear-gradient(90deg, transparent 0%, transparent 20%, #DAA520 40%, #DAA520 60%, transparent 80%, transparent 100%)',
              boxShadow: '0 0 4px #DAA520, 0 0 8px rgba(218, 165, 32, 0.5)'
            }}></div>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password') : 'إعادة تعيين كلمة المرور'}
          </h2>
          <p className="mt-2 text-sm text-gray-600" suppressHydrationWarning>
            {mounted
              ? (language === 'ar'
                ? 'أدخل كلمة مرور جديدة لحسابك'
                : 'Enter a new password for your account')
              : 'أدخل كلمة مرور جديدة لحسابك'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-md bg-green-50 p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2" suppressHydrationWarning>
                {mounted ? (language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password') : 'كلمة المرور الجديدة'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#DAA520] focus:border-[#DAA520] sm:text-sm"
                  placeholder={mounted ? (language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password') : 'أدخل كلمة المرور الجديدة'}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {password && <PasswordStrengthBar password={password} />}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2" suppressHydrationWarning>
                {mounted ? (language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password') : 'تأكيد كلمة المرور'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#DAA520] focus:border-[#DAA520] sm:text-sm"
                  placeholder={mounted ? (language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password') : 'أعد إدخال كلمة المرور'}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#DAA520] to-[#B8860B] hover:from-[#B8860B] hover:to-[#DAA520] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DAA520] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span suppressHydrationWarning>
                      {mounted ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : 'جاري الحفظ...'}
                    </span>
                  </>
                ) : (
                  <span suppressHydrationWarning>
                    {mounted ? (language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password') : 'إعادة تعيين كلمة المرور'}
                  </span>
                )}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-[#DAA520] hover:text-[#B8860B] font-medium"
              >
                {mounted ? (language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login') : 'العودة لتسجيل الدخول'}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DAA520] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

