/**
 * validation.ts
 * 
 * Centralized validation schemas and helpers for the application.
 * Note: These should be kept in sync with backend validation.
 */

export const orderSchema = {
    customerName: { required: true, min: 3, max: 100 },
    customerPhone: { required: true, pattern: /^\+?[1-9]\d{1,14}$/ },
    customerAddress: { required: true, min: 5, max: 500 },
    productId: { required: true },
    quantity: { required: true, min: 1, max: 10 },
    selectedSize: { required: false },
    selectedColor: { required: false },
};

export function validateInput(schema: any, data: any): { error: string | null } {
    for (const [key, rules] of Object.entries(schema)) {
        const val = data[key];
        const r = rules as any;

        if (r.required && (val === undefined || val === null || val === '')) {
            return { error: `Field ${key} is required` };
        }

        if (typeof val === 'string') {
            if (r.min && val.length < r.min) {
                return { error: `${key} must be at least ${r.min} characters long` };
            }
            if (r.max && val.length > r.max) {
                return { error: `${key} must be less than ${r.max} characters` };
            }
            if (r.pattern && !r.pattern.test(val)) {
                return { error: `Invalid ${key} format` };
            }
        }
    }
    return { error: null };
}

export function sanitizeText(text: string): string {
    if (!text) return '';
    return text.trim().replace(/[<>]/g, '');
}

export function sanitizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
}
