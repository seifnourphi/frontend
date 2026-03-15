import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* -------------------------------------------------
   Tailwind Class Combiner
-------------------------------------------------- */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------
   Price Formatters
-------------------------------------------------- */
export function formatPrice(
  price: number | null | undefined,
  locale: string = 'ar-EG',
  language: string = 'ar'
): string {
  // Handle invalid values (NaN, null, undefined)
  if (price === null || price === undefined || isNaN(Number(price))) {
    const formatted = '0';
    if (language === 'ar') {
      return `ج.م ${formatted}`;
    } else {
      return `EGP ${formatted}`;
    }
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(Number(price));

  if (language === 'ar') {
    return `ج.م ${formatted}`;
  } else {
    return `EGP ${formatted}`;
  }
}

export const formatPriceWithLanguage = formatPrice;

/* -------------------------------------------------
   Discount Calculator
-------------------------------------------------- */
export function calculateDiscountedPrice(price: number, discountPercent: number): number {
  const discountAmount = (price * discountPercent) / 100;
  return Math.max(0, price - discountAmount);
}

/* -------------------------------------------------
   Debounce & Throttle
-------------------------------------------------- */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/* -------------------------------------------------
   Order & WhatsApp Utilities
-------------------------------------------------- */
export function generateWhatsAppLink(phone: string, message: string): string {
  const sanitizedPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
}

export function formatWhatsAppMessage(data: any): string {
  const {
    productName,
    sku,
    price,
    quantity,
    selectedSize,
    selectedColor,
    customerName,
    customerPhone,
    customerAddress,
    orderReference,
    discountPercent,
  } = data;

  let message = `*طلب جديد*\n\n`;
  message += `*رقم الطلب:* ${orderReference}\n`;
  message += `*المنتج:* ${productName}\n`;
  if (sku) message += `*SKU:* ${sku}\n`;
  message += `*الكمية:* ${quantity}\n`;
  if (selectedSize) message += `*المقاس:* ${selectedSize}\n`;
  if (selectedColor) message += `*اللون:* ${selectedColor}\n`;
  message += `*السعر:* ${price} ج.م\n`;
  if (discountPercent) message += `*الخصم:* ${discountPercent}%\n`;
  message += `*الإجمالي:* ${price * quantity} ج.م\n\n`;
  message += `*بيانات العميل:*\n`;
  message += `*الاسم:* ${customerName}\n`;
  message += `*الهاتف:* ${customerPhone}\n`;
  message += `*العنوان:* ${customerAddress}\n`;

  return message;
}

export function generateOrderReference(): string {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}
