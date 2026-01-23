'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  Bell
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/components/providers/ToastProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { hasForbiddenChars, escapeHtml } from '@/lib/client-validation';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { getImageSrc } from '@/lib/image-utils';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  avatar?: string;
  emailVerified: boolean;
  subscribedToNewsletter?: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { language } = useLanguage();
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { csrfToken, loading: csrfLoading } = useCSRF();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null); // Store original values for cancel
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const newsletterUpdateRef = useRef<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null); // Store uploaded avatar URL temporarily

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && mounted) {
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash;
      const redirectUrl = `${currentPath}${currentHash}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get token from localStorage or cookies
        let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token && typeof window !== 'undefined') {
          const cookies = document.cookie;
          const tokenMatch = cookies.match(/token=([^;]+)/) || cookies.match(/__Host-token=([^;]+)/);
          if (tokenMatch && tokenMatch[1]) {
            token = decodeURIComponent(tokenMatch[1]);
          }
        }

        if (!token) {
          setIsLoading(false);
          return;
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/account/profile', {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();

          // Handle both response formats: { user: {...} } or { success: true, data: { profile: {...} } }
          let profileData: any = null;
          if (data.user) {
            // New format: direct user object
            profileData = data.user;
          } else if (data.success && data.data && data.data.profile) {
            // Old format: nested profile
            profileData = data.data.profile;
          }

          if (profileData) {
            // Initialize newsletter ref from profile if not already set
            if (newsletterUpdateRef.current === null && profileData.subscribedToNewsletter !== undefined) {
              newsletterUpdateRef.current = profileData.subscribedToNewsletter;
            }

            // Update emailVerified value from API response
            const emailVerifiedValue = profileData.emailVerified !== undefined
              ? profileData.emailVerified
              : (user?.emailVerified || false);

            // Update user in AuthProvider if emailVerified changed
            // Use setTimeout to avoid setState during render
            if (user && user.emailVerified !== emailVerifiedValue) {
              setTimeout(() => {
                updateUser({
                  ...user,
                  emailVerified: emailVerifiedValue
                });
              }, 0);
            }

            const profileDataObj = {
              firstName: profileData.firstName || '',
              lastName: profileData.lastName || '',
              email: profileData.email || user?.email || '',
              phone: profileData.phone || '',
              address: profileData.address || '',
              dateOfBirth: (user as any)?.dateOfBirth || '',
              avatar: profileData.avatar || '',
              emailVerified: emailVerifiedValue,
              subscribedToNewsletter: profileData.subscribedToNewsletter !== undefined
                ? profileData.subscribedToNewsletter
                : (user?.subscribedToNewsletter || false),
              createdAt: (user as any)?.createdAt || new Date().toISOString()
            };
            setProfile(profileDataObj);
            setOriginalProfile(profileDataObj); // Store original values
          }
        } else {
          await response.json().catch(() => ({}));
        }
      } catch (error) {
        // Error fetching profile
        // Fallback to user data if API fails
        if (user) {
          const fallbackProfile = {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            address: (user as any).address || '',
            dateOfBirth: (user as any).dateOfBirth || '',
            avatar: (user as any).avatar || '',
            emailVerified: user.emailVerified || false,
            subscribedToNewsletter: user.subscribedToNewsletter || false,
            createdAt: (user as any).createdAt || new Date().toISOString()
          };
          setProfile(fallbackProfile);
          setOriginalProfile(fallbackProfile); // Store original values
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);


  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSave = async () => {
    if (!profile) return;

    if (csrfLoading || !csrfToken) {
      showToast(
        language === 'ar' ? 'جاري تحميل رمز الأمان...' : 'Loading security token...',
        'info',
        2000
      );
      return;
    }

    // SECURITY: Frontend validation - check name length
    if (profile.firstName.trim().length > 25) {
      showToast(
        language === 'ar' ? '❌ الاسم الأول يجب ألا يتجاوز 25 حرفاً' : '❌ First name must not exceed 25 characters',
        'error',
        3000
      );
      return;
    }

    if (profile.lastName.trim().length > 25) {
      showToast(
        language === 'ar' ? '❌ الاسم الأخير يجب ألا يتجاوز 25 حرفاً' : '❌ Last name must not exceed 25 characters',
        'error',
        3000
      );
      return;
    }

    // SECURITY: Frontend validation - check for forbidden characters
    if (hasForbiddenChars(profile.firstName)) {
      showToast(
        language === 'ar' ? '❌ الاسم الأول يحتوي على رموز غير مسموحة' : '❌ Invalid input: First name contains forbidden characters',
        'error',
        3000
      );
      return;
    }

    if (hasForbiddenChars(profile.lastName)) {
      showToast(
        language === 'ar' ? '❌ الاسم الأخير يحتوي على رموز غير مسموحة' : '❌ Invalid input: Last name contains forbidden characters',
        'error',
        3000
      );
      return;
    }

    if (profile.phone && hasForbiddenChars(profile.phone)) {
      showToast(
        language === 'ar' ? '❌ رقم الهاتف يحتوي على رموز غير مسموحة' : '❌ Invalid input: Phone contains forbidden characters',
        'error',
        3000
      );
      return;
    }

    if (profile.address && hasForbiddenChars(profile.address)) {
      showToast(
        language === 'ar' ? '❌ العنوان يحتوي على رموز غير مسموحة' : '❌ Invalid input: Address contains forbidden characters',
        'error',
        3000
      );
      return;
    }

    setIsSaving(true);
    try {
      // Get token from localStorage or cookies
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token && typeof window !== 'undefined') {
        // Try to get from cookies as fallback
        const cookies = document.cookie;
        const tokenMatch = cookies.match(/token=([^;]+)/) || cookies.match(/__Host-token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          token = decodeURIComponent(tokenMatch[1]);
        }
      }

      if (!token) {
        showToast(
          language === 'ar'
            ? 'يرجى تسجيل الدخول أولاً'
            : 'Please login first',
          'error',
          3000
        );
        setIsSaving(false);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Include pending avatar URL if exists
      const profileDataToSend: any = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        address: profile.address,
        subscribedToNewsletter: profile.subscribedToNewsletter,
        csrfToken,
      };

      // If there's a pending avatar URL, include it in the update
      // Note: The avatar is already uploaded, we just need to update the profile reference
      // The backend should already have the avatar saved, so we don't need to send it again

      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(profileDataToSend),
        credentials: 'include',
      });

      if (response.status === 401) {
        // Token expired or invalid - redirect to login
        showToast(
          language === 'ar'
            ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
            : 'Session expired. Please login again',
          'error',
          3000
        );
        setIsSaving(false);
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        return;
      }

      if (response.ok) {
        const data = await response.json();

        // Update user in AuthProvider and localStorage
        if (data.success && data.data && data.data.profile) {
          const profileData = data.data.profile;

          // Update user object with new profile data
          if (user) {
            const updatedUser = {
              ...user,
              name: profileData.name,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              phone: profileData.phone,
              address: profileData.address,
              subscribedToNewsletter: profileData.subscribedToNewsletter,
              // Use pendingAvatarUrl if exists, otherwise use profileData.avatar
              avatar: pendingAvatarUrl || profileData.avatar || user.avatar
            };
            updateUser(updatedUser);
          }

          // Update local profile state
          const updatedProfile = {
            ...profile,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            phone: profileData.phone || '',
            address: profileData.address || null,
            subscribedToNewsletter: profileData.subscribedToNewsletter || false,
            // Update avatar from pendingAvatarUrl if exists, otherwise use profileData.avatar
            avatar: pendingAvatarUrl || profileData.avatar || profile.avatar,
          };
          setProfile(updatedProfile);
          setOriginalProfile(updatedProfile); // Update original values after successful save

          // Clear pending avatar URL after successful save
          if (pendingAvatarUrl) {
            setPendingAvatarUrl(null);
          }
        }

        showToast(
          language === 'ar' ? 'تم حفظ الملف الشخصي بنجاح' : 'Profile saved successfully',
          'success',
          3000
        );
        setIsEditing(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        // Profile update error
        showToast(
          language === 'ar'
            ? `حدث خطأ أثناء حفظ الملف الشخصي: ${errorData.error || errorData.details || 'خطأ غير معروف'}`
            : `Error saving profile: ${errorData.error || errorData.details || 'Unknown error'}`,
          'error',
          5000
        );
      }
    } catch (error) {
      // Error saving profile
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء حفظ الملف الشخصي' : 'Error saving profile',
        'error',
        3000
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(
        language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be less than 5MB',
        'error',
        3000
      );
      return;
    }

    // Additional client-side validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast(
        language === 'ar' ? 'نوع الملف غير مسموح. يرجى اختيار صورة (JPEG, PNG, WebP, GIF)' : 'Invalid file type. Please select an image (JPEG, PNG, WebP, GIF)',
        'error',
        3000
      );
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        setCropImage(imageUrl);
        // Use setTimeout to ensure state is set before showing cropper
        setTimeout(() => {
          setShowCropper(true);
        }, 50);
      } else {
        showToast(
          language === 'ar' ? 'فشل تحميل الصورة' : 'Failed to load image',
          'error',
          3000
        );
      }
    };
    reader.onerror = () => {
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء قراءة الصورة' : 'Error reading image',
        'error',
        3000
      );
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (!profile) return;

    // Don't close cropper until upload is successful
    setIsUploadingAvatar(true);
    try {
      // Get token from localStorage or cookies
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
        if (!token) {
          // Try to get from cookies
          const cookies = document.cookie;
          const tokenMatch = cookies.match(/token=([^;]+)/) || cookies.match(/__Host-token=([^;]+)/);
          if (tokenMatch && tokenMatch[1]) {
            token = decodeURIComponent(tokenMatch[1]);
          }
        }
      }

      if (!token) {
        showToast(
          language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first',
          'error',
          3000
        );
        setIsUploadingAvatar(false);
        return;
      }

      if (csrfLoading || !csrfToken) {
        showToast(
          language === 'ar' ? 'جاري تحميل رمز الأمان...' : 'Loading security token...',
          'info',
          2000
        );
        setIsUploadingAvatar(false);
        return;
      }

      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      formData.append('csrfToken', csrfToken);

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      };

      const uploadResponse = await fetch('/api/account/profile/avatar', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        const updatedAvatar = data.avatarUrl || data.avatar;

        // Store uploaded avatar URL temporarily (don't update profile yet)
        setPendingAvatarUrl(updatedAvatar);

        // Close cropper only after successful upload
        setShowCropper(false);
        setCropImage(null);

        showToast(
          language === 'ar' ? 'تم رفع الصورة بنجاح. اضغط على "حفظ" لحفظ التغييرات' : 'Image uploaded successfully. Click "Save" to save changes',
          'success',
          3000
        );
      } else {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));

        let errorMessage = language === 'ar' ? 'حدث خطأ أثناء رفع الصورة' : 'Error uploading avatar';
        if (uploadResponse.status === 401) {
          errorMessage = language === 'ar'
            ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
            : 'Session expired. Please login again';
        } else if (uploadResponse.status === 403) {
          errorMessage = language === 'ar'
            ? 'غير مصرح لك برفع الصورة. يرجى التحقق من صلاحياتك'
            : 'Forbidden: You are not authorized to upload avatar';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        showToast(
          errorMessage,
          'error',
          3000
        );
      }
    } catch (error) {
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء رفع الصورة' : 'Error uploading avatar',
        'error',
        3000
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropImage(null);
    // Don't clear pendingAvatarUrl here - let user decide to save or cancel in profile edit
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DAA520] mx-auto"></div>
          <p className="mt-4 text-gray-600" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...') : 'جاري تحميل الملف الشخصي...'}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <div className="text-center">
          <User className="mx-auto h-24 w-24 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900" suppressHydrationWarning>
            {mounted ? (language === 'ar' ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found') : 'لم يتم العثور على الملف الشخصي'}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </h1>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      // Restore original values when canceling
                      if (originalProfile) {
                        setProfile({ ...originalProfile });
                      }
                      // Clear pending avatar URL when canceling
                      setPendingAvatarUrl(null);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    // Save current values as original when starting to edit
                    if (profile) {
                      setOriginalProfile({ ...profile });
                    }
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-[#DAA520] rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {(pendingAvatarUrl || profile.avatar) ? (
                  <img
                    src={
                      (() => {
                        const avatarToShow = pendingAvatarUrl || profile.avatar;
                        if (!avatarToShow) return '';
                        // Use getImageSrc to handle both Base64 object and string URL
                        return getImageSrc(avatarToShow, '');
                      })()
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('span.initials-fallback')) {
                        const span = document.createElement('span');
                        span.textContent = getInitials(profile.firstName, profile.lastName);
                        span.className = 'initials-fallback w-full h-full flex items-center justify-center';
                        parent.appendChild(span);
                      }
                    }}
                    onLoad={(e) => {
                      // Remove any fallback spans when image loads successfully
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('span.initials-fallback');
                        if (fallback) {
                          fallback.remove();
                        }
                      }
                    }}
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center">
                    {getInitials(profile.firstName, profile.lastName)}
                  </span>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#DAA520] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#B8860B] transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 break-words overflow-wrap-anywhere">
                {escapeHtml(profile.firstName)} {escapeHtml(profile.lastName)}
              </h2>
              <p className="text-lg text-gray-600 mb-2 break-words overflow-wrap-anywhere">{escapeHtml(profile.email)}</p>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${profile.emailVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {profile.emailVerified
                    ? (language === 'ar' ? 'متحقق' : 'Verified')
                    : (language === 'ar' ? 'غير متحقق' : 'Unverified')
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'ar' ? 'تفاصيل الملف الشخصي' : 'Profile Details'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الاسم الأول' : 'First Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  maxLength={25}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg min-w-0">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 break-words overflow-wrap-anywhere min-w-0">{escapeHtml(profile.firstName)}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  maxLength={25}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg min-w-0">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 break-words overflow-wrap-anywhere min-w-0">{escapeHtml(profile.lastName)}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg min-w-0">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900 break-words overflow-wrap-anywhere min-w-0">{escapeHtml(profile.email)}</span>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="md:col-span-2" id="newsletter">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الاشتراك في النشرة الإخبارية' : 'Newsletter Subscription'}
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <Bell className={`w-5 h-5 ${profile.subscribedToNewsletter ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1 flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${profile.subscribedToNewsletter
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    {profile.subscribedToNewsletter
                      ? (language === 'ar' ? 'موافق على تلقي العروض والخصومات' : 'Subscribed to Offers & Discounts')
                      : (language === 'ar' ? 'غير موافق على تلقي العروض' : 'Not Subscribed')
                    }
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.subscribedToNewsletter || false}
                      onChange={async (e) => {
                        const newValue = e.target.checked;

                        // Update ref to track manual update
                        newsletterUpdateRef.current = newValue;

                        setProfile({
                          ...profile,
                          subscribedToNewsletter: newValue
                        });

                        // Auto-save newsletter subscription
                        try {
                          if (csrfLoading || !csrfToken) {
                            // CSRF token not available for newsletter update - no sensitive data logged
                            showToast(
                              language === 'ar'
                                ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
                                : 'Your session has expired. Please sign in again.',
                              'error',
                              3000
                            );
                            return;
                          }

                          // Get token from localStorage or cookies
                          let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                          if (!token && typeof window !== 'undefined') {
                            // Try to get from cookies as fallback
                            const cookies = document.cookie;
                            const tokenMatch = cookies.match(/token=([^;]+)/) || cookies.match(/__Host-token=([^;]+)/);
                            if (tokenMatch && tokenMatch[1]) {
                              token = decodeURIComponent(tokenMatch[1]);
                            }
                          }

                          // Newsletter toggle - no sensitive data logged

                          if (!token) {
                            showToast(
                              language === 'ar'
                                ? 'يرجى تسجيل الدخول أولاً'
                                : 'Please login first',
                              'error',
                              3000
                            );
                            // Revert toggle
                            newsletterUpdateRef.current = !newValue;
                            if (profile) {
                              setProfile({
                                ...profile,
                                subscribedToNewsletter: !newValue
                              });
                            }
                            return;
                          }

                          const headers: HeadersInit = {
                            'Content-Type': 'application/json',
                          };
                          if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                          }

                          const response = await fetch('/api/account/profile', {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({
                              subscribedToNewsletter: newValue,
                              csrfToken,
                            }),
                            credentials: 'include',
                          });

                          // Newsletter toggle response - no sensitive data logged

                          if (response.status === 401) {
                            // Token expired or invalid - redirect to login
                            showToast(
                              language === 'ar'
                                ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
                                : 'Session expired. Please login again',
                              'error',
                              3000
                            );
                            // Revert toggle
                            newsletterUpdateRef.current = !newValue;
                            if (profile) {
                              setProfile({
                                ...profile,
                                subscribedToNewsletter: !newValue
                              });
                            }
                            // Optionally redirect to login after a delay
                            setTimeout(() => {
                              window.location.href = '/auth/login';
                            }, 2000);
                            return;
                          }

                          if (response.ok) {
                            const data = await response.json();
                            if (data.user && user) {
                              const updatedUser = {
                                ...user,
                                ...data.user,
                                subscribedToNewsletter: data.user.subscribedToNewsletter !== undefined
                                  ? data.user.subscribedToNewsletter
                                  : newValue
                              };
                              updateUser(updatedUser);

                              // Update ref to match saved value
                              newsletterUpdateRef.current = updatedUser.subscribedToNewsletter || false;

                              // Update local profile state to match the updated user
                              if (profile) {
                                setProfile({
                                  ...profile,
                                  subscribedToNewsletter: updatedUser.subscribedToNewsletter || false
                                });
                              }
                            }
                            showToast(
                              language === 'ar'
                                ? newValue
                                  ? 'تم الاشتراك في النشرة الإخبارية بنجاح'
                                  : 'تم إلغاء الاشتراك من النشرة الإخبارية'
                                : newValue
                                  ? 'Successfully subscribed to newsletter'
                                  : 'Successfully unsubscribed from newsletter',
                              'success',
                              2000
                            );
                          } else {
                            // If API call failed, revert the toggle
                            newsletterUpdateRef.current = !newValue;
                            if (profile) {
                              setProfile({
                                ...profile,
                                subscribedToNewsletter: !newValue
                              });
                            }
                            const errorData = await response.json().catch(() => ({}));
                            showToast(
                              language === 'ar'
                                ? 'حدث خطأ أثناء تحديث الاشتراك'
                                : 'Error updating subscription',
                              'error',
                              3000
                            );
                          }
                        } catch (error) {
                          // Error updating newsletter subscription
                          // Revert on error
                          newsletterUpdateRef.current = !newValue;
                          if (profile) {
                            setProfile({
                              ...profile,
                              subscribedToNewsletter: !newValue
                            });
                          }
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#DAA520]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DAA520]"></div>
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 px-4">
                {language === 'ar'
                  ? 'يمكنك تفعيل أو إلغاء الاشتراك في أي وقت لتلقي العروض والخصومات عبر البريد الإلكتروني'
                  : 'You can subscribe or unsubscribe at any time to receive offers and discounts via email'
                }
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  maxLength={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{profile.phone ? escapeHtml(profile.phone) : (language === 'ar' ? 'غير محدد' : 'Not specified')}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'العنوان' : 'Address'}
              </label>
              {isEditing ? (
                <textarea
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent resize-none"
                />
              ) : (
                <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-lg min-w-0">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-900 break-words overflow-wrap-anywhere whitespace-pre-wrap min-w-0">
                    {profile.address ? escapeHtml(profile.address) : (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </span>
                </div>
              )}
            </div>

            {/* Member Since */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'عضو منذ' : 'Member Since'}
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Image Cropper Modal */}
      {showCropper && cropImage && (
        <ImageCropper
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </div>
  );
}
