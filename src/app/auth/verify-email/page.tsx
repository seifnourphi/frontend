'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function VerifyEmailContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailFromParams = searchParams.get('email');
    const emailFromStorage = localStorage.getItem('pendingEmail');
    const userEmail = emailFromParams || emailFromStorage || 'user@example.com';
    setEmail(userEmail);

    // Store email in localStorage if not already there
    if (!emailFromStorage && emailFromParams) {
      localStorage.setItem('pendingEmail', emailFromParams);
    }

    // Don't auto-fill verification code - let user enter it manually
    // This ensures the user actually receives and enters the real code
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 6) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 7) {
      setError(language === 'ar' ? 'يرجى إدخال الكود المكون من 7 أرقام' : 'Please enter the 7-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          email: email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(language === 'ar' ? 'تم تأكيد البريد الإلكتروني بنجاح!' : 'Email verified successfully!');

        // Clear pending data from localStorage
        localStorage.removeItem('pendingEmail');
        localStorage.removeItem('verificationCode');

        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        setError(data.error || (language === 'ar' ? 'كود التحقق غير صحيح' : 'Invalid verification code'));
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ أثناء التحقق' : 'Error during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(language === 'ar' ? 'تم إرسال كود جديد إلى بريدك الإلكتروني!' : 'New code sent to your email!');
        setTimeLeft(300);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '', '']);
      } else {
        setError(data.error || (language === 'ar' ? 'حدث خطأ أثناء إرسال الكود' : 'Error sending code'));
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ أثناء إرسال الكود' : 'Error sending code');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCodeFromStorage = () => {
    // Code auto-fill disabled for security
    setError(language === 'ar' ? 'يرجى إدخال الكود يدوياً من بريدك الإلكتروني' : 'Please enter the code manually from your email');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="absolute top-4 left-4">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {language === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'ar'
              ? 'أدخل الكود المكون من 7 أرقام الذي أرسلناه إلى بريدك الإلكتروني'
              : 'Enter the 7-digit code we sent to your email address'
            }
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          {/* Email Info */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'تم إرسال الكود إلى:' : 'Code sent to:'}
            </p>
            <p className="text-sm font-medium text-gray-900">{email}</p>

            {/* Developer Tools Toggle */}
            <button
              type="button"
              onClick={() => setShowDevTools(!showDevTools)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-500 underline"
            >
              {language === 'ar' ? 'أدوات المطور' : 'Developer Tools'}
            </button>

            {/* Developer Tools Panel */}
            {showDevTools && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-left">
                <p className="text-xs text-gray-600 mb-2">
                  {language === 'ar' ? 'للتطوير فقط - ملء الكود تلقائياً:' : 'Development only - Auto-fill code:'}
                </p>
                <button
                  type="button"
                  onClick={fillCodeFromStorage}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  {language === 'ar' ? 'ملء الكود' : 'Fill Code'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar'
                    ? 'هذا الزر يملأ الكود من التخزين المحلي للتطوير فقط'
                    : 'This button fills code from local storage for development only'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Verification Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              {language === 'ar' ? 'كود التحقق' : 'Verification Code'}
            </label>

            {/* Instructions */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">
                {language === 'ar'
                  ? 'يرجى إدخال الكود المكون من 7 أرقام الذي تم إرساله إلى بريدك الإلكتروني'
                  : 'Please enter the 7-digit code sent to your email'
                }
              </p>
            </div>
            <div className="flex justify-center gap-3">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  name={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'الوقت المتبقي:' : 'Time remaining:'}{' '}
              <span className="font-medium text-gray-900">{formatTime(timeLeft)}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md mb-4">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">{success}</span>
            </div>
          )}

          {/* Verify Button */}
          <div className="mb-4">
            <button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.some(digit => !digit)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                </>
              ) : (
                language === 'ar' ? 'تحقق من الكود' : 'Verify Code'
              )}
            </button>
          </div>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {language === 'ar' ? 'لم تستلم الكود؟' : "Didn't receive the code?"}
            </p>
            <button
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {language === 'ar' ? 'إعادة إرسال الكود' : 'Resend Code'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 text-center">
              {language === 'ar'
                ? 'إذا لم تجد الرسالة في صندوق الوارد، تحقق من مجلد الرسائل المزعجة'
                : 'If you don\'t see the email in your inbox, check your spam folder'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
