'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/components/providers/CartProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { hasForbiddenChars, escapeHtml } from '@/lib/client-validation';
import { ArrowLeft, ChevronRight, Shield, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function CheckoutPage() {
  const { items, clearCart, removeFromCart, updateQuantity } = useCart();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { csrfToken } = useCSRF();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingPrice, setShippingPrice] = useState(50);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const couponJustApplied = useRef(false); // Track if coupon was just applied to avoid immediate revalidation

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert' | 'success' | 'info';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: '',
    shippingPaymentMethod: '', // طريقة دفع الشحن عند اختيار COD

    notes: '',
  });

  // Predefined list of Egyptian cities (English - Arabic)
  const egyptCities = [
    { value: 'cairo', en: 'Cairo', ar: 'القاهرة' },
    { value: 'giza', en: 'Giza', ar: 'الجيزة' },
    { value: 'alexandria', en: 'Alexandria', ar: 'الإسكندرية' },
    { value: 'sharqia', en: 'Sharqia', ar: 'الشرقية' },
    { value: 'dakahlia', en: 'Dakahlia', ar: 'الدقهلية' },
    { value: 'gharbia', en: 'Gharbia', ar: 'الغربية' },
    { value: 'monufia', en: 'Monufia', ar: 'المنوفية' },
    { value: 'kafr-elsheikh', en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
    { value: 'beheira', en: 'Beheira', ar: 'البحيرة' },
    { value: 'ismailia', en: 'Ismailia', ar: 'الإسماعيلية' },
    { value: 'suez', en: 'Suez', ar: 'السويس' },
    { value: 'port-said', en: 'Port Said', ar: 'بورسعيد' },
    { value: 'damietta', en: 'Damietta', ar: 'دمياط' },
    { value: 'fayoum', en: 'Fayoum', ar: 'الفيوم' },
    { value: 'bani-suef', en: 'Bani Suef', ar: 'بني سويف' },
    { value: 'minya', en: 'Minya', ar: 'المنيا' },
    { value: 'assiut', en: 'Assiut', ar: 'أسيوط' },
    { value: 'sohag', en: 'Sohag', ar: 'سوهاج' },
    { value: 'qena', en: 'Qena', ar: 'قنا' },
    { value: 'luxor', en: 'Luxor', ar: 'الأقصر' },
    { value: 'aswan', en: 'Aswan', ar: 'أسوان' },
    { value: 'red-sea', en: 'Red Sea', ar: 'البحر الأحمر' },
    { value: 'new-valley', en: 'New Valley', ar: 'الوادي الجديد' },
    { value: 'matrouh', en: 'Matrouh', ar: 'مطروح' },
    { value: 'north-sinai', en: 'North Sinai', ar: 'شمال سيناء' },
    { value: 'south-sinai', en: 'South Sinai', ar: 'جنوب سيناء' },
  ];

  useEffect(() => {
    fetchShippingPrice();
    fetchStoreSettings();

    // Fill form with user data when user is loaded
    if (user) {
      // Handle both name format (from backend) and firstName/lastName format
      let firstName = user.firstName || '';
      let lastName = user.lastName || '';

      // If firstName/lastName are missing but name exists, split it
      if ((!firstName || !lastName) && (user as any).name) {
        const nameParts = ((user as any).name || '').split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      setFormData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch('/api/settings/store');
      const data = await response.json();
      if (data.storeSettings) {
        setStoreSettings(data.storeSettings);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/checkout`);
    }
  }, [user, authLoading, router]);

  const fetchShippingPrice = async () => {
    try {
      const response = await fetch('/api/settings/store');
      const data = await response.json();
      if (data.storeSettings?.shippingPrice) {
        setShippingPrice(data.storeSettings.shippingPrice);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Helper functions for dialogs
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'alert' | 'success' | 'info' = 'alert',
    onClose?: () => void
  ) => {
    setDialogState({
      isOpen: true,
      type,
      title,
      message,
      confirmText: language === 'ar' ? 'حسناً' : 'OK',
      onConfirm: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        if (onClose) onClose();
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        if (onClose) onClose();
      },
    });
  };

  // Calculate totalPrice first (before useEffect that uses it)
  const totalPrice = items.reduce((total, item) => {
    const itemPrice = item.salePrice || item.price;
    return total + (itemPrice * item.quantity);
  }, 0);

  // Revalidate coupon when totalPrice or items change
  useEffect(() => {
    // Skip revalidation if coupon was just applied (to avoid unnecessary API call)
    if (couponJustApplied.current) {
      return;
    }

    if (appliedCoupon && totalPrice > 0) {
      // Re-validate coupon with new totalPrice
      const validateCouponWithNewTotal = async () => {
        try {
          const response = await fetch('/api/checkout/validate-coupon', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: appliedCoupon.code,
              orderAmount: totalPrice,
            }),
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            // Update coupon with new discount amount
            const couponWithDiscount = {
              ...data.coupon,
              discountAmount: data.discount || data.coupon?.discountAmount || 0
            };
            setAppliedCoupon(couponWithDiscount);
            setCouponError('');
          } else {
            // Coupon is no longer valid - remove it
            setAppliedCoupon(null);
            setCouponCode('');
            setCouponError(
              data.error || (language === 'ar'
                ? 'تم إزالة الكوبون لأنه لم يعد صالحاً'
                : 'Coupon removed because it is no longer valid')
            );
          }
        } catch (error) {
          // Don't remove coupon on error
        }
      };

      // Only revalidate if coupon code exists
      if (appliedCoupon.code) {
        // Add delay to debounce rapid changes (optimized for performance)
        const timeoutId = setTimeout(() => {
          validateCouponWithNewTotal();
        }, 1500); // Increased from 500ms to reduce API calls

        return () => clearTimeout(timeoutId);
      }
    } else if (appliedCoupon && totalPrice === 0) {
      // If cart is empty, remove coupon
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    }
  }, [totalPrice, items.length, appliedCoupon?.code, language]);
  const shipping = shippingPrice;
  const tax = 0; // تم إزالة الضرائب

  // Calculate coupon discount based on current totalPrice
  // This ensures discount is recalculated when totalPrice changes
  let couponDiscount = 0;
  if (appliedCoupon && totalPrice > 0) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      couponDiscount = (totalPrice * appliedCoupon.discountValue) / 100;
      // Apply maxDiscount limit if exists
      if (appliedCoupon.maxDiscount && couponDiscount > appliedCoupon.maxDiscount) {
        couponDiscount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.discountType === 'FIXED') {
      couponDiscount = appliedCoupon.discountValue;
    }
    // Don't allow discount to exceed total price
    couponDiscount = Math.min(couponDiscount, totalPrice);
  }

  const subtotalAfterDiscount = Math.max(0, totalPrice - couponDiscount);
  const prepaidTotal = shipping; // المبلغ المدفوع مسبقاً (الشحن فقط)
  const codAmount = subtotalAfterDiscount; // المبلغ المدفوع عند الاستلام (قيمة المنتجات بعد الخصم)

  const formatPrice = (price: number | null | undefined) => {
    // Handle invalid values (NaN, null, undefined)
    if (price === null || price === undefined || isNaN(Number(price))) {
      if (language === 'ar') {
        return 'ج.م 0';
      } else {
        return 'EGP 0';
      }
    }

    // Always use en-US locale for numbers to avoid Arabic numerals (١٠٠ instead of 100)
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(price));

    // Add currency symbol based on language
    if (language === 'ar') {
      return `ج.م ${formatted}`;
    } else {
      return `EGP ${formatted}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // SECURITY: Reject forbidden characters to prevent XSS
    if (hasForbiddenChars(value)) {
      const fieldName = language === 'ar'
        ? (name === 'firstName' ? 'الاسم الأول' : name === 'lastName' ? 'الاسم الأخير' : name === 'email' ? 'البريد الإلكتروني' : name === 'phone' ? 'رقم الهاتف' : name === 'address' ? 'العنوان' : name === 'city' ? 'المدينة' : name === 'notes' ? 'الملاحظات' : name)
        : (name === 'firstName' ? 'First Name' : name === 'lastName' ? 'Last Name' : name === 'email' ? 'Email' : name === 'phone' ? 'Phone' : name === 'address' ? 'Address' : name === 'city' ? 'City' : name === 'notes' ? 'Notes' : name);

      setErrors(prev => ({
        ...prev,
        [name]: language === 'ar'
          ? `حقل ${fieldName} يحتوي على أحرف غير مسموحة`
          : `${fieldName} contains invalid characters`
      }));
      return;
    }

    // For postal code, only allow numbers and limit to 5 digits
    if (name === 'postalCode') {
      const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters
      if (numericValue.length <= 5) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      // Clear error when user starts typing
      if (errors.postalCode) {
        setErrors(prev => ({ ...prev, postalCode: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(language === 'ar' ? 'يرجى إدخال كود الكوبون' : 'Please enter coupon code');
      return;
    }

    // SECURITY: Validate coupon code format
    if (hasForbiddenChars(couponCode)) {
      setCouponError(language === 'ar'
        ? 'كود الكوبون يحتوي على أحرف غير مسموحة'
        : 'Coupon code contains invalid characters');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          orderAmount: totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // Ensure discountAmount is included in coupon object
        const couponWithDiscount = {
          ...data.coupon,
          discountAmount: data.discount || data.coupon?.discountAmount || 0
        };
        setAppliedCoupon(couponWithDiscount);
        setCouponError('');
        // Mark that coupon was just applied to avoid immediate revalidation
        couponJustApplied.current = true;
        setTimeout(() => {
          couponJustApplied.current = false;
        }, 1000);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || (language === 'ar' ? 'كوبون غير صحيح' : 'Invalid coupon'));
      }
    } catch (error) {
      setCouponError(language === 'ar' ? 'حدث خطأ أثناء التحقق من الكوبون' : 'Error validating coupon');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    couponJustApplied.current = false;
  };

  const validatePostalCode = (): boolean => {
    const postalCode = formData.postalCode.trim();

    // Postal code is optional, but if provided, must be 5 digits
    if (!postalCode) {
      setErrors(prev => ({ ...prev, postalCode: '' }));
      return true; // Optional field, empty is valid
    }

    if (postalCode.length !== 5) {
      setErrors(prev => ({
        ...prev, postalCode: language === 'ar'
          ? 'الرمز البريدي يجب أن يكون 5 أرقام بالضبط'
          : 'Postal code must be exactly 5 digits'
      }));
      return false;
    }

    if (!/^\d+$/.test(postalCode)) {
      setErrors(prev => ({
        ...prev, postalCode: language === 'ar'
          ? 'الرمز البريدي يجب أن يتكون من أرقام فقط'
          : 'Postal code must contain only numbers'
      }));
      return false;
    }

    setErrors(prev => ({ ...prev, postalCode: '' }));
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev, paymentProof: language === 'ar'
          ? 'نوع الملف غير مسموح. فقط الصور (JPG, PNG, WEBP)'
          : 'Invalid file type. Only JPG, PNG, and WEBP images are allowed.'
      }));
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev, paymentProof: language === 'ar'
          ? 'حجم الملف يتجاوز 5 ميجابايت'
          : 'File size exceeds 5MB limit.'
      }));
      return;
    }

    setPaymentProofFile(file);
    setErrors(prev => ({ ...prev, paymentProof: '' }));

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleValidateAndProceedToShipping = async () => {
    // SECURITY: Validate all form fields before proceeding
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone'];
    const validationErrors: { [key: string]: string } = {};

    for (const field of fieldsToValidate) {
      const value = formData[field as keyof typeof formData];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        const fieldName = language === 'ar'
          ? (field === 'firstName' ? 'الاسم الأول' : field === 'lastName' ? 'الاسم الأخير' : field === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف')
          : (field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' : field === 'email' ? 'Email' : 'Phone');
        validationErrors[field] = language === 'ar'
          ? `حقل ${fieldName} مطلوب`
          : `${fieldName} is required`;
      } else if (hasForbiddenChars(value)) {
        const fieldName = language === 'ar'
          ? (field === 'firstName' ? 'الاسم الأول' : field === 'lastName' ? 'الاسم الأخير' : field === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف')
          : (field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' : field === 'email' ? 'Email' : 'Phone');
        validationErrors[field] = language === 'ar'
          ? `حقل ${fieldName} يحتوي على أحرف غير مسموحة`
          : `${fieldName} contains invalid characters`;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
      showAlert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar' ? 'يرجى إصلاح الأخطاء في النموذج' : 'Please fix errors in the form',
        'alert'
      );
      return;
    }

    try {
      // Stock validation doesn't require authentication - allow guest checkout
      // Try to get token if available, but don't require it
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header only if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Validate stock before proceeding (works for both authenticated and guest users)
      const validateResponse = await fetch('/api/checkout/validate-stock', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies (if available)
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
        }),
      });

      const validateData = await validateResponse.json().catch(() => ({
        valid: false,
        error: 'Failed to parse response',
        message: language === 'ar' ? 'حدث خطأ أثناء التحقق من المخزون' : 'An error occurred while validating stock'
      }));

      if (!validateResponse.ok) {
        showAlert(
          language === 'ar' ? 'المخزون غير متوفر' : 'Stock Unavailable',
          validateData.message || (language === 'ar' ? 'بعض المنتجات غير متوفرة بالمخزون المطلوب' : 'Some products are not available in the requested stock')
        );
        return;
      }

      if (!validateData.valid) {
        showAlert(
          language === 'ar' ? 'المخزون غير متوفر' : 'Stock Unavailable',
          validateData.message || (language === 'ar' ? 'بعض المنتجات غير متوفرة بالمخزون المطلوب' : 'Some products are not available in the requested stock')
        );
        return;
      }

      // Stock is valid, proceed to shipping
      setCurrentStep(2);
    } catch (error: any) {
      showAlert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'حدث خطأ أثناء التحقق من المخزون' : 'An error occurred while validating stock'
      );
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!paymentProofFile) {
      setErrors(prev => ({
        ...prev, paymentProof: language === 'ar'
          ? 'يرجى رفع صورة تأكيد الدفع'
          : 'Please upload payment proof image'
      }));
      return;
    }

    setIsUploadingProof(true);
    setErrors(prev => ({ ...prev, paymentProof: '' }));

    try {
      // SECURITY: Get token from multiple sources with fallback
      let token: string | null = null;

      // Try localStorage first
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      }

      // If not found, try cookies
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'token' || name === '__Host-token') {
            token = decodeURIComponent(value);
            break;
          }
        }
      }

      // If still not found, try user object from AuthProvider
      if (!token && user) {
        // Token might be stored in user object or we need to redirect to login
        router.push(`/auth/login?redirect=/checkout`);
        return;
      }

      if (!token) {
        throw new Error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      }

      const formData = new FormData();
      formData.append('file', paymentProofFile);

      const response = await fetch('/api/checkout/upload-payment-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken, // Add CSRF token to header
        },
        credentials: 'include', // Include cookies for authentication
        body: formData,
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          setErrors(prev => ({
            ...prev, paymentProof: language === 'ar'
              ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
              : 'Session expired. Please login again'
          }));
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push(`/auth/login?redirect=/checkout`);
          }, 2000);
          return;
        }

        throw new Error(data.error || (language === 'ar'
          ? 'فشل رفع الصورة'
          : 'Failed to upload image'
        ));
      }

      // Update URL with Base64 data URL for preview
      if (data.paymentProof && data.paymentProof.data && data.paymentProof.contentType) {
        const dataUrl = `data:${data.paymentProof.contentType};base64,${data.paymentProof.data}`;
        setPaymentProofUrl(dataUrl);
      } else if (data.data && data.contentType) {
        // Alternative response format
        const dataUrl = `data:${data.contentType};base64,${data.data}`;
        setPaymentProofUrl(dataUrl);
      } else if (data.url) {
        // Legacy URL format (fallback)
        setPaymentProofUrl(data.url);
      }

      // Proceed to review step
      setCurrentStep(5);
    } catch (error: any) {
      setErrors(prev => ({
        ...prev, paymentProof: error.message || (language === 'ar'
          ? 'حدث خطأ أثناء رفع الصورة'
          : 'An error occurred while uploading image'
        )
      }));
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleConfirmOrder = async () => {
    // SECURITY: Validate all form fields before submitting order
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'address', 'city'];
    const validationErrors: { [key: string]: string } = {};

    for (const field of fieldsToValidate) {
      const value = formData[field as keyof typeof formData];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        const fieldName = language === 'ar'
          ? (field === 'firstName' ? 'الاسم الأول' : field === 'lastName' ? 'الاسم الأخير' : field === 'email' ? 'البريد الإلكتروني' : field === 'phone' ? 'رقم الهاتف' : field === 'address' ? 'العنوان' : 'المدينة')
          : (field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' : field === 'email' ? 'Email' : field === 'phone' ? 'Phone' : field === 'address' ? 'Address' : 'City');
        validationErrors[field] = language === 'ar'
          ? `حقل ${fieldName} مطلوب`
          : `${fieldName} is required`;
      } else if (hasForbiddenChars(value)) {
        const fieldName = language === 'ar'
          ? (field === 'firstName' ? 'الاسم الأول' : field === 'lastName' ? 'الاسم الأخير' : field === 'email' ? 'البريد الإلكتروني' : field === 'phone' ? 'رقم الهاتف' : field === 'address' ? 'العنوان' : 'المدينة')
          : (field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' : field === 'email' ? 'Email' : field === 'phone' ? 'Phone' : field === 'address' ? 'Address' : 'City');
        validationErrors[field] = language === 'ar'
          ? `حقل ${fieldName} يحتوي على أحرف غير مسموحة`
          : `${fieldName} contains invalid characters`;
      }
    }

    // Validate notes if provided
    if (formData.notes && formData.notes.trim() !== '' && hasForbiddenChars(formData.notes)) {
      validationErrors.notes = language === 'ar'
        ? 'حقل الملاحظات يحتوي على أحرف غير مسموحة'
        : 'Notes field contains invalid characters';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
      showAlert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar' ? 'يرجى إصلاح الأخطاء في النموذج' : 'Please fix errors in the form',
        'alert'
      );
      return;
    }

    // Validate payment proof for prepaid methods (instapay/vodafone OR shipping payment for COD)
    const needsPaymentProof = (formData.paymentMethod === 'instapay' || formData.paymentMethod === 'vodafone') ||
      (formData.paymentMethod === 'cod' && (formData.shippingPaymentMethod === 'instapay' || formData.shippingPaymentMethod === 'vodafone'));

    if (needsPaymentProof && !paymentProofUrl) {
      showAlert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar'
          ? 'يرجى رفع صورة تأكيد الدفع أولاً'
          : 'Please upload payment proof first',
        'alert'
      );
      return;
    }

    if (!csrfToken) {
      showAlert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar'
          ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
          : 'Your session has expired. Please sign in again.',
        'alert'
      );
      return;
    }

    setIsConfirmingOrder(true);

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0];
      if (!token) {
        throw new Error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      }

      // Prepare order data
      // For COD, the shipping payment method should be sent instead of payment method
      const finalPaymentMethod = formData.paymentMethod === 'cod'
        ? formData.shippingPaymentMethod
        : formData.paymentMethod;

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
        })),
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        paymentMethod: formData.paymentMethod, // Keep original payment method (cod/instapay/vodafone)
        shippingPaymentMethod: formData.paymentMethod === 'cod' ? formData.shippingPaymentMethod : null, // Shipping payment for COD only
        paymentProofUrl: paymentProofUrl || null,
        shippingPrice: shippingPrice,
        prepaidAmount: formData.paymentMethod === 'cod' ? prepaidTotal : (subtotalAfterDiscount + shipping), // For COD, only shipping is prepaid
        codAmount: formData.paymentMethod === 'cod' ? codAmount : 0, // COD amount only if COD selected
        notes: formData.notes || null,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount || null,
      };

      // Create order
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // Add CSRF token to header
        },
        body: JSON.stringify({
          ...orderData,
          csrfToken: csrfToken, // Also add CSRF token in body for compatibility
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a stock issue
        const isStockIssue = response.status === 400 && (
          data.message?.includes('out of stock') ||
          data.message?.includes('Insufficient stock') ||
          data.error?.includes('stock')
        );

        const errorMessage = data.message || data.details || data.error || (language === 'ar'
          ? 'فشل إنشاء الطلب'
          : 'Failed to create order'
        );

        // Show specific error for stock issues
        if (isStockIssue) {
          setDialogState({
            isOpen: true,
            type: 'alert',
            title: language === 'ar' ? 'المخزون غير متوفر' : 'Stock Unavailable',
            message: errorMessage + (language === 'ar' ? '\n\nيرجى تحديث السلة وإعادة المحاولة.' : '\n\nPlease update your cart and try again.'),
            confirmText: language === 'ar' ? 'العودة للسلة' : 'Back to Cart',
            onConfirm: () => {
              setDialogState(prev => ({ ...prev, isOpen: false }));
              router.push('/cart');
            },
          });
          setIsConfirmingOrder(false);
          return;
        }

        throw new Error(errorMessage);
      }

      // Success - clear cart and show success message then redirect
      clearCart();

      // Show professional success message
      setDialogState({
        isOpen: true,
        type: 'success',
        title: language === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed',
        message: language === 'ar'
          ? 'تم تأكيد طلبك بنجاح. شكراً لك!'
          : 'Your order has been confirmed successfully. Thank you!',
        confirmText: language === 'ar' ? 'عرض الطلبات' : 'View Orders',
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          router.push('/account/orders');
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          router.push('/account/orders');
        },
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        router.push('/account/orders');
      }, 3000);

    } catch (error: any) {
      // Parse error message
      let errorMessage = error.message || (language === 'ar'
        ? 'حدث خطأ أثناء تأكيد الطلب'
        : 'An error occurred while confirming order'
      );

      // Handle specific error types
      if (errorMessage.includes('Insufficient stock') || errorMessage.includes('stock')) {
        errorMessage = language === 'ar'
          ? 'عذراً، المخزون غير متاح بالكمية المطلوبة. يرجى مراجعة المنتجات في السلة وتقليل الكميات.'
          : 'Sorry, insufficient stock available. Please review items in your cart and reduce quantities.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('inactive')) {
        errorMessage = language === 'ar'
          ? 'عذراً، أحد المنتجات غير متاح حالياً. يرجى تحديث السلة.'
          : 'Sorry, one or more products are not available. Please update your cart.';
      }

      showAlert(
        language === 'ar' ? 'خطأ في الطلب' : 'Order Error',
        errorMessage,
        'alert'
      );
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  const canProceed = formData.firstName && formData.lastName && formData.email && formData.phone;

  // Show loading state while checking authentication
  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'سلة المشتريات فارغة' : 'Your cart is empty'}
          </h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#9333EA] text-white px-6 py-3 rounded-md font-medium hover:bg-[#7c3aed] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
          </Link>
        </div>
        {/* Ensure success dialog still appears even when cart is empty after confirming order */}
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          type={dialogState.type}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          onConfirm={dialogState.onConfirm || (() => { })}
          onCancel={dialogState.onCancel || (() => { })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">
              {language === 'ar' ? 'الدفع' : 'Checkout'}
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            {language === 'ar' ? 'الدفع' : 'Checkout'}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center mb-12">
          {[
            { step: 1, name: language === 'ar' ? 'المعلومات' : 'Information' },
            { step: 2, name: language === 'ar' ? 'الشحن' : 'Shipping' },
            { step: 3, name: language === 'ar' ? 'الدفع' : 'Payment' },
            { step: 4, name: language === 'ar' ? 'تأكيد الدفع' : 'Payment Proof' },
            { step: 5, name: language === 'ar' ? 'المراجعة' : 'Review' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className="text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${item.step === currentStep ? 'bg-[#9333EA] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {item.step}
                </div>
                <div className="text-xs mt-2 text-gray-600">{item.name}</div>
              </div>
              {index < 4 && <div className="w-16 h-0.5 mx-4 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Cart Items Section - Editable Cart (Only before step 3) */}
        {currentStep < 3 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {language === 'ar' ? 'المنتجات في السلة' : 'Cart Items'}
              </h2>
              <Link
                href="/products"
                className="text-sm text-[#9333EA] hover:text-[#7c3aed] font-medium flex items-center gap-1"
              >
                {language === 'ar' ? 'تسوق المزيد' : 'Shop More'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {language === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-[#9333EA] text-white px-6 py-3 rounded-md font-medium hover:bg-[#7c3aed] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const displayPrice = item.salePrice || item.price;
                  const itemTotal = displayPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#9333EA] transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={language === 'ar' ? item.nameAr : item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                          {language === 'ar' ? item.nameAr : item.name}
                        </h3>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-500">
                            {language === 'ar' ? 'المقاس: ' : 'Size: '}
                            {item.selectedSize}
                          </p>
                        )}
                        {item.selectedColor && (
                          <p className="text-sm text-gray-500">
                            {language === 'ar' ? 'اللون: ' : 'Color: '}
                            {item.selectedColor}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-[#9333EA] mt-1">
                          {formatPrice(displayPrice)} {language === 'ar' ? 'للقطعة' : 'each'}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              showConfirm(
                                language === 'ar' ? 'تأكيد الحذف' : 'Confirm Removal',
                                language === 'ar'
                                  ? 'هل تريد حذف هذا المنتج من السلة؟'
                                  : 'Remove this item from cart?',
                                () => removeFromCart(item.id),
                                language === 'ar' ? 'حذف' : 'Remove',
                                language === 'ar' ? 'إلغاء' : 'Cancel'
                              );
                            }
                          }}
                          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                          aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="w-12 text-center font-medium text-gray-900">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={async () => {
                            // Note: We can't check stock here without fetching product data
                            // So we'll allow the increase and let the API validate on checkout
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                          aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => {
                          showConfirm(
                            language === 'ar' ? 'تأكيد الحذف' : 'Confirm Removal',
                            language === 'ar'
                              ? 'هل تريد حذف هذا المنتج من السلة؟'
                              : 'Remove this item from cart?',
                            () => removeFromCart(item.id),
                            language === 'ar' ? 'حذف' : 'Remove',
                            language === 'ar' ? 'إلغاء' : 'Cancel'
                          );
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label={language === 'ar' ? 'حذف المنتج' : 'Remove item'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}

                {/* Cart Summary */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">
                      {language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        {language === 'ar' ? 'الخصم:' : 'Discount:'}
                      </span>
                      <span className="font-semibold text-green-600">
                        -{formatPrice(couponDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">
                      {language === 'ar' ? 'الشحن:' : 'Shipping:'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(shippingPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-bold text-gray-900">
                      {language === 'ar' ? 'الإجمالي:' : 'Total:'}
                    </span>
                    <span className="text-lg font-bold text-[#9333EA]">
                      {formatPrice(subtotalAfterDiscount + shippingPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {language === 'ar' ? 'الرجاء إدخال معلومات الاتصال الخاصة بك' : 'Please enter your contact details'}
              </p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-first-name" className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الاسم الأول' : 'First Name'} *
                    </label>
                    <input
                      id="checkout-first-name"
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder={language === 'ar' ? 'الاسم الأول' : 'Your First Name'}
                      maxLength={50}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA]"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-last-name" className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الاسم الأخير' : 'Last Name'} *
                    </label>
                    <input
                      id="checkout-last-name"
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder={language === 'ar' ? 'الاسم الأخير' : 'Your Last Name'}
                      maxLength={50}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA]"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label htmlFor="checkout-notes" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (optional)'}
                  </label>
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'اكتب أي تفاصيل إضافية للطلب أو المنتج (اختياري)' : 'Any extra details for the order or product (optional)'}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA]"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Your Email'}
                    maxLength={254}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA]"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'رقم الهاتف' : 'Your Phone Number'}
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleValidateAndProceedToShipping}
                  disabled={!canProceed}
                  className="w-full bg-[#9333EA] text-white py-3 px-4 rounded-md font-medium hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'ar' ? 'المتابعة إلى الشحن' : 'Continue to Shipping'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-6">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{language === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{language === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                    <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-[#9333EA]">{formatPrice(subtotalAfterDiscount + shipping)}</span>
                  {formData.paymentMethod === 'cod' && (
                    <div className="mt-2 text-xs text-gray-500">
                      {language === 'ar' ? `+ ${formatPrice(codAmount)} عند الاستلام` : `+ ${formatPrice(codAmount)} at delivery`}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-green-600">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Secure Checkout</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'معلومات الشحن' : 'Shipping Information'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {language === 'ar' ? 'الرجاء إدخال عنوان الشحن الخاص بك' : 'Please enter your shipping address'}
              </p>

              <form className="space-y-6">
                <div>
                  <label htmlFor="checkout-address" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'العنوان الكامل' : 'Full Address'} *
                  </label>
                  <textarea
                    id="checkout-address"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'العنوان الكامل' : 'Your Full Address'}
                    rows={3}
                    maxLength={300}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-city" className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'المدينة' : 'City'} *
                    </label>
                    <select
                      id="checkout-city"
                      name="city"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] bg-white"
                    >
                      <option value="">
                        {language === 'ar' ? 'اختر المدينة' : 'Select your city'}
                      </option>
                      {egyptCities.map((city) => (
                        <option key={city.value} value={`${city.en} - ${city.ar}`}>
                          {city.en} - {city.ar}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="checkout-postal-code" className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
                      <span className="text-xs text-gray-500 ml-2">
                        ({language === 'ar' ? 'اختياري - 5 أرقام' : 'Optional - 5 digits'})
                      </span>
                    </label>
                    <input
                      id="checkout-postal-code"
                      type="text"
                      name="postalCode"
                      autoComplete="postal-code"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      onBlur={validatePostalCode}
                      placeholder={language === 'ar' ? 'مثال: 12345' : 'Example: 12345'}
                      pattern="\d{5}"
                      maxLength={5}
                      inputMode="numeric"
                      className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-[#9333EA] ${errors.postalCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-300"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validatePostalCode() && formData.address && formData.city) {
                        setCurrentStep(3);
                      }
                    }}
                    disabled={!formData.address || !formData.city || !!errors.postalCode}
                    className="flex-1 bg-[#9333EA] text-white py-3 px-4 rounded-md font-medium hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'ar' ? 'المتابعة إلى الدفع' : 'Continue to Payment'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-6">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{language === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{language === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                    <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-[#9333EA]">{formatPrice(subtotalAfterDiscount + shipping)}</span>
                  {formData.paymentMethod === 'cod' && (
                    <div className="mt-2 text-xs text-gray-500">
                      {language === 'ar' ? `+ ${formatPrice(codAmount)} عند الاستلام` : `+ ${formatPrice(codAmount)} at delivery`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {language === 'ar' ? 'اختر طريقة الدفع:' : 'Choose payment method:'}
              </p>

              <form className="space-y-6">
                {/* Coupon Code Section */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {language === 'ar' ? 'كوبون الخصم' : 'Discount Coupon'}
                  </h3>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          // SECURITY: Reject forbidden characters to prevent XSS
                          if (hasForbiddenChars(value)) {
                            setCouponError(language === 'ar'
                              ? 'كود الكوبون يحتوي على أحرف غير مسموحة'
                              : 'Coupon code contains invalid characters');
                            return;
                          }
                          setCouponCode(value);
                          setCouponError('');
                        }}
                        placeholder={language === 'ar' ? 'أدخل كود الكوبون' : 'Enter coupon code'}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="px-6 py-3 bg-[#9333EA] text-white rounded-md font-medium hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isValidatingCoupon
                          ? (language === 'ar' ? 'جاري التحقق...' : 'Validating...')
                          : (language === 'ar' ? 'تطبيق' : 'Apply')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <div className="font-semibold text-green-900">
                          {escapeHtml(appliedCoupon.code)} - {language === 'ar' ? 'تم التطبيق بنجاح' : 'Applied Successfully'}
                        </div>
                        <div className="text-sm text-green-700">
                          {language === 'ar' ? 'خصم:' : 'Discount:'} {appliedCoupon.discountType === 'PERCENTAGE'
                            ? `${appliedCoupon.discountValue}%`
                            : formatPrice(appliedCoupon.discountValue)}
                          {' '} ({formatPrice(couponDiscount)})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        {language === 'ar' ? 'إزالة' : 'Remove'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-2 text-sm text-red-600">{couponError}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* InstaPay Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-[#9333EA] cursor-pointer">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="instapay"
                        checked={formData.paymentMethod === 'instapay'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">InstaPay</div>
                        <div className="text-sm text-gray-500">
                          {language === 'ar' ? 'الدفع الكامل عبر إنستا باي' : 'Full payment with InstaPay'}
                        </div>
                        <div className="text-sm font-semibold text-orange-600 mt-1">
                          {formatPrice(subtotalAfterDiscount + shipping)}
                        </div>
                        <div className="mt-1 text-gray-700 space-y-1">
                          <div>
                            <span className="text-sm text-gray-500 mr-1">
                              {language === 'ar' ? 'الدفع إلى:' : 'Pay to:'}
                            </span>
                            <span className="text-sm md:text-base font-bold tracking-wide">
                              {storeSettings?.instaPayNumber || ''}
                            </span>
                          </div>
                          {storeSettings?.instaPayAccountName && (
                            <div>
                              <span className="text-sm text-gray-500 mr-1">
                                {language === 'ar' ? 'اسم الحساب:' : 'Account Name:'}
                              </span>
                              <span className="text-sm md:text-base text-gray-600">
                                {storeSettings.instaPayAccountName}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Shipping Account Details */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">
                            {language === 'ar' ? 'تفاصيل حساب الشحن:' : 'Shipping Account Details:'}
                          </p>
                          <div className="text-gray-700 space-y-1">
                            <div>
                              <span className="text-sm text-gray-500 mr-1">
                                {language === 'ar' ? 'الدفع إلى:' : 'Pay to:'}
                              </span>
                              <span className="text-sm md:text-base font-bold tracking-wide">
                                {storeSettings?.instaPayNumber || ''}
                              </span>
                            </div>
                            {storeSettings?.instaPayAccountName && (
                              <div>
                                <span className="text-sm text-gray-500 mr-1">
                                  {language === 'ar' ? 'اسم الحساب:' : 'Account Name:'}
                                </span>
                                <span className="text-sm md:text-base text-gray-600">
                                  {storeSettings.instaPayAccountName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                    {/* No customer InstaPay number input required */}
                  </div>

                  {/* Vodafone Cash Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-[#9333EA] cursor-pointer">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="vodafone"
                        checked={formData.paymentMethod === 'vodafone'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Vodafone Cash</div>
                        <div className="text-sm text-gray-500">
                          {language === 'ar' ? 'الدفع الكامل عبر فودافون كاش' : 'Full payment with Vodafone Cash'}
                        </div>
                        <div className="text-sm font-semibold text-orange-600 mt-1">
                          {formatPrice(subtotalAfterDiscount + shipping)}
                        </div>
                        <div className="mt-1 text-gray-700 space-y-1">
                          <div>
                            <span className="text-sm text-gray-500 mr-1">
                              {language === 'ar' ? 'الدفع إلى:' : 'Pay to:'}
                            </span>
                            <span className="text-sm md:text-base font-bold tracking-wide">
                              {storeSettings?.vodafoneNumber || ''}
                            </span>
                          </div>
                        </div>
                        {/* Shipping Account Details */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">
                            {language === 'ar' ? 'تفاصيل حساب الشحن:' : 'Shipping Account Details:'}
                          </p>
                          <div className="text-gray-700 space-y-1">
                            <div>
                              <span className="text-sm text-gray-500 mr-1">
                                {language === 'ar' ? 'الدفع إلى:' : 'Pay to:'}
                              </span>
                              <span className="text-sm md:text-base font-bold tracking-wide">
                                {storeSettings?.vodafoneNumber || ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                    {/* No customer Vodafone number input required */}
                  </div>

                  {/* Cash on Delivery - InstaPay Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-[#9333EA] cursor-pointer">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod_instapay"
                        checked={formData.paymentMethod === 'cod' && formData.shippingPaymentMethod === 'instapay'}
                        onChange={() => {
                          setFormData({
                            ...formData,
                            paymentMethod: 'cod',
                            shippingPaymentMethod: 'instapay'
                          });
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {language === 'ar' ? 'الدفع عند الاستلام (إنستا باي)' : 'Cash on Delivery (InstaPay)'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'ar'
                            ? 'دفع قيمة المنتجات نقداً عند الاستلام + دفع مصاريف الشحن عبر إنستا باي'
                            : 'Pay product amount in cash upon delivery + pay shipping via InstaPay'}
                        </div>
                        <div className="text-sm font-semibold text-orange-600 mt-1">
                          {language === 'ar'
                            ? `${formatPrice(subtotalAfterDiscount)} عند الاستلام + ${formatPrice(shipping)} عبر إنستا باي`
                            : `${formatPrice(subtotalAfterDiscount)} at delivery + ${formatPrice(shipping)} via InstaPay`}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">
                            {language === 'ar' ? 'مصاريف الشحن - الدفع إلى:' : 'Shipping Cost - Pay to:'}
                          </p>
                          <div className="text-gray-700 space-y-1">
                            <div>
                              <span className="text-sm font-bold tracking-wide">
                                {storeSettings?.instaPayNumber || ''}
                              </span>
                            </div>
                            {storeSettings?.instaPayAccountName && (
                              <div>
                                <span className="text-sm text-gray-600">
                                  {storeSettings.instaPayAccountName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Cash on Delivery - Vodafone Cash Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-[#9333EA] cursor-pointer">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod_vodafone"
                        checked={formData.paymentMethod === 'cod' && formData.shippingPaymentMethod === 'vodafone'}
                        onChange={() => {
                          setFormData({
                            ...formData,
                            paymentMethod: 'cod',
                            shippingPaymentMethod: 'vodafone'
                          });
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {language === 'ar' ? 'الدفع عند الاستلام (فودافون كاش)' : 'Cash on Delivery (Vodafone Cash)'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'ar'
                            ? 'دفع قيمة المنتجات نقداً عند الاستلام + دفع مصاريف الشحن عبر فودافون كاش'
                            : 'Pay product amount in cash upon delivery + pay shipping via Vodafone Cash'}
                        </div>
                        <div className="text-sm font-semibold text-orange-600 mt-1">
                          {language === 'ar'
                            ? `${formatPrice(subtotalAfterDiscount)} عند الاستلام + ${formatPrice(shipping)} عبر فودافون كاش`
                            : `${formatPrice(subtotalAfterDiscount)} at delivery + ${formatPrice(shipping)} via Vodafone Cash`}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">
                            {language === 'ar' ? 'مصاريف الشحن - الدفع إلى:' : 'Shipping Cost - Pay to:'}
                          </p>
                          <div className="text-gray-700">
                            <span className="text-sm font-bold tracking-wide">
                              {storeSettings?.vodafoneNumber || 'غير محدد'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Regular Payment Info */}
                {formData.paymentMethod !== 'cod' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      {language === 'ar' ? 'معلومات الدفع:' : 'Payment Information:'}
                    </p>
                    <p className="text-sm text-blue-800">
                      {language === 'ar'
                        ? `المبلغ الإجمالي: ${formatPrice(subtotalAfterDiscount + shipping)}`
                        : `Total Amount: ${formatPrice(subtotalAfterDiscount + shipping)}`}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-300"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Validate payment method selection
                      if (!formData.paymentMethod) {
                        showAlert(
                          language === 'ar' ? 'تنبيه' : 'Warning',
                          language === 'ar'
                            ? 'يرجى اختيار طريقة الدفع'
                            : 'Please select payment method',
                          'alert'
                        );
                        return;
                      }
                      // For COD, ensure shipping payment method is selected
                      if (formData.paymentMethod === 'cod' && !formData.shippingPaymentMethod) {
                        showAlert(
                          language === 'ar' ? 'تنبيه' : 'Warning',
                          language === 'ar'
                            ? 'يرجى اختيار طريقة الدفع لمصاريف الشحن'
                            : 'Please select payment method for shipping costs',
                          'alert'
                        );
                        return;
                      }
                      setCurrentStep(4);
                    }}
                    disabled={
                      !formData.paymentMethod ||
                      (formData.paymentMethod === 'cod' && !formData.shippingPaymentMethod)
                    }
                    className="flex-1 bg-[#9333EA] text-white py-3 px-4 rounded-md font-medium hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'ar' ? 'المتابعة' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-6">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{language === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{language === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                    <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-[#9333EA]">{formatPrice(subtotalAfterDiscount + shipping)}</span>
                  {formData.paymentMethod === 'cod' && (
                    <div className="mt-2 text-xs text-gray-500">
                      {language === 'ar' ? `+ ${formatPrice(codAmount)} عند الاستلام` : `+ ${formatPrice(codAmount)} at delivery`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'تأكيد الدفع' : 'Payment Proof'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {formData.paymentMethod === 'cod'
                  ? (language === 'ar'
                    ? 'يرجى رفع صورة إيصال دفع مصاريف الشحن'
                    : 'Please upload payment receipt for shipping costs')
                  : (language === 'ar'
                    ? 'يرجى رفع صورة إيصال الدفع أو لقطة شاشة من المعاملة المصرفية'
                    : 'Please upload payment receipt or screenshot of the bank transaction')}
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'صورة تأكيد الدفع' : 'Payment Proof Image'} *
                    <span className="text-xs text-gray-500 ml-2">
                      ({language === 'ar' ? 'JPG, PNG, WEBP - حد أقصى 5 ميجابايت' : 'JPG, PNG, WEBP - Max 5MB'})
                    </span>
                  </label>

                  {!paymentProofUrl && (
                    <div className="mt-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-[#9333EA] file:text-white
                          hover:file:bg-[#7c3aed] file:cursor-pointer
                          file:transition-colors"
                      />
                      {errors.paymentProof && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentProof}</p>
                      )}
                    </div>
                  )}

                  {paymentProofUrl && (
                    <div className="mt-4 space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={paymentProofUrl}
                          alt={language === 'ar' ? 'صورة تأكيد الدفع' : 'Payment proof'}
                          className="max-w-full h-auto max-h-96 rounded-lg border border-gray-300 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProofFile(null);
                            setPaymentProofUrl('');
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                          title={language === 'ar' ? 'إزالة الصورة' : 'Remove image'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {language === 'ar' ? 'مهم!' : 'Important!'}
                  </p>
                  <p className="text-sm text-blue-800">
                    {language === 'ar'
                      ? 'تأكد من أن الصورة واضحة وتظهر رقم المعاملة أو تفاصيل الدفع'
                      : 'Make sure the image is clear and shows the transaction number or payment details'}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-300"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadPaymentProof}
                    disabled={!paymentProofFile || isUploadingProof}
                    className="flex-1 bg-[#9333EA] text-white py-3 px-4 rounded-md font-medium hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploadingProof ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                      </>
                    ) : (
                      language === 'ar' ? 'رفع والمراجعة' : 'Upload & Review'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-6">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{language === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{language === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                    <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-[#9333EA]">{formatPrice(subtotalAfterDiscount + shipping)}</span>
                  {formData.paymentMethod === 'cod' && (
                    <div className="mt-2 text-xs text-gray-500">
                      {language === 'ar' ? `+ ${formatPrice(codAmount)} عند الاستلام` : `+ ${formatPrice(codAmount)} at delivery`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'مراجعة الطلب' : 'Review Order'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {language === 'ar' ? 'تأكد من صحة جميع المعلومات قبل تأكيد الطلب' : 'Please review all information before confirming your order'}
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> {formData.email}</p>
                    <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {formData.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="break-words whitespace-pre-wrap">
                      <strong>{language === 'ar' ? 'العنوان:' : 'Address:'}</strong>{' '}
                      {formData.address}
                    </p>
                    <p><strong>{language === 'ar' ? 'المدينة:' : 'City:'}</strong> {formData.city}</p>
                    <p><strong>{language === 'ar' ? 'الرمز البريدي:' : 'Postal Code:'}</strong> {formData.postalCode}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    {formData.paymentMethod === 'instapay' && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">
                          {language === 'ar' ? 'إنستا باي' : 'InstaPay'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {language === 'ar' ? 'الدفع الكامل' : 'Full Payment'}
                        </p>
                        <p className="text-sm font-semibold text-orange-600 mt-1">
                          {formatPrice(subtotalAfterDiscount + shipping)}
                        </p>
                      </div>
                    )}
                    {formData.paymentMethod === 'vodafone' && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">
                          {language === 'ar' ? 'فودافون كاش' : 'Vodafone Cash'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {language === 'ar' ? 'الدفع الكامل' : 'Full Payment'}
                        </p>
                        <p className="text-sm font-semibold text-orange-600 mt-1">
                          {formatPrice(subtotalAfterDiscount + shipping)}
                        </p>
                      </div>
                    )}
                    {formData.paymentMethod === 'cod' && (
                      <div>
                        <p className="font-semibold">
                          {language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {language === 'ar'
                            ? `مصاريف الشحن مدفوعة عبر ${formData.shippingPaymentMethod === 'instapay' ? 'إنستا باي' : 'فودافون كاش'}`
                            : `Shipping paid via ${formData.shippingPaymentMethod === 'instapay' ? 'InstaPay' : 'Vodafone Cash'}`}
                        </p>
                        {/* No InstaPay number shown */}
                        {/* No Vodafone Cash number shown */}
                        <p className="text-sm text-gray-600 mt-3">
                          <strong>{language === 'ar' ? 'مصاريف الشحن (مدفوعة مسبقاً):' : 'Shipping Cost (Prepaid):'}</strong> {formatPrice(shipping)}
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                          <strong>{language === 'ar' ? 'المبلغ المدفوع عند الاستلام:' : 'Cash on Delivery Amount:'}</strong> {formatPrice(codAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {paymentProofUrl && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      {language === 'ar' ? 'صورة تأكيد الدفع' : 'Payment Proof'}
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <img
                        src={paymentProofUrl}
                        alt={language === 'ar' ? 'صورة تأكيد الدفع' : 'Payment proof'}
                        className="max-w-full h-auto max-h-48 rounded-lg border border-gray-300"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-300"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={isConfirmingOrder}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isConfirmingOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {language === 'ar' ? 'جاري التأكيد...' : 'Confirming...'}
                      </>
                    ) : (
                      language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-6">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{language === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{language === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                    <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-[#9333EA]">{formatPrice(subtotalAfterDiscount + shipping)}</span>
                  {formData.paymentMethod === 'cod' && (
                    <div className="mt-2 text-xs text-gray-500">
                      {language === 'ar' ? `+ ${formatPrice(codAmount)} عند الاستلام` : `+ ${formatPrice(codAmount)} at delivery`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm || (() => { })}
        onCancel={dialogState.onCancel || (() => { })}
      />
    </div>
  );
}
