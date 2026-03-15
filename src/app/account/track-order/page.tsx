'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

interface TrackingInfo {
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  currentLocation?: string;
  currentLocationAr?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  timeline: Array<{
    status: string;
    description: string;
    descriptionAr: string;
    timestamp: string;
    completed: boolean;
  }>;
}

function TrackOrderContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+201000000000');

  // Fetch WhatsApp number
  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      try {
        const response = await fetch('/api/settings/whatsapp');
        if (response.ok) {
          const data = await response.json();
          setWhatsappNumber(data.whatsappNumber || '+201000000000');
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
      }
    };
    fetchWhatsappNumber();
  }, []);

  // Initialize from URL parameters
  useEffect(() => {
    const tracking = searchParams.get('tracking');
    const order = searchParams.get('order');
    if (tracking) {
      setTrackingNumber(tracking);
    }
    if (order) {
      setOrderNumber(order);
    }
    // Auto-track if parameters are provided
    if (tracking || order) {
      // Small delay to ensure state is set, then call handleTrack
      const timeoutId = setTimeout(() => {
        // Use the values directly from URL params
        const finalTracking = tracking || '';
        const finalOrder = order || '';

        if (finalTracking || finalOrder) {
          setIsLoading(true);
          setError('');

          // Get token if available
          const token = typeof window !== 'undefined'
            ? (localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0] || document.cookie.split('__Host-token=')[1]?.split(';')[0])
            : null;

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          // Build query parameters - ensure we only add string values
          const params = new URLSearchParams();
          if (finalTracking && typeof finalTracking === 'string') {
            params.set('tracking', finalTracking);
          }
          if (finalOrder && typeof finalOrder === 'string') {
            params.set('order', finalOrder);
          }

          // Call API to get real tracking data
          fetch(`/api/account/track-order?${params.toString()}`, {
            method: 'GET',
            headers,
            credentials: 'include',
          })
            .then(async (response) => {
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                if (response.status === 404) {
                  setError(language === 'ar' ? 'الطلب غير موجود' : 'Order not found');
                } else {
                  setError(errorData.error || (language === 'ar' ? 'حدث خطأ أثناء البحث عن الطلب' : 'Error occurred while searching for order'));
                }
                setTrackingInfo(null);
                return;
              }
              const data = await response.json();
              setTrackingInfo(data);
            })
            .catch((error) => {
              console.error('Error tracking order:', error);
              setError(language === 'ar' ? 'حدث خطأ أثناء البحث عن الطلب' : 'Error occurred while searching for order');
              setTrackingInfo(null);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [searchParams, language]);

  const handleTrack = async (overrideTracking?: string, overrideOrder?: string) => {
    // Use override values if provided, otherwise use state values
    // Ensure values are strings - if objects are passed, ignore them and use state values
    let trackingValue: string = '';
    if (overrideTracking !== undefined && overrideTracking !== null) {
      if (typeof overrideTracking === 'string') {
        trackingValue = overrideTracking;
      } else if (typeof overrideTracking === 'object') {
        // If an object is passed, try to extract a meaningful value
        const obj = overrideTracking as any;
        if (typeof obj.value === 'string') {
          trackingValue = obj.value;
        } else if (typeof obj.trackingNumber === 'string') {
          trackingValue = obj.trackingNumber;
        }
        // If we can't extract a value, trackingValue remains empty and will use state
      }
    }

    let orderValue: string = '';
    if (overrideOrder !== undefined && overrideOrder !== null) {
      if (typeof overrideOrder === 'string') {
        orderValue = overrideOrder;
      } else if (typeof overrideOrder === 'object') {
        // If an object is passed, try to extract a meaningful value
        const obj = overrideOrder as any;
        if (typeof obj.value === 'string') {
          orderValue = obj.value;
        } else if (typeof obj.orderNumber === 'string') {
          orderValue = obj.orderNumber;
        } else if (typeof obj.orderReference === 'string') {
          orderValue = obj.orderReference;
        }
        // If we can't extract a value, orderValue remains empty and will use state
      }
    }

    // Use override values if we successfully extracted them, otherwise fall back to state
    const finalTracking = (trackingValue || trackingNumber || '').trim();
    const finalOrder = (orderValue || orderNumber || '').trim();

    if (!finalTracking && !finalOrder) {
      setError(language === 'ar' ? 'يرجى إدخال رقم التتبع أو رقم الطلب' : 'Please enter tracking number or order number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get token if available (optional for guest tracking)
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0] || document.cookie.split('__Host-token=')[1]?.split(';')[0])
        : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Build query parameters - ensure we only add string values
      const params = new URLSearchParams();
      if (finalTracking && typeof finalTracking === 'string') {
        params.set('tracking', finalTracking);
      }
      if (finalOrder && typeof finalOrder === 'string') {
        params.set('order', finalOrder);
      }

      // Call API to get real tracking data
      const response = await fetch(`/api/account/track-order?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 404) {
          setError(language === 'ar' ? 'الطلب غير موجود' : 'Order not found');
        } else {
          setError(errorData.error || (language === 'ar' ? 'حدث خطأ أثناء البحث عن الطلب' : 'Error occurred while searching for order'));
        }
        setTrackingInfo(null);
        return;
      }

      const data = await response.json();
      setTrackingInfo(data);
    } catch (error) {
      console.error('Error tracking order:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء البحث عن الطلب' : 'Error occurred while searching for order');
      setTrackingInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: {
        text: language === 'ar' ? 'في الانتظار' : 'Pending',
        color: 'text-yellow-600 bg-yellow-100',
        icon: Clock
      },
      processing: {
        text: language === 'ar' ? 'قيد المعالجة' : 'Processing',
        color: 'text-blue-600 bg-blue-100',
        icon: Package
      },
      shipped: {
        text: language === 'ar' ? 'تم الشحن' : 'Shipped',
        color: 'text-purple-600 bg-purple-100',
        icon: Truck
      },
      out_for_delivery: {
        text: language === 'ar' ? 'في الطريق للتسليم' : 'Out for Delivery',
        color: 'text-orange-600 bg-orange-100',
        icon: Truck
      },
      delivered: {
        text: language === 'ar' ? 'تم التسليم' : 'Delivered',
        color: 'text-green-600 bg-green-100',
        icon: CheckCircle
      }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getTimelineIcon = (status: string, completed: boolean) => {
    if (completed) {
      const iconMap = {
        pending: Clock,
        processing: Package,
        shipped: Truck,
        out_for_delivery: Truck,
        delivered: CheckCircle
      };
      const Icon = iconMap[status as keyof typeof iconMap] || CheckCircle;
      return <Icon className="w-5 h-5 text-white" />;
    }

    const iconMap = {
      pending: Clock,
      processing: Package,
      shipped: Truck,
      out_for_delivery: Truck,
      delivered: CheckCircle
    };

    const Icon = iconMap[status as keyof typeof iconMap] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'تتبع الطلب' : 'Track Order'}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {language === 'ar' ? 'البحث عن طلبك' : 'Search for Your Order'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رقم التتبع' : 'Tracking Number'}
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل رقم التتبع' : 'Enter tracking number'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
              />
            </div>

            <div className="text-center text-gray-500">
              {language === 'ar' ? 'أو' : 'OR'}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رقم الطلب' : 'Order Number'}
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل رقم الطلب' : 'Enter order number'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => handleTrack()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isLoading
                ? (language === 'ar' ? 'جاري البحث...' : 'Searching...')
                : (language === 'ar' ? 'تتبع الطلب' : 'Track Order')
              }
            </button>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'ar' ? 'طلب رقم' : 'Order'} #{trackingInfo.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'رقم التتبع:' : 'Tracking Number:'} {trackingInfo.trackingNumber}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusInfo = getStatusInfo(trackingInfo.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.text}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {(trackingInfo.currentLocation || trackingInfo.currentLocationAr) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      <strong>{language === 'ar' ? 'الموقع الحالي:' : 'Current Location:'}</strong>{' '}
                      {language === 'ar' && trackingInfo.currentLocationAr
                        ? trackingInfo.currentLocationAr
                        : trackingInfo.currentLocation}
                    </span>
                  </div>
                </div>
              )}

              {trackingInfo.estimatedDelivery && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      <strong>{language === 'ar' ? 'التسليم المتوقع:' : 'Estimated Delivery:'}</strong>{' '}
                      {new Date(trackingInfo.estimatedDelivery).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {language === 'ar' ? 'مسار التتبع' : 'Tracking Timeline'}
              </h3>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-8">
                  {trackingInfo.timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 relative">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${item.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                        {getTimelineIcon(item.status, item.completed)}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h4 className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                              {language === 'ar' ? item.descriptionAr : item.description}
                            </h4>
                            {item.timestamp && (
                              <span className="text-sm text-gray-500">
                                {new Date(item.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'تحتاج مساعدة؟' : 'Need Help?'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'ar'
              ? 'إذا كنت تواجه مشاكل في تتبع طلبك، يرجى الاتصال بخدمة العملاء.'
              : 'If you\'re having trouble tracking your order, please contact customer service.'
            }
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                // Open WhatsApp with tracking order message
                const orderRef = trackingInfo?.orderNumber || orderNumber || trackingNumber;
                const message = language === 'ar'
                  ? `مرحباً، أحتاج مساعدة بخصوص تتبع طلبي${orderRef ? ` رقم ${orderRef}` : ''}`
                  : `Hello, I need help with tracking my order${orderRef ? ` #${orderRef}` : ''}`;
                const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
                const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
            >
              <Package className="w-4 h-4" />
              {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
            </button>
            <button
              onClick={() => {
                // Refresh tracking if we have order info
                // Use trackingInfo if available, otherwise use state values
                // Ensure we extract string values only
                const orderRefValue = trackingInfo?.orderNumber;
                const trackNumValue = trackingInfo?.trackingNumber;

                const orderRef = (typeof orderRefValue === 'string' ? orderRefValue : null) || orderNumber || trackingNumber;
                const trackNum = (typeof trackNumValue === 'string' ? trackNumValue : null) || trackingNumber || orderNumber;

                if (orderRef || trackNum) {
                  // Call handleTrack with the values directly (guaranteed to be strings)
                  handleTrack(trackNum, orderRef);
                } else {
                  // Clear and reset
                  setTrackingInfo(null);
                  setError('');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#DAA520] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
