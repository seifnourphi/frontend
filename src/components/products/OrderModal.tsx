'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { formatPrice, generateWhatsAppLink, formatWhatsAppMessage, generateOrderReference } from '@/lib/utils';
import { validateInput, orderSchema, sanitizeText, sanitizePhone } from '@/lib/validation';
import { X, Phone } from 'lucide-react';

interface Product {
  id: string | number;
  name: string;
  nameAr: string;
  sku: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  variants?: {
    type: 'SIZE' | 'COLOR';
    value: string;
    valueAr?: string;
  }[];
}

interface OrderModalProps {
  product: Product;
  onClose: () => void;
}

interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export function OrderModal({ product, onClose }: OrderModalProps) {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState<OrderForm>({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    quantity: 1,
    selectedSize: '',
    selectedColor: '',
  });
  const [errors, setErrors] = useState<Partial<OrderForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizes = (product.variants || []).filter(v => v.type === 'SIZE');
  const colors = (product.variants || []).filter(v => v.type === 'COLOR');
  const displayPrice = product.salePrice || product.price;

  const handleInputChange = (field: keyof OrderForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderForm> = {};

    // Validate required fields
    if (!formData.customerName.trim()) {
      newErrors.customerName = t('order.required');
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = t('order.required');
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
      newErrors.customerPhone = t('order.invalidPhone');
    }

    if (!formData.customerAddress.trim()) {
      newErrors.customerAddress = t('order.required');
    }

    if (sizes.length > 0 && !formData.selectedSize) {
      newErrors.selectedSize = t('order.required');
    }

    if (colors.length > 0 && !formData.selectedColor) {
      newErrors.selectedColor = t('order.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize input data
      const sanitizedData = {
        customerName: sanitizeText(formData.customerName),
        customerPhone: sanitizePhone(formData.customerPhone),
        customerAddress: sanitizeText(formData.customerAddress),
        productId: product.id.toString(),
        quantity: formData.quantity,
        selectedSize: formData.selectedSize ? sanitizeText(formData.selectedSize) : undefined,
        selectedColor: formData.selectedColor ? sanitizeText(formData.selectedColor) : undefined,
      };

      // Validate with Joi schema
      const validation = validateInput(orderSchema, sanitizedData);
      if (validation.error) {
        alert(validation.error);
        return;
      }

      // Generate order reference
      const orderReference = generateOrderReference();

      // Save order to database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitizedData,
          orderReference,
          totalPrice: displayPrice * formData.quantity,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to save order');
      }

      // Generate WhatsApp message
      const whatsappMessage = formatWhatsAppMessage({
        productName: language === 'ar' ? product.nameAr : product.name,
        sku: product.sku,
        price: displayPrice,
        quantity: formData.quantity,
        selectedSize: formData.selectedSize,
        selectedColor: formData.selectedColor,
        customerName: sanitizedData.customerName,
        customerPhone: sanitizedData.customerPhone,
        customerAddress: sanitizedData.customerAddress,
        orderReference,
        discountPercent: product.discountPercent,
      });

      // Get WhatsApp business number from environment
      const businessNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+1234567890';
      const whatsappLink = generateWhatsAppLink(businessNumber, whatsappMessage);

      // Open WhatsApp
      window.open(whatsappLink, '_blank');

      // Close modal
      onClose();

      // Show success message
      alert(t('order.success'));

    } catch (error) {
      console.error('Order submission error:', error);
      alert(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('order.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">
            {t('order.productInfo')}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-1">
              {language === 'ar' ? product.nameAr : product.name}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {t('products.sku')}: {product.sku}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary-600">
                {formatPrice(displayPrice, 'ar-EG', language)}
              </span>
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.price, 'ar-EG', language)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">
            {t('order.customerInfo')}
          </h3>

          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label htmlFor="order-customer-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.customerName')} *
              </label>
              <input
                id="order-customer-name"
                name="customerName"
                type="text"
                autoComplete="name"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`input ${errors.customerName ? 'border-red-500' : ''}`}
                placeholder="الاسم الكامل"
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <label htmlFor="order-customer-phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.customerPhone')} *
              </label>
              <input
                id="order-customer-phone"
                name="customerPhone"
                type="tel"
                autoComplete="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className={`input ${errors.customerPhone ? 'border-red-500' : ''}`}
                placeholder="+20 123 456 7890"
                dir="ltr"
              />
              {errors.customerPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>
              )}
            </div>

            {/* Customer Address */}
            <div>
              <label htmlFor="order-customer-address" className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.customerAddress')} *
              </label>
              <textarea
                id="order-customer-address"
                name="customerAddress"
                autoComplete="street-address"
                value={formData.customerAddress}
                onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                rows={3}
                className={`input resize-none ${errors.customerAddress ? 'border-red-500' : ''}`}
                placeholder="العنوان الكامل للتوصيل"
              />
              {errors.customerAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.customerAddress}</p>
              )}
            </div>

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <label htmlFor="order-select-size" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('order.selectSize')} *
                </label>
                <select
                  id="order-select-size"
                  name="selectedSize"
                  value={formData.selectedSize}
                  onChange={(e) => handleInputChange('selectedSize', e.target.value)}
                  className={`input ${errors.selectedSize ? 'border-red-500' : ''}`}
                >
                  <option value="">{t('order.selectSize')}</option>
                  {sizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {language === 'ar' ? size.valueAr : size.value}
                    </option>
                  ))}
                </select>
                {errors.selectedSize && (
                  <p className="text-red-500 text-xs mt-1">{errors.selectedSize}</p>
                )}
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <label htmlFor="order-select-color" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('order.selectColor')} *
                </label>
                <select
                  id="order-select-color"
                  name="selectedColor"
                  value={formData.selectedColor}
                  onChange={(e) => handleInputChange('selectedColor', e.target.value)}
                  className={`input ${errors.selectedColor ? 'border-red-500' : ''}`}
                >
                  <option value="">{t('order.selectColor')}</option>
                  {colors.map((color) => (
                    <option key={color.value} value={color.value}>
                      {language === 'ar' ? color.valueAr : color.value}
                    </option>
                  ))}
                </select>
                {errors.selectedColor && (
                  <p className="text-red-500 text-xs mt-1">{errors.selectedColor}</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.quantity')}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>

            {/* Total Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{t('common.total')}:</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatPrice(displayPrice * formData.quantity, 'ar-EG', language)}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Notice */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Phone className="w-5 h-5" />
              <span className="text-sm font-medium">
                {t('order.whatsappRedirect')}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-6 whatsapp-btn ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z" />
                </svg>
                <span>{t('order.submit')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
